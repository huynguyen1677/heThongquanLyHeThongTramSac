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
    this.powerKw = 3.5; // Công suất sạc mặc định (kW)
    this.startTime = null; // Thời điểm bắt đầu sạc
  }

  /**
   * Bắt đầu bộ đếm thời gian cho một phiên sạc.
   * @param {number} transactionId - ID của phiên giao dịch.
   * @param {number} meterStart - Giá trị meter lúc bắt đầu (Wh).
   * @param {number} powerKw - Công suất sạc (kW).
   * @param {number} intervalSeconds - Chu kỳ gửi MeterValues (giây).
   */

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
    
    if (this.transactionId) {
      this.log(`🔋 Đã dừng meter timer cho transaction ${this.transactionId}`);
    }
  }

    /**
   * Lấy các thông số sạc hiện tại để hiển thị trên UI.
   * @returns {object}
   */
  getChargingStats() {
    const energyKwh = (this.currentMeterValue - this.meterStart) / 1000;
    const pricePerKwh = 2380; // Giá điện giả định
    const cost = energyKwh * pricePerKwh;

    return {
      transactionId: this.transactionId,
      currentMeterValue: Math.round(this.currentMeterValue),
      energyKwh: energyKwh,
      powerKw: this.powerKw,
      duration: this.getChargingDuration(),
      estimatedCost: Math.round(cost / 100) * 100, // Làm tròn đến trăm đồng
      isRunning: this.isRunning
    };
  }

  /**
   * Lấy thời gian sạc đã trôi qua.
   * @returns {string} Chuỗi thời gian "HH:MM:SS".
   */
  getChargingDuration() {
    if (!this.startTime) return '00:00:00';

    const diffMs = new Date() - this.startTime;
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
    if (!this.isRunning || !this.transactionId) {
      return;
    }

    // 1. Tính toán lượng điện năng tiêu thụ trong chu kỳ vừa qua
    const deltaTimeHours = this.interval / (1000 * 3600); // Đổi mili-giây sang giờ
    const deltaWh = this.powerKw * 1000 * deltaTimeHours; // Đổi kW sang W, rồi tính Wh 

    // 2. Cập nhật tổng giá trị meter
    this.currentMeterValue += deltaWh;


    // 3. Tạo payload theo chuẩn OCPP 1.6-J
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
              // Công suất sạc tức thời
              value: Math.round(this.powerKw * 1000).toString(),
              measurand: 'Power.Active.Import',
              unit: 'W'
            }
          ]
        }
      ]
    };

    // 4. Gửi tin nhắn đi bằng ocppClient
    this.ocppClient.sendCall('MeterValues', payload)
      .catch((error) => {
        this.log(`❌ Lỗi khi gửi meter values: ${error.message}`, 'error');
      });
  }

  // Get energy consumed in kWh
  getEnergyConsumed() {
    return (this.currentMeterValue - this.meterStart) / 1000;
  }


  // Calculate estimated cost (flat rate)
  getEstimatedCost() {
    const pricePerKwh = 2380; // VND per kWh
    const energyKwh = this.getEnergyConsumed();
    const cost = energyKwh * pricePerKwh;
    
    // Round to nearest 100 VND
    return Math.round(cost / 100) * 100;
  }


  // Get transaction ID
  getTransactionId() {
    return this.transactionId;
  }
}
