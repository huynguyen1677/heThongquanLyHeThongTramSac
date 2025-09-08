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

    if (!startResponse.transactionId) {
      throw new Error('No transaction ID received from server');
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