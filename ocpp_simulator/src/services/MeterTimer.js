import { fetchPricePerKwh } from '../api/priceApi.js';

export class MeterTimer {
    /**
   * Constructor của MeterTimer.
   * @param {number} connectorId - ID của cổng sạc.
   * @param {OcppClient} ocppClient - Đối tượng client để gửi tin nhắn OCPP.
   */

  constructor(connectorId, ocppClient) {
    this.ocppClient = ocppClient;
    this.connectorId = connectorId;

    this.timer = null; // Để lưu ID của setInterval
    this.isRunning = false; // Cờ cho biết timer có đang chạy không
    this.interval = 5000; // Mặc định gửi MeterValues mỗi 5 giây

    // Các thông tin về phiên sạc hiện tại
    this.transactionId = null;
    this.meterStart = 0; // Giá trị meter lúc bắt đầu
    this.currentMeterValue = 0; // Giá trị meter hiện tại (tính bằng Wh)
    this.powerKw = 11; // Công suất sạc mặc định (kW)
    this.startTime = null; // Thời điểm bắt đầu sạc
    this.pausedTime = 0; // Tổng thời gian đã pause (ms)
    this.pauseStartTime = null; // Thời điểm bắt đầu pause
    this.pricePerKwh = null; // Giá điện sẽ được cập nhật động

    // Thêm thuộc tính ngưỡng sạc đầy (ví dụ: 40 kWh)
    this.fullChargeThresholdKwh = 2; // Có thể chỉnh theo loại xe
  }

  /**
   * Bắt đầu bộ đếm thời gian cho một phiên sạc.
   * @param {number} transactionId - ID của phiên giao dịch.
   * @param {number} meterStart - Giá trị meter lúc bắt đầu (Wh).
   * @param {number} powerKw - Công suất sạc (kW).
   * @param {number} intervalSeconds - Chu kỳ gửi MeterValues (giây).
   */

  /**
   * Lấy giá điện từ API và cập nhật vào MeterTimer.
   * @param {string} apiUrl - Đường dẫn API trả về { pricePerKwh: number }
   */
  async updatePricePerKwhFromApi(apiUrl) {
    const price = await fetchPricePerKwh(apiUrl);
    if (price) {
      this.setPricePerKwh(price);
    } else {
      this.log('❌ Không lấy được giá điện hợp lệ từ API', 'error');
    }
  }

  /**
   * Cập nhật giá điện cho MeterTimer.
   * @param {number} newPrice
   */
  setPricePerKwh(newPrice) {
    this.pricePerKwh = newPrice;
    this.log(`💲 Giá điện cập nhật: ${newPrice} VND/kWh`);
  }

  // Start meter timer for a transaction
  start(transactionId, meterStart, powerKw = 11, intervalSeconds = 2, currentMeterValue = null) {
    if (this.isRunning) {
      this.stop();
    }

    this.transactionId = transactionId;
    this.meterStart = meterStart;
    this.currentMeterValue = currentMeterValue !== null ? currentMeterValue : meterStart;
    this.powerKw = powerKw;
    this.interval = intervalSeconds * 1000;
    this.startTime = new Date();
    this.isRunning = true;

    this.log(`🔋 Bắt đầu meter timer cho transaction ${transactionId}, công suất: ${powerKw}kW`);

    // Gửi giá trị meter đầu tiên ngay lập tức
    this.sendMeterValues();

    // Lên lịch gửi định kỳ
    this.timer = setInterval(() => {
      this.sendMeterValues();
    }, this.interval);
  }

  /**
   * Dừng bộ đếm thời gian.
   */
  stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this.isRunning = false;
    
    // Reset pause tracking
    this.pausedTime = 0;
    this.pauseStartTime = null;
    
    if (this.transactionId) {
      this.log(`🔋 Đã dừng meter timer cho transaction ${this.transactionId}`);
    }
  }

  /**
   * Tạm dừng bộ đếm (khi suspend).
   */
  pause() {
    console.log(`🔍 [DEBUG] pause() called for connector ${this.connectorId}, current isRunning: ${this.isRunning}`);
    
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
      console.log(`🔍 [DEBUG] Timer interval cleared for connector ${this.connectorId}`);
    }
    
    this.isRunning = false;
    this.pauseStartTime = new Date(); // Ghi lại thời điểm bắt đầu pause
    
    console.log(`🔍 [DEBUG] isRunning set to false for connector ${this.connectorId}`);
    
    if (this.transactionId) {
      this.log(`⏸️ Tạm dừng meter timer cho transaction ${this.transactionId} - isRunning: ${this.isRunning}`);
    }
  }

  /**
   * Tiếp tục bộ đếm (khi resume từ suspend).
   */
  resume() {
    if (!this.transactionId) {
      this.log('❌ Không thể resume - không có transaction ID', 'error');
      return;
    }

    if (this.isRunning) {
      this.log('⚠️ Timer đã đang chạy', 'info');
      return;
    }

    // Tính thời gian pause và cộng vào tổng thời gian pause
    if (this.pauseStartTime) {
      const pauseDuration = new Date() - this.pauseStartTime;
      this.pausedTime += pauseDuration;
      this.pauseStartTime = null;
      this.log(`⏱️ Thời gian pause: ${Math.round(pauseDuration / 1000)}s, tổng pause: ${Math.round(this.pausedTime / 1000)}s`);
    }

    this.isRunning = true;
    this.log(`▶️ Tiếp tục meter timer cho transaction ${this.transactionId}`);

    // Gửi giá trị meter ngay lập tức
    this.sendMeterValues();

    // Lên lịch gửi định kỳ
    this.timer = setInterval(() => {
      this.sendMeterValues();
    }, this.interval);
  }

  // Hàm để tính công suất hiện tại
  calculateCurrentPowerKw(chargingTimeMinutes) {
    let currentPowerKw = this.powerKw;
    if (chargingTimeMinutes < 1) {
      currentPowerKw = this.powerKw * (chargingTimeMinutes / 1);
    } else if (chargingTimeMinutes > 30) {
      const fadeStart = 30;
      const fadeMinutes = chargingTimeMinutes - fadeStart;
      const fadeFactor = Math.max(0.3, 1 - (fadeMinutes / 60));
      currentPowerKw = this.powerKw * fadeFactor;
    }
    // Thêm biến động ngẫu nhiên ±10%
    const variation = 0.9 + (Math.random() * 0.2);
    currentPowerKw = Math.max(0, currentPowerKw * variation);
    return currentPowerKw;
  }

  /**
   * Lấy các thông số sạc hiện tại để hiển thị trên UI.
   * @returns {object}
   */
  getChargingStats() {
    const energyKwh = (this.currentMeterValue - this.meterStart) / 1000;
    const cost = energyKwh * (this.pricePerKwh || 0); // Sử dụng 0 nếu pricePerKwh là null

    let currentPowerKw = this.powerKw;
    if (this.startTime) {
      const chargingTimeMinutes = (new Date() - this.startTime) / (1000 * 60);
      currentPowerKw = this.calculateCurrentPowerKw(chargingTimeMinutes);
    }

    return {
      transactionId: this.transactionId,
      currentMeterValue: Math.round(this.currentMeterValue),
      energyKwh: energyKwh,
      powerKw: Math.round(currentPowerKw * 100) / 100, // Công suất thực tế hiện tại
      duration: this.getChargingDurationInSeconds(), // Sử dụng method mới trả về số giây
      estimatedCost: cost.toFixed(0),
      isRunning: this.isRunning,
      pricePerKwh: this.pricePerKwh || 0, // Trả về 0 nếu chưa có giá điện
      fullChargeThresholdKwh: this.fullChargeThresholdKwh // Thêm ngưỡng sạc đầy
    };
  }

  /**
   * Lấy thời gian sạc đã trôi qua tính bằng giây.
   * @returns {number} Số giây đã sạc.
   */
  getChargingDurationInSeconds() {
    if (!this.startTime) return 0;

    let diffMs = new Date() - this.startTime;
    
    // Trừ đi tổng thời gian đã pause
    diffMs -= this.pausedTime;
    
    // Nếu đang pause, trừ thêm thời gian pause hiện tại
    if (this.pauseStartTime) {
      diffMs -= (new Date() - this.pauseStartTime);
    }
    
    // Đảm bảo không âm và chuyển đổi sang giây
    return Math.max(0, Math.floor(diffMs / 1000));
  }

  /**
   * Lấy thời gian sạc đã trôi qua.
   * @returns {string} Chuỗi thời gian "HH:MM:SS".
   */
  getChargingDuration() {
    if (!this.startTime) return '00:00:00';

    let diffMs = new Date() - this.startTime;
    
    // Trừ đi tổng thời gian đã pause
    diffMs -= this.pausedTime;
    
    // Nếu đang pause, trừ thêm thời gian pause hiện tại
    if (this.pauseStartTime) {
      diffMs -= (new Date() - this.pauseStartTime);
    }
    
    // Đảm bảo không âm
    diffMs = Math.max(0, diffMs);

    const hours = Math.floor(diffMs / 3600000).toString().padStart(2, '0');
    const minutes = Math.floor((diffMs % 3600000) / 60000).toString().padStart(2, '0');
    const seconds = Math.floor((diffMs % 60000) / 1000).toString().padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
  }

  /**
   * Lấy giá trị meter hiện tại.
   * @returns {number}
   */
  getCurrentMeterValue() {
    return Math.round(this.currentMeterValue);
  }

  /**
   * Kiểm tra xem timer có đang chạy không.
   * @returns {boolean}
   */
  isActive() {
    return this.isRunning;
  }

  /**
   * Ghi log ra console để debug.
   * @param {string} message - Nội dung log.
   * @param {'info' | 'error'} level - Cấp độ log.
   */
  log(message, level = 'info') {
    const timestamp = new Date().toISOString();
    const logMessage = `[Meter-${this.connectorId}] ${message}`;
    
    if (level === 'error') {
      console.error(`[${timestamp}] ${logMessage}`);
    } else {
      console.log(`[${timestamp}] ${logMessage}`);
    }
  }

  // Update power during charging
  setPower(powerKw) {
    this.powerKw = powerKw;
    this.log(`⚡ Power updated to ${powerKw}kW`);
  }

  /**
   * Tính toán và gửi tin nhắn MeterValues.
   */
  sendMeterValues() {
    console.log(`🔍 [DEBUG] sendMeterValues called for connector ${this.connectorId}: isRunning=${this.isRunning}, transactionId=${this.transactionId}`);
    
    if (!this.isRunning || !this.transactionId) {
      this.log(`⏭️ Bỏ qua sendMeterValues: isRunning=${this.isRunning}, transactionId=${this.transactionId}`);
      return;
    }
    const chargingTimeMinutes = (new Date() - this.startTime) / (1000 * 60);
    let currentPowerKw = this.calculateCurrentPowerKw(chargingTimeMinutes);

    // 2. Tính toán lượng điện năng tiêu thụ trong chu kỳ vừa qua
    const deltaTimeHours = this.interval / (1000 * 60 * 60); // Đổi mili-giây sang giờ
    const deltaWh = currentPowerKw * 1000 * deltaTimeHours; // Đổi kW sang W, rồi tính Wh 

    // 3. Cập nhật tổng giá trị meter
    this.currentMeterValue += deltaWh;

    // 4. Tạo payload theo chuẩn OCPP 1.6-J
    const payload = {
      connectorId: this.connectorId,
      transactionId: this.transactionId,
      meterValue: [
        {
          timestamp: new Date().toISOString(),
          sampledValue: [
            {
              // Tổng năng lượng đã sạc (luôn tăng)
              value: Math.round(this.currentMeterValue).toString(),
              measurand: 'Energy.Active.Import.Register',
              unit: 'Wh'
            },
            {
              // Công suất sạc tức thời (thay đổi theo thời gian)
              value: Math.round(currentPowerKw * 1000).toString(),
              measurand: 'Power.Active.Import',
              unit: 'W'
            }
          ]
        }
      ]
    };

    // 5. Gửi tin nhắn đi bằng ocppClient
    this.ocppClient.sendCall('MeterValues', payload)
      .catch((error) => {
        this.log(`❌ Lỗi khi gửi meter values: ${error.message}`, 'error');
      });

    // 5.1. Gửi thông tin ngưỡng sạc đầy lên realtime database
    const energyKwh = this.getEnergyConsumed();
    const realtimeData = {
      connectorId: this.connectorId,
      transactionId: this.transactionId,
      fullChargeThresholdKwh: this.fullChargeThresholdKwh,
      currentEnergyKwh: energyKwh,
      timestamp: new Date().toISOString()
    };

    this.log(`🚀 Sending DataTransfer: ${JSON.stringify(realtimeData)}`);
    
    this.ocppClient.sendCall('DataTransfer', {
      vendorId: 'RealtimeUpdate',
      messageId: 'ChargeThreshold',
      data: JSON.stringify(realtimeData)
    }).then((response) => {
      this.log(`✅ DataTransfer response: ${JSON.stringify(response)}`);
    }).catch((error) => {
      this.log(`❌ Lỗi khi gửi threshold data: ${error.message}`, 'error');
    });

    // 6. Kiểm tra trạng thái sạc đầy
    if (energyKwh >= this.fullChargeThresholdKwh) {
      // Gửi trạng thái sạc đầy về backend (StatusNotification)
      this.ocppClient.sendCall('StatusNotification', {
        connectorId: this.connectorId,
        status: 'FullyCharged', // hoặc 'ChargingComplete'
        timestamp: new Date().toISOString()
      }).catch((error) => {
        this.log(`❌ Lỗi khi gửi trạng thái FullyCharged: ${error.message}`, 'error');
      });

      this.log(`✅ Xe đã sạc đầy (${energyKwh.toFixed(2)} kWh) - Dừng timer!`);
      this.stop(); // Dừng tiến trình sạc
    }
  }

  // Get energy consumed in kWh
  getEnergyConsumed() {
    return (this.currentMeterValue - this.meterStart) / 1000;
  }


  // Calculate estimated cost (flat rate)
  getEstimatedCost() {
    const pricePerKwh = this.pricePerKwh || 0; // Lấy giá điện động, sử dụng 0 nếu null
    const energyKwh = this.getEnergyConsumed();
    const cost = energyKwh * pricePerKwh;
    
    return cost.toFixed(0); // Trả về giá trị làm tròn đến số nguyên
  }


  // Get transaction ID
  getTransactionId() {
    return this.transactionId;
  }
}
