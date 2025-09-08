export class OcppMessageService {
  constructor(sendCall) {
    this.sendCall = sendCall; // function sendCall
  }

  async sendStatusNotification(connectorId, status, errorCode = 'NoError', additionalInfo = {}) {
    // Debug log để kiểm tra kiểu dữ liệu
    console.log('🔍 Debug sendStatusNotification:');
    console.log('connectorId type:', typeof connectorId);
    console.log('connectorId value:', connectorId);
    
    if (typeof connectorId !== 'number') {
      console.error('❌ connectorId phải là số, nhưng nhận được:', connectorId);
      return;
    }

    const payload = {
      connectorId,
      status,
      errorCode,
      timestamp: new Date().toISOString(),
      ...additionalInfo
    };

    return await this.sendCall('StatusNotification', payload);
  }

  async sendMeterValues(connectorId, transactionId, meterValue, currentPowerKw) {
    const payload = {
      connectorId,
      transactionId,
      meterValue: [
        {
          timestamp: new Date().toISOString(),
          sampledValue: [
            {
              value: Math.round(meterValue).toString(),
              measurand: 'Energy.Active.Import.Register',
              unit: 'Wh'
            },
            {
              value: Math.round(currentPowerKw * 1000).toString(),
              measurand: 'Power.Active.Import',
              unit: 'W'
            }
          ]
        }
      ]
    };

    return await this.sendCall('MeterValues', payload);
  }

  async sendDataTransfer(vendorId, messageId, data) {
    const payload = {
      vendorId,
      messageId,
      data: JSON.stringify(data)
    };

    return await this.sendCall('DataTransfer', payload);
  }
}