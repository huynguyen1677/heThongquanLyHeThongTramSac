import { EnergyCalculator } from './EnergyCalculator.js';
import { ChargingTimer } from './ChargingTimer.js';
import { PricingService } from './PricingService.js';
import { ChargingStateManager } from './ChargingStateManager.js';

export class MeterService {
  constructor(connectorId, messageService) {
    this.connectorId = connectorId;
    this.messageService = messageService;

    // Khởi tạo các service components
    this.energyCalculator = new EnergyCalculator();
    this.chargingTimer = new ChargingTimer(connectorId);
    this.pricingService = new PricingService();
    this.stateManager = new ChargingStateManager(37.23);

    // Thông tin phiên sạc
    this.transactionId = null;
    this.idTag = null;
    this.meterStart = 0;
    this.currentMeterValue = 0;
    this.basePowerKw = 30;
    this.interval = 5000;

    // Callback để thông báo status change
    this.onStatusChange = null;

    console.log(`🔧 [MeterService-${connectorId}] Initialized`);
  }

  /**
   * Bắt đầu metering cho một transaction
   */
  start(transactionId, meterStart, powerKw = 30, intervalSeconds = 2, idTag = null) {
    try {
      if (this.chargingTimer.isActive()) {
        this.stop();
      }

      this.transactionId = transactionId;
      this.idTag = idTag;
      this.meterStart = meterStart;
      this.currentMeterValue = meterStart;
      this.basePowerKw = powerKw;
      this.interval = intervalSeconds * 1000;

      // Reset và cấu hình các components
      this.energyCalculator = new EnergyCalculator(powerKw);
      this.stateManager.reset();
      this.stateManager.setPricePerKwh(this.pricingService.getPricePerKwh());

      this.log(`🔋 Started meter service for transaction ${transactionId}, power: ${powerKw}kW, user: ${idTag}`);

      // Start timer với callback
      this.chargingTimer.start(() => {
        this.processMeterValues();
      }, this.interval);

      return true;
    } catch (error) {
      this.log(`❌ Error starting meter service: ${error.message}`, 'error');
      return false;
    }
  }

  /**
   * Dừng metering
   */
  stop() {
    try {
      if (this.chargingTimer) {
        this.chargingTimer.stop();
      }
      
      if (this.transactionId) {
        this.log(`🔋 Stopped meter service for transaction ${this.transactionId}`);
      }

      // Reset all values
      this.transactionId = null;
      this.idTag = null;
      this.meterStart = 0;
      this.currentMeterValue = 0;
      
      // Reset state manager
      if (this.stateManager) {
        this.stateManager.reset();
      }
      
      return true;
    } catch (error) {
      this.log(`❌ Error stopping meter service: ${error.message}`, 'error');
      return false;
    }
  }

  /**
   * Tạm dừng metering
   */
  pause() {
    try {
      this.chargingTimer.pause();
      if (this.transactionId) {
        this.log(`⏸️ Paused meter service for transaction ${this.transactionId}`);
      }
      return true;
    } catch (error) {
      this.log(`❌ Error pausing meter service: ${error.message}`, 'error');
      return false;
    }
  }

  /**
   * Tiếp tục metering
   */
  resume() {
    try {
      if (!this.transactionId) {
        this.log('❌ Cannot resume - no active transaction', 'error');
        return false;
      }

      this.log(`▶️ Resumed meter service for transaction ${this.transactionId}`);
      this.chargingTimer.resume(() => {
        this.processMeterValues();
      });
      
      return true;
    } catch (error) {
      this.log(`❌ Error resuming meter service: ${error.message}`, 'error');
      return false;
    }
  }

  /**
   * Đặt công suất mới
   */
  setPower(newPowerKw) {
    try {
      this.basePowerKw = Math.max(0, newPowerKw);
      this.log(`⚡ Power updated to ${this.basePowerKw}kW`);
      return true;
    } catch (error) {
      this.log(`❌ Error setting power: ${error.message}`, 'error');
      return false;
    }
  }

  /**
   * Xử lý và gửi meter values
   */
  async processMeterValues() {
    if (!this.chargingTimer.isActive() || !this.transactionId) {
      return;
    }

    try {
      // 1. Tính toán năng lượng
      const chargingTimeMinutes = this.chargingTimer.getElapsedMinutes();
      const currentPowerKw = this.energyCalculator.calculateCurrentPowerKw(chargingTimeMinutes, this.basePowerKw);
      const deltaWh = this.energyCalculator.calculateEnergyConsumption(currentPowerKw, this.interval);
      
      this.currentMeterValue += deltaWh;
      const energyKwh = this.getEnergyConsumed();

      // 2. Cập nhật state manager
      this.stateManager.updateEnergyState(energyKwh, currentPowerKw);

      // 3. Gửi meter values qua message service (nếu có)
      if (this.messageService) {
        await this.messageService.sendMeterValues(
          this.connectorId,
          this.transactionId, 
          this.currentMeterValue, 
          currentPowerKw
        );

        // 4. Gửi realtime data với đầy đủ thông tin
        const currentStats = this.getChargingStats();
        await this.messageService.sendDataTransfer(
          'RealtimeUpdate',
          'ChargeThreshold',
          {
            connectorId: this.connectorId,
            transactionId: this.transactionId,
            fullChargeThresholdKwh: this.stateManager.getFullChargeThreshold(),
            currentEnergyKwh: energyKwh,
            // Thêm thông tin đầy đủ từ charging stats
            duration: currentStats.duration,
            estimatedCost: currentStats.estimatedCost,
            powerKw: currentStats.powerKw,
            timestamp: new Date().toISOString()
          }
        );
      }

      // 5. Kiểm tra sạc đầy
      if (this.stateManager.isFullyCharged(energyKwh)) {
        this.log(`✅ Battery fully charged (${energyKwh.toFixed(2)} kWh)`);
        
        // Thông báo status change qua callback
        if (this.onStatusChange) {
          this.onStatusChange('FullyCharged');
        }
        
        this.stop();
      }

    } catch (error) {
      this.log(`❌ Error processing meter values: ${error.message}`, 'error');
    }
  }

  /**
   * Lấy stats để hiển thị UI
   */
  getChargingStats() {
    const defaultStats = {
      transactionId: null,
      currentMeterValue: 0,
      energyKwh: 0,
      powerKw: 0,
      duration: '00:00:00',
      estimatedCost: 0,
      isRunning: false,
      fullChargeThresholdKwh: 37.23,
      pricePerKwh: 0,
      idTag: null
    };

    try {
      if (!this.stateManager || !this.chargingTimer) {
        return defaultStats;
      }

      // Safely get duration with fallback
      let duration = '00:00:00';
      try {
        if (this.chargingTimer && typeof this.chargingTimer.getDuration === 'function') {
          duration = this.chargingTimer.getDuration() || '00:00:00';
        }
      } catch (durationError) {
        console.warn(`⚠️ [MeterService-${this.connectorId}] Error getting duration:`, durationError);
        duration = '00:00:00';
      }

      return {
        transactionId: this.transactionId,
        currentMeterValue: this.getCurrentMeterValue(),
        energyKwh: this.getEnergyConsumed(),
        powerKw: this.stateManager.getCurrentPowerKw() || 0,
        duration: duration,
        estimatedCost: this.stateManager.getEstimatedCost() || 0,
        isRunning: this.isActive(),
        fullChargeThresholdKwh: this.stateManager.getFullChargeThreshold() || 37.23,
        pricePerKwh: this.stateManager.getPricePerKwh() || 0,
        idTag: this.idTag
      };
    } catch (error) {
      console.warn(`⚠️ [MeterService-${this.connectorId}] Error in getChargingStats:`, error);
      return defaultStats;
    }
  }

  /**
   * Set callback cho status change
   */
  setStatusChangeCallback(callback) {
    this.onStatusChange = callback;
  }

  /**
   * Các helper methods
   */
  getEnergyConsumed() {
    try {
      return this.energyCalculator.whToKwh(this.currentMeterValue - this.meterStart);
    } catch (error) {
      console.warn(`⚠️ [MeterService-${this.connectorId}] Error calculating energy:`, error);
      return 0;
    }
  }

  getCurrentMeterValue() {
    try {
      return this.energyCalculator.roundEnergy(this.currentMeterValue);
    } catch (error) {
      console.warn(`⚠️ [MeterService-${this.connectorId}] Error getting meter value:`, error);
      return this.currentMeterValue || 0;
    }
  }

  isActive() {
    try {
      return this.chargingTimer && this.chargingTimer.isActive();
    } catch (error) {
      console.warn(`⚠️ [MeterService-${this.connectorId}] Error checking active state:`, error);
      return false;
    }
  }

  setPricePerKwh(price) {
    try {
      this.pricingService.setPricePerKwh(price);
      this.stateManager.setPricePerKwh(price);
      this.log(`💲 Price updated: ${price} VND/kWh`);
      return true;
    } catch (error) {
      this.log(`❌ Error setting price: ${error.message}`, 'error');
      return false;
    }
  }

  async updatePriceFromApi(apiUrl) {
    try {
      const price = await this.pricingService.updatePriceFromApi(apiUrl);
      if (price) {
        this.stateManager.setPricePerKwh(price);
        this.log(`💲 Price updated from API: ${price} VND/kWh`);
        return price;
      }
      return null;
    } catch (error) {
      this.log(`❌ Error updating price from API: ${error.message}`, 'error');
      return null;
    }
  }

  log(message, level = 'info') {
    const timestamp = new Date().toISOString();
    const logMessage = `[MeterService-${this.connectorId}] ${message}`;
    
    if (level === 'error') {
      console.error(`[${timestamp}] ${logMessage}`);
    } else {
      console.log(`[${timestamp}] ${logMessage}`);
    }
  }
}