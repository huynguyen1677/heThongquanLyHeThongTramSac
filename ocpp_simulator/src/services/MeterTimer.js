export class MeterTimer {
  constructor(connectorId, ocppClient) {
    this.ocppClient = ocppClient;
    this.connectorId = connectorId;
    this.timer = null;
    this.isRunning = false;
    this.interval = 5000; // 5 seconds default
    this.transactionId = null;
    this.meterStart = 0;
    this.currentMeterValue = 0;
    this.powerKw = 3.5; // Default 3.5kW
    this.startTime = null;
  }

  // Start meter timer for a transaction
  start(transactionId, meterStart, powerKw = 3.5, intervalSeconds = 5) {
    if (this.isRunning) {
      this.stop();
    }

    this.transactionId = transactionId;
    this.meterStart = meterStart;
    this.currentMeterValue = meterStart;
    this.powerKw = powerKw;
    this.interval = intervalSeconds * 1000;
    this.startTime = new Date();
    this.isRunning = true;

    this.log(`🔋 Starting meter timer for transaction ${transactionId}, power: ${powerKw}kW, interval: ${intervalSeconds}s`);

    // Send first meter value immediately
    this.sendMeterValues();

    // Schedule periodic meter values
    this.timer = setInterval(() => {
      this.sendMeterValues();
    }, this.interval);
  }

  // Stop meter timer
  stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this.isRunning = false;
    
    if (this.transactionId) {
      this.log(`🔋 Stopped meter timer for transaction ${this.transactionId}`);
    }
  }

  // Update power during charging
  setPower(powerKw) {
    this.powerKw = powerKw;
    this.log(`⚡ Power updated to ${powerKw}kW`);
  }

  // Calculate and send meter values
  sendMeterValues() {
    if (!this.isRunning || !this.transactionId) {
      return;
    }

    // Calculate energy increment since last reading
    const deltaTimeHours = this.interval / (1000 * 3600); // Convert ms to hours
    const deltaWh = this.powerKw * 1000 * deltaTimeHours; // Convert kW to W, then to Wh
    
    // Update total meter value (always increasing)
    this.currentMeterValue += deltaWh;

    // Current power in Watts
    const powerW = this.powerKw * 1000;

    // Create MeterValues payload
    const timestamp = new Date().toISOString();
    const payload = {
      connectorId: this.connectorId,
      transactionId: this.transactionId,
      meterValue: [
        {
          timestamp,
          sampledValue: [
            {
              value: Math.round(this.currentMeterValue).toString(),
              measurand: 'Energy.Active.Import.Register',
              unit: 'Wh'
            },
            {
              value: Math.round(powerW).toString(),
              measurand: 'Power.Active.Import',
              unit: 'W'
            }
          ]
        }
      ]
    };

    // Send meter values
    this.ocppClient.sendCall('MeterValues', payload)
      .then(() => {
        // Log successful meter reading
        const energyKwh = (this.currentMeterValue - this.meterStart) / 1000;
        const duration = this.getChargingDuration();
        this.log(`📊 Meter reading sent: ${Math.round(this.currentMeterValue)}Wh (+${Math.round(deltaWh)}Wh), ${this.powerKw}kW, ${duration}, ${energyKwh.toFixed(3)}kWh`);
      })
      .catch((error) => {
        this.log(`❌ Failed to send meter values: ${error.message}`, 'error');
      });
  }

  // Get current meter value
  getCurrentMeterValue() {
    return Math.round(this.currentMeterValue);
  }

  // Get energy consumed in kWh
  getEnergyConsumed() {
    return (this.currentMeterValue - this.meterStart) / 1000;
  }

  // Get charging duration string
  getChargingDuration() {
    if (!this.startTime) {
      return '00:00:00';
    }

    const now = new Date();
    const diffMs = now - this.startTime;
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);

    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }

  // Calculate estimated cost (flat rate)
  getEstimatedCost() {
    const pricePerKwh = 2380; // VND per kWh
    const energyKwh = this.getEnergyConsumed();
    const cost = energyKwh * pricePerKwh;
    
    // Round to nearest 100 VND
    return Math.round(cost / 100) * 100;
  }

  // Get real-time charging stats
  getChargingStats() {
    return {
      transactionId: this.transactionId,
      meterStart: this.meterStart,
      currentMeterValue: this.getCurrentMeterValue(),
      energyKwh: this.getEnergyConsumed(),
      powerKw: this.powerKw,
      duration: this.getChargingDuration(),
      estimatedCost: this.getEstimatedCost(),
      isRunning: this.isRunning
    };
  }

  // Logging helper
  log(message, level = 'info') {
    const timestamp = new Date().toISOString();
    const logMessage = `[Meter-${this.connectorId}] ${message}`;
    
    switch (level) {
      case 'error':
        console.error(`[${timestamp}] ${logMessage}`);
        break;
      case 'warn':
        console.warn(`[${timestamp}] ${logMessage}`);
        break;
      default:
        console.log(`[${timestamp}] ${logMessage}`);
    }
  }

  // Check if timer is running
  isActive() {
    return this.isRunning;
  }

  // Get transaction ID
  getTransactionId() {
    return this.transactionId;
  }
}
