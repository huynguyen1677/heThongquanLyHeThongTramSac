import { useMemo } from 'react';
import { OcppMessageService } from '../services/OcppMessageService';
import { TransactionService } from '../services/TransactionService';

export function useTransactionManager(
  sendCall,
  getConnector,
  updateConnector,
  meterServices,
  addLog
) {
  // Tạo message service với function sendCall
  const messageService = useMemo(() => {
    return sendCall ? new OcppMessageService(sendCall) : null;
  }, [sendCall]);

  // Tạo transaction service với function sendCall
  const transactionService = useMemo(() => {
    return sendCall && messageService
      ? new TransactionService(sendCall, messageService)
      : null;
  }, [sendCall, messageService]);

  // Hàm bắt đầu transaction
  const startTransaction = async (connectorId, powerKw, idTag) => {
    if (!transactionService) {
      throw new Error('Transaction service not available');
    }

    const connector = getConnector(connectorId);
    const meterService = meterServices.get(connectorId);
    
    if (!connector) {
      throw new Error(`Connector ${connectorId} not found`);
    }
    
    if (!meterService) {
      throw new Error(`Meter service for connector ${connectorId} not found`);
    }

    try {
      // 1. Bắt đầu transaction qua OCPP
      const transactionData = await transactionService.startTransaction(
        connectorId,
        connector.cumulativeMeter || 0,
        idTag,
        powerKw
      );

      // 2. Bắt đầu meter service với idTag
      const started = meterService.start(
        transactionData.transactionId,
        transactionData.meterStart,
        powerKw,
        2, // interval seconds
        idTag // Pass idTag to meter service
      );

      if (!started) {
        throw new Error('Failed to start meter service');
      }

      // 3. Cập nhật trạng thái connector
      updateConnector(connectorId, {
        status: 'Charging',
        transactionId: transactionData.transactionId,
        meterStart: transactionData.meterStart
      });

      addLog({
        type: 'log',
        level: 'info',
        message: `🔋 Bắt đầu sạc connector ${connectorId} với User ID ${idTag} - Transaction ${transactionData.transactionId}`,
        timestamp: new Date().toISOString()
      });

      return transactionData;
    } catch (error) {
      addLog({
        type: 'log',
        level: 'error',
        message: `❌ Lỗi bắt đầu sạc connector ${connectorId}: ${error.message}`,
        timestamp: new Date().toISOString()
      });
      throw error;
    }
  };

  // Hàm dừng transaction
  const stopTransaction = async (connectorId) => {
    if (!transactionService) {
      throw new Error('Transaction service not available');
    }

    const connector = getConnector(connectorId);
    const meterService = meterServices.get(connectorId);
    
    if (!connector) {
      throw new Error(`Connector ${connectorId} not found`);
    }
    
    if (!meterService) {
      throw new Error(`Meter service for connector ${connectorId} not found`);
    }

    if (!connector.transactionId) {
      throw new Error('No active transaction to stop');
    }

    try {
      // 1. Lấy giá trị meterStop từ meter service
      const meterStop = meterService.getCurrentMeterValue();

      // 2. Dừng meter service trước
      const stopped = meterService.stop();
      if (!stopped) {
        console.warn(`⚠️ Failed to stop meter service for connector ${connectorId}`);
      }

      // 3. Gửi StopTransaction qua OCPP
      const sessionData = await transactionService.stopTransaction(
        connector.transactionId,
        connectorId,
        meterStop,
        meterService.idTag || 'DEMO_USER'
      );

      // 4. Cập nhật trạng thái connector
      updateConnector(connectorId, {
        status: 'Available',
        transactionId: null
      });

      addLog({
        type: 'log',
        level: 'info',
        message: `⏹️ Dừng sạc connector ${connectorId} - Transaction ${connector.transactionId}`,
        timestamp: new Date().toISOString()
      });

      return sessionData;
    } catch (error) {
      addLog({
        type: 'log',
        level: 'error',
        message: `❌ Lỗi dừng sạc connector ${connectorId}: ${error.message}`,
        timestamp: new Date().toISOString()
      });
      throw error;
    }
  };

  return {
    startTransaction,
    stopTransaction
  };
}