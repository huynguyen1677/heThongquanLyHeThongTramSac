import { useState, useRef } from 'react';
import AppHeader from './components/AppHeader';
import LeftPanel from './components/LeftPanel';
import MiddlePanel from './components/MiddlePanel';
import LogConsole from './components/LogConsole';
import { useOcppClient } from './hooks/useOcppClient';
import { useConnectors } from './hooks/useConnectors';
import { useLogs } from './hooks/useLogs';
import { useSafetyCheck } from './hooks/useSafetyCheck';
import { useTransactionManager } from './hooks/useTransactionManager';
import { useStatusNotification } from './hooks/useStatusNotification';
import { useChargingSession } from './hooks/useChargingSession';
import './App.css';

function App() {
  const [stationConfig, setStationConfig] = useState(null);
  const chargingHistoryRefs = useRef(new Map());

  // Hook quản lý logs
  const { logs, addLog } = useLogs(500);

  // Hook quản lý OCPP client
  const {
    isConnected,
    connectionStatus,
    connect,
    disconnect,
    sendCall,
    sendCallResult,
    sendCallError,
    startHeartbeat,
  } = useOcppClient({
    onLog: addLog,
    onCall: ({ action, payload, messageId }) => {
      addLog({
        type: 'call',
        action,
        payload,
        messageId,
        timestamp: new Date().toISOString()
      });
      if (action === 'RemoteStartTransaction') {
        sendCallResult(messageId, { status: 'Accepted' });
      } else if (action === 'RemoteStopTransaction') {
        sendCallResult(messageId, { status: 'Accepted' });
      } else {
        sendCallError(messageId, 'NotSupported', `Action ${action} is not supported`);
      }
    }
  });

  // Hook quản lý connectors và meter services
  const {
    connectors,
    meterServices, // New services
    initializeConnectors,
    resetConnectors,
    updateConnector,
    getConnector,
  } = useConnectors(sendCall); // <-- SỬA: truyền function sendCall thay vì ocppClient

  // Hook quản lý StatusNotification
  const { sendStatusNotification } = useStatusNotification(sendCall, updateConnector, addLog);

  // Hook quản lý Transactions với services mới
  const { startTransaction, stopTransaction } = useTransactionManager(
    sendCall,
    getConnector,
    updateConnector,
    meterServices,
    addLog
  );

  // Hook quản lý Charging Session
  const { completeSession } = useChargingSession(
    stationConfig, 
    updateConnector, 
    sendStatusNotification, 
    addLog
  );

  // Hook safety check
  const { performSafetyCheck } = useSafetyCheck(sendStatusNotification, addLog);

  const handleConnect = async (config) => {
    try {
      await connect(config.stationId, config.ownerId);

      const bootPayload = {
        chargePointVendor: config.vendor,
        chargePointModel: config.model,
        firmwareVersion: config.firmwareVersion,
        ownerId: config.ownerId,
        chargePointSerialNumber: config.stationId,
        iccid: config.stationId,
        imsi: config.stationId,
        meterSerialNumber: config.stationId,
        meterType: 'Energy',
        stationName: config.stationName,
        address: config.address,
        latitude: config.latitude,
        longitude: config.longitude
      };

      const bootResponse = await sendCall('BootNotification', bootPayload);
      if (bootResponse.status === 'Accepted') {
        startHeartbeat(bootResponse.interval);
        initializeConnectors(config.connectorCount);
        setStationConfig(config);

        // Gửi trạng thái ban đầu của các connector
        for (let i = 1; i <= config.connectorCount; i++) {
          await sendStatusNotification(i, 'Available');
        }

        addLog({
          type: 'log',
          level: 'info',
          message: `🗺️ Station location: ${config.stationName} at ${config.address} (${config.latitude}, ${config.longitude})`,
          timestamp: new Date().toISOString()
        });
      }
    } catch (error) {
      addLog({
        type: 'log',
        level: 'error',
        message: `❌ Failed to connect: ${error.message}`,
        timestamp: new Date().toISOString()
      });
      throw error;
    }
  };

  const handleDisconnect = async () => {
    try {
      // Stop tất cả meter services
      meterServices.forEach(service => service.stop());
      await disconnect();
      resetConnectors();
      setStationConfig(null);

      addLog({
        type: 'log',
        level: 'info',
        message: '🔌 Disconnected from OCPP server',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Disconnect error:', error);
    }
  };

  const handleLocalStart = async (connectorId, powerKw, inputUserId) => {
    await startTransaction(connectorId, powerKw, inputUserId);
  };

  const handleLocalStop = async (connectorId) => {
    const sessionData = await stopTransaction(connectorId);
    await completeSession(connectorId, sessionData, chargingHistoryRefs);
  };

  const handleStatusChange = async (connectorId, newStatus) => {
    await sendStatusNotification(connectorId, newStatus);
    updateConnector(connectorId, { status: newStatus });
  };

  const handleExportLogs = () => {
    const exportData = {
      stationId: stationConfig?.stationId,
      exportTime: new Date().toISOString(),
      logs: logs
    };

    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);

    const link = document.createElement('a');
    link.href = url;
    link.download = `ocpp-logs-${stationConfig?.stationId || 'unknown'}-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    addLog({
      type: 'log',
      level: 'info',
      message: `📥 Exported ${logs.length} logs to JSON file`,
      timestamp: new Date().toISOString()
    });
  };

  return (
    <div className="app">
      <AppHeader />
      
      <div className="app-content">
        <LeftPanel
          onConnect={handleConnect}
          onDisconnect={handleDisconnect}
          isConnected={isConnected}
          connectionStatus={connectionStatus}
          onExportLogs={handleExportLogs}
          logs={logs}
        />

        <MiddlePanel
          isConnected={isConnected}
          connectors={connectors}
          meterServices={meterServices}
          onLocalStart={handleLocalStart}
          onLocalStop={handleLocalStop}
          onStatusChange={handleStatusChange}
          chargingHistoryRefs={chargingHistoryRefs}
          performSafetyCheck={performSafetyCheck} // Thêm dòng này
        />

        <div className="right-panel">
          <LogConsole logs={logs} maxLogs={200} />
        </div>
      </div>
    </div>
  );
}

export default App;