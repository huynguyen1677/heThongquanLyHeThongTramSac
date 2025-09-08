import { useCallback } from 'react';

// Helper function to convert duration string (HH:MM:SS) to seconds
const convertDurationToSeconds = (durationString) => {
  if (!durationString || typeof durationString !== 'string') {
    return 0;
  }
  
  const parts = durationString.split(':');
  if (parts.length !== 3) {
    return 0;
  }
  
  const hours = parseInt(parts[0]) || 0;
  const minutes = parseInt(parts[1]) || 0;
  const seconds = parseInt(parts[2]) || 0;
  
  return hours * 3600 + minutes * 60 + seconds;
};

export function useChargingSession(stationConfig, updateConnector, sendStatusNotification, addLog) {
  const completeSession = useCallback(async (connectorId, sessionData, chargingHistoryRefs) => {
    const { sessionStats, meterStop, connector } = sessionData;
    
    const sessionEndTime = new Date();
    const duration = sessionStats?.duration || '00:00:00';
    
    // Convert duration string (HH:MM:SS) to seconds for proper calculation
    const durationInSeconds = convertDurationToSeconds(duration);
    const sessionStartTime = new Date(sessionEndTime.getTime() - durationInSeconds * 1000);

    const sessionSummaryData = {
      id: `session_${Date.now()}_${connectorId}`,
      transactionId: sessionStats?.transactionId || connector?.transactionId || null,
      connectorId: connectorId,
      userId: sessionStats?.idTag || 'DEMO_USER',
      stationId: stationConfig?.id || 'UNKNOWN',
      startTime: sessionStartTime.getTime(),
      endTime: sessionEndTime.getTime(),
      duration: duration,
      meterStart: connector?.meterStart || 0,
      meterStop: meterStop,
      // Sử dụng energyKwh trực tiếp từ sessionStats thay vì tính toán lại
      energyConsumed: sessionStats?.energyKwh || 0,
      pricePerKwh: sessionStats?.pricePerKwh || 0,
      estimatedCost: sessionStats?.estimatedCost || 0,
      status: 'completed',
      reason: 'Local stop requested'
    };

    const historyRef = chargingHistoryRefs.current.get(connectorId);
    if (historyRef && historyRef.addSession) {
      historyRef.addSession(sessionSummaryData);
    }

    setTimeout(async () => {
      await sendStatusNotification(connectorId, 'Available');
      updateConnector(connectorId, {
        transactionId: null,
        meterStart: 0,
        cumulativeMeter: meterStop,
        status: 'Available'
      });
    }, 2000);

    addLog({
      type: 'log',
      level: 'info',
      message: `⏹️ Stopped charging on connector ${connectorId}, final meter: ${meterStop}Wh`,
      timestamp: new Date().toISOString()
    });

  }, [stationConfig, updateConnector, sendStatusNotification, addLog]);

  return {
    completeSession
  };
}