export class TransactionService {
  constructor(sendCall, messageService) {
    this.sendCall = sendCall; // function sendCall
    this.messageService = messageService;
  }

  async startTransaction(connectorId, meterStart, idTag, powerKw) {
    // 1. Validate inputs
    if (!idTag) {
      throw new Error('ID Tag is required');
    }

    // 2. Send StartTransaction to OCPP server
    const startPayload = {
      connectorId,
      meterStart,
      idTag,
      timestamp: new Date().toISOString()
    };
    const startResponse = await this.sendCall('StartTransaction', startPayload);

    // Kiểm tra trạng thái response từ server
    if (startResponse.idTagInfo && startResponse.idTagInfo.status !== 'Accepted') {
      const status = startResponse.idTagInfo.status;
      const info = startResponse.idTagInfo.info || '';
      
      if (status === 'Blocked') {
        if (info.includes('Insufficient balance')) {
          throw new Error(`Số dư không đủ để bắt đầu sạc. ${info}`);
        } else {
          throw new Error(`Thẻ bị chặn: ${info || 'Không được phép sạc'}`);
        }
      } else if (status === 'Invalid') {
        throw new Error(`Thẻ không hợp lệ: ${info || 'ID Tag không được nhận dạng'}`);
      } else {
        throw new Error(`Không thể bắt đầu sạc. Trạng thái: ${status}. ${info}`);
      }
    }

    if (!startResponse.transactionId || startResponse.transactionId === 0) {
      throw new Error('Không nhận được ID giao dịch từ server');
    }

    // 3. Send initial status
    await this.messageService.sendStatusNotification(connectorId, 'Charging');

    return {
      transactionId: startResponse.transactionId,
      meterStart,
      powerKw,
      startTime: new Date().toISOString()
    };
  }

  async stopTransaction(transactionId, connectorId, meterStop, idTag = 'DEMO_USER') {
    const stopPayload = {
      transactionId,
      meterStop, // <-- phải là số
      timestamp: new Date().toISOString(),
      idTag
    };
    await this.sendCall('StopTransaction', stopPayload);

    // 2. Send status notification
    await this.messageService.sendStatusNotification(connectorId, 'Finishing');

    return {
      transactionId,
      meterStop,
      stopTime: new Date().toISOString()
    };
  }
}