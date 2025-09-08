import { useCallback } from 'react';

export function useChargingSession(stationConfig, updateConnector, sendStatusNotification, addLog) {
  const completeSession = useCallback(async (connectorId, sessionData, chargingHistoryRefs) => {
    const { sessionStats, meterStop, connector } = sessionData;
    
    const sessionEndTime = new Date();
    const duration = sessionStats?.duration || '00:00:00';
    const sessionStartTime = new Date(sessionEndTime.getTime() - duration * 1000);

    const sessionSummaryData = {
      id: `session_${Date.now()}_${connectorId}`,
      transactionId: connector?.transactionId || null,
      connectorId: connectorId,
      userId: 'DEMO_USER',
      stationId: stationConfig?.id || 'UNKNOWN',
      startTime: sessionStartTime.getTime(),
      endTime: sessionEndTime.getTime(),
      duration: duration,
      meterStart: connector?.meterStart || 0,
      meterStop: meterStop,
      energyConsumed: meterStop - (connector?.meterStart || 0),
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