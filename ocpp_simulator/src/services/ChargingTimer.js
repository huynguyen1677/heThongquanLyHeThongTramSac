export class ChargingTimer {
  constructor(connectorId) {
    this.connectorId = connectorId;
    this.timer = null;
    this.isRunning = false;
    this.interval = 5000; // mặc định 5 giây
    
    // Quản lý thời gian
    this.startTime = null;
    this.pausedTime = 0;
    this.pauseStartTime = null;
  }

  /**
   * Bắt đầu timer
   */
  start(callback, intervalMs = 5000) {
    if (this.isRunning) {
      this.stop();
    }

    this.interval = intervalMs;
    this.startTime = new Date();
    this.isRunning = true;
    this.pausedTime = 0;
    this.pauseStartTime = null;

    console.log(`⏰ [ChargingTimer-${this.connectorId}] Started with interval ${intervalMs}ms`);

    // Gọi callback ngay lập tức
    if (typeof callback === 'function') {
      try {
        callback();
      } catch (error) {
        console.error(`❌ [ChargingTimer-${this.connectorId}] Initial callback error:`, error);
      }
    }

    // Lên lịch gọi định kỳ
    this.timer = setInterval(() => {
      if (typeof callback === 'function') {
        try {
          callback();
        } catch (error) {
          console.error(`❌ [ChargingTimer-${this.connectorId}] Callback error:`, error);
        }
      }
    }, this.interval);
  }

  /**
   * Dừng timer
   */
  stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this.isRunning = false;
    this.pausedTime = 0;
    this.pauseStartTime = null;
    console.log(`⏹️ [ChargingTimer-${this.connectorId}] Stopped`);
  }

  /**
   * Tạm dừng timer
   */
  pause() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this.isRunning = false;
    this.pauseStartTime = new Date();
    console.log(`⏸️ [ChargingTimer-${this.connectorId}] Paused`);
  }

  /**
   * Tiếp tục timer
   */
  resume(callback) {
    if (!this.startTime) {
      console.error(`❌ [ChargingTimer-${this.connectorId}] Cannot resume - timer not started`);
      return;
    }

    if (this.isRunning) {
      return; // Đã đang chạy
    }

    // Tính thời gian pause
    if (this.pauseStartTime) {
      const pauseDuration = new Date() - this.pauseStartTime;
      this.pausedTime += pauseDuration;
      this.pauseStartTime = null;
    }

    this.isRunning = true;
    console.log(`▶️ [ChargingTimer-${this.connectorId}] Resumed`);

    // Gọi callback ngay lập tức
    if (typeof callback === 'function') {
      try {
        callback();
      } catch (error) {
        console.error(`❌ [ChargingTimer-${this.connectorId}] Resume callback error:`, error);
      }
    }

    // Lên lịch gọi định kỳ
    this.timer = setInterval(() => {
      if (typeof callback === 'function') {
        try {
          callback();
        } catch (error) {
          console.error(`❌ [ChargingTimer-${this.connectorId}] Callback error:`, error);
        }
      }
    }, this.interval);
  }

  /**
   * Lấy thời gian đã trôi qua (tính bằng giây)
   */
  getElapsedSeconds() {
    if (!this.startTime) return 0;

    let diffMs = new Date() - this.startTime;
    diffMs -= this.pausedTime;

    if (this.pauseStartTime) {
      diffMs -= (new Date() - this.pauseStartTime);
    }

    return Math.max(0, Math.floor(diffMs / 1000));
  }

  /**
   * Lấy thời gian đã trôi qua (định dạng HH:MM:SS)
   */
  getDuration() {
    const totalSeconds = this.getElapsedSeconds();
    const hours = Math.floor(totalSeconds / 3600).toString().padStart(2, '0');
    const minutes = Math.floor((totalSeconds % 3600) / 60).toString().padStart(2, '0');
    const seconds = (totalSeconds % 60).toString().padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
  }

  /**
   * Lấy thời gian đã trôi qua (tính bằng phút)
   */
  getElapsedMinutes() {
    return this.getElapsedSeconds() / 60;
  }

  /**
   * Kiểm tra timer có đang chạy không
   */
  isActive() {
    return this.isRunning;
  }

  /**
   * Reset timer về trạng thái ban đầu
   */
  reset() {
    this.stop();
    this.startTime = null;
    this.pausedTime = 0;
    this.pauseStartTime = null;
  }
}