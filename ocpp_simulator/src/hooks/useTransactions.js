import { useCallback } from 'react';

export function useTransactions(ocppClient, getConnector, updateConnector, meterTimers, sendStatusNotification, addLog) {
  const startTransaction = useCallback(async (connectorId, powerKw, inputUserId) => {
    try {
      const connector = getConnector(connectorId);
      if (!connector) throw new Error('Connector not found');

      const idTag = ocppClient?.remoteIdTag || inputUserId;
      if (!idTag) throw new Error('Vui lòng nhập mã xác nhận (userId 6 số) hoặc nhận lệnh từ app!');

      const meterStart = connector.cumulativeMeter || 0;
      const startResponse = await ocppClient.sendStartTransaction(connectorId, meterStart, idTag);

      if (startResponse.transactionId) {
        updateConnector(connectorId, { 
          transactionId: startResponse.transactionId, 
          meterStart 
        });

        await sendStatusNotification(connectorId, 'Charging');

        const meterTimer = meterTimers.get(connectorId);
        if (meterTimer) {
          meterTimer.start(startResponse.transactionId, meterStart, powerKw);
        }

        addLog({
          type: 'log',
          level: 'info',
          message: `🚀 Started charging on connector ${connectorId}, transaction: ${startResponse.transactionId}`,
          timestamp: new Date().toISOString()
        });
      } else {
        throw new Error('No transaction ID received');
      }
    } catch (error) {
      await sendStatusNotification(connectorId, 'Available');
      throw error;
    }
  }, [ocppClient, getConnector, updateConnector, meterTimers, sendStatusNotification, addLog]);

  const stopTransaction = useCallback(async (connectorId) => {
    try {
      const connector = getConnector(connectorId);
      if (!connector || !connector.transactionId) {
        throw new Error('No active transaction to stop');
      }

      const meterTimer = meterTimers.get(connectorId);
      let meterStop = connector.meterStart;

      if (meterTimer && meterTimer.isActive()) {
        meterStop = meterTimer.getCurrentMeterValue();
        meterTimer.stop();
      }

      if (meterStop < connector.meterStart) {
        meterStop = connector.meterStart + 1000;
      }

      const sessionStats = meterTimer ? meterTimer.getChargingStats() : {};

      const stopPayload = {
        transactionId: connector.transactionId,
        meterStop,
        timestamp: new Date().toISOString(),
        idTag: 'DEMO_USER'
      };

      await ocppClient.sendCall('StopTransaction', stopPayload);
      await sendStatusNotification(connectorId, 'Finishing');

      updateConnector(connectorId, { status: 'Finishing' });

      // Return session data để component xử lý history
      return {
        sessionStats,
        meterStop,
        connector
      };

    } catch (error) {
      addLog({
        type: 'log',
        level: 'error',
        message: `❌ Failed to stop charging: ${error.message}`,
        timestamp: new Date().toISOString()
      });
      throw error;
    }
  }, [getConnector, meterTimers, ocppClient, sendStatusNotification, updateConnector, addLog]);

  return {
    startTransaction,
    stopTransaction
  };
}