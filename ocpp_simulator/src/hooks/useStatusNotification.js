import { useCallback } from 'react';

// Thay đổi từ sử dụng OcppMessageSender sang sử dụng sendCall trực tiếp
export function useStatusNotification(sendCall, updateConnector, addLog) {
  const sendStatusNotification = useCallback(async (connectorId, status, errorCode = 'NoError', additionalInfo = {}) => {
    if (!sendCall || typeof sendCall !== 'function') {
      throw new Error('sendCall function not available');
    }

    const payload = {
      connectorId,
      status,
      errorCode,
      timestamp: new Date().toISOString(),
      ...additionalInfo
    };

    try {
      await sendCall('StatusNotification', payload);
      updateConnector(connectorId, { status, errorCode, ...additionalInfo });
      addLog({
        type: 'log',
        level: 'info',
        message: `📡 StatusNotification sent: Connector ${connectorId} -> ${status}`,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      addLog({
        type: 'log',
        level: 'error',
        message: `❌ Failed to send StatusNotification: ${error.message}`,
        timestamp: new Date().toISOString()
      });
      throw error;
    }
  }, [sendCall, updateConnector, addLog]);

  return { sendStatusNotification };
}