import { useCallback } from 'react';

export function useSafetyCheck(sendStatusNotification, addLog) {
  // Hàm thực hiện Safety Check và gửi StatusNotification
  const performSafetyCheck = useCallback(
    async (connectorId, safetyCheckData) => {
      const additionalInfo = {
        safetyCheck: {
          vehicleParked: safetyCheckData.parked,
          cablePlugged: safetyCheckData.plugged,
          userConfirmed: safetyCheckData.confirmed,
          timestamp: new Date().toISOString(),
          passed: safetyCheckData.parked && safetyCheckData.plugged && safetyCheckData.confirmed
        },
        info: `Safety check completed: ${
          safetyCheckData.parked && safetyCheckData.plugged && safetyCheckData.confirmed ? 'PASSED' : 'FAILED'
        }`
      };

      await sendStatusNotification(connectorId, 'Preparing', 'NoError', additionalInfo);

      addLog &&
        addLog({
          type: 'log',
          level: 'info',
          message: `🔧 Connector ${connectorId} status changed to Preparing (Safety: ${
            additionalInfo.safetyCheck.passed ? '✅' : '❌'
          })`,
          timestamp: new Date().toISOString()
        });
    },
    [sendStatusNotification, addLog]
  );

  return { performSafetyCheck };
}