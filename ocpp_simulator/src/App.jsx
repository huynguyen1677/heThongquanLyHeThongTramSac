import { useState, useEffect, useRef } from 'react';
import { OcppClient } from './services/OcppClient';
import { MeterTimer } from './services/MeterTimer';
import ConnectionPanel from './components/ConnectionPanel';
import ConnectorCard from './components/ConnectorCard';
import SimulatorActions from './components/SimulatorActions';
import LogConsole from './components/LogConsole';
import './App.css';

function App() {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [stationConfig, setStationConfig] = useState(null);
  const [connectors, setConnectors] = useState([]);
  const [logs, setLogs] = useState([]);
  const [meterTimers, setMeterTimers] = useState(new Map());
  
  const ocppClientRef = useRef(null);

  useEffect(() => {
    // Initialize OCPP client
    ocppClientRef.current = new OcppClient();
    
    // Set up message handler
    ocppClientRef.current.setMessageHandler((type, actionOrLevel, data, messageId) => {
      if (type === 'log') {
        addLog({
          type: 'log',
          level: actionOrLevel,
          message: data.message,
          timestamp: data.timestamp,
          data: data.data
        });
      } else if (type === 'call') {
        addLog({
          type: 'call',
          action: actionOrLevel,
          payload: data,
          messageId,
          timestamp: new Date().toISOString()
        });

        // Handle incoming calls from CSMS - simplified approach
        if (actionOrLevel === 'RemoteStartTransaction') {
          // Just accept for now, actual implementation can be added later
          ocppClientRef.current.sendCallResult(messageId, { status: 'Accepted' });
        } else if (actionOrLevel === 'RemoteStopTransaction') {
          // Just accept for now, actual implementation can be added later
          ocppClientRef.current.sendCallResult(messageId, { status: 'Accepted' });
        } else {
          // Send error for unsupported actions
          ocppClientRef.current.sendCallError(
            messageId, 
            'NotSupported', 
            `Action ${actionOrLevel} is not supported`
          );
        }
      }
    });

    // Set up status handler
    ocppClientRef.current.setStatusHandler((status) => {
      setConnectionStatus(status);
      setIsConnected(status === 'connected');
    });

    return () => {
      if (ocppClientRef.current) {
        ocppClientRef.current.disconnect();
      }
    };
  }, []); // Empty dependency array is safe now

  const MAX_LOG_ENTRIES = 500;

  const addLog = (logEntry) => {
    setLogs(prev => [...prev, logEntry].slice(-MAX_LOG_ENTRIES));
  };

  const handleConnect = async (config) => {
    try {
      setConnectionStatus('connecting');
      // Connect to WebSocket
      await ocppClientRef.current.connect(config.stationId, config.ownerId);
      // Send BootNotification
      const bootPayload = {
        chargePointVendor: config.vendor,
        chargePointModel: config.model,
        firmwareVersion: config.firmwareVersion
      };
      const bootResponse = await ocppClientRef.current.sendCall('BootNotification', bootPayload);
      if (bootResponse.status === 'Accepted') {
        // Start heartbeat
        ocppClientRef.current.startHeartbeat(bootResponse.interval);
        // Initialize connectors
        const newConnectors = [];
        const newMeterTimers = new Map();
        for (let i = 1; i <= config.connectorCount; i++) {
          newConnectors.push({
            id: i,
            status: 'Available',
            transactionId: null,
            meterStart: 0,
            errorCode: 'NoError',
          });
          newMeterTimers.set(i, new MeterTimer(i, ocppClientRef.current));
        }
        setConnectors(newConnectors);
        setMeterTimers(newMeterTimers);
        setStationConfig(config);

        // Gửi trạng thái ban đầu của các connector lên CSMS
        // Đây là bước quan trọng để dữ liệu xuất hiện trên Firebase ngay khi kết nối
        for (const connector of newConnectors) {
          await sendStatusNotification(connector.id, connector.status);
        }
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
      // Stop all meter timers
      meterTimers.forEach(timer => timer.stop());
      
      // Disconnect
      await ocppClientRef.current.disconnect();
      
      // Reset state
      setConnectors([]);
      setMeterTimers(new Map());
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

  const sendStatusNotification = async (connectorId, status, errorCode = 'NoError') => {
    const payload = {
      connectorId,
      status,
      errorCode,
      timestamp: new Date().toISOString()
    };

    try {
      await ocppClientRef.current.sendCall('StatusNotification', payload);
      
      // Update connector state
      setConnectors(prev => prev.map(conn => 
        conn.id === connectorId 
          ? { ...conn, status, errorCode }
          : conn
      ));
      
    } catch (error) {
      addLog({
        type: 'log',
        level: 'error',
        message: `❌ Failed to send StatusNotification for connector ${connectorId}: ${error.message}`,
        timestamp: new Date().toISOString()
      });
      throw error;
    }
  };

  const handleLocalStart = async (connectorId, powerKw) => {
    try {
      const connector = connectors.find(c => c.id === connectorId);
      if (!connector || connector.status !== 'Available') {
        throw new Error('Connector not available for start');
      }

      // 1. Gửi StatusNotification (Preparing)
      await sendStatusNotification(connectorId, 'Preparing');

      // 2. Tùy chọn: Authorize
      try {
        const authResponse = await ocppClientRef.current.sendCall('Authorize', {
          idTag: 'DEMO_USER'
        });
        
        if (authResponse.idTagInfo.status !== 'Accepted') {
          throw new Error(`Authorization failed: ${authResponse.idTagInfo.status}`);
        }
      } catch (authError) {
        addLog({
          type: 'log',
          level: 'warn',
          message: `⚠️ Authorization failed, continuing anyway: ${authError.message}`,
          timestamp: new Date().toISOString()
        });
      }

      // 3. Bắt đầu transaction
      const meterStart = Math.floor(Math.random() * 100000) + 10000; // Random starting meter value
      const startPayload = {
        connectorId,
        idTag: 'DEMO_USER',
        meterStart,
        timestamp: new Date().toISOString()
      };

      const startResponse = await ocppClientRef.current.sendCall('StartTransaction', startPayload);
      
      // 4. Nếu thành công...
      if (startResponse.transactionId) {
        // 4a. Cập nhật trạng thái connector với transactionId
        setConnectors(prev => prev.map(conn => 
          conn.id === connectorId 
            ? { ...conn, transactionId: startResponse.transactionId, meterStart }
            : conn
        ));

        // 4b. Gửi StatusNotification (Charging)
        await sendStatusNotification(connectorId, 'Charging');

        // Start meter timer
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
      // 5. Quay về trạng thái Available nếu có lỗi
      await sendStatusNotification(connectorId, 'Available');
      throw error;
    }
  };

  const handleLocalStop = async (connectorId) => {
    try {
      const connector = connectors.find(c => c.id === connectorId);
      if (!connector || !connector.transactionId) {
        throw new Error('No active transaction to stop');
      }

      // Stop meter timer first
      const meterTimer = meterTimers.get(connectorId);
      let meterStop = connector.meterStart;
      
      if (meterTimer && meterTimer.isActive()) {
        meterStop = meterTimer.getCurrentMeterValue();
        meterTimer.stop();
      }

      // Ensure meterStop >= meterStart
      if (meterStop < connector.meterStart) {
        meterStop = connector.meterStart + 1000; // Add minimum 1kWh
      }

      // Stop transaction
      const stopPayload = {
        transactionId: connector.transactionId,
        meterStop,
        timestamp: new Date().toISOString(),
        idTag: 'DEMO_USER'
      };

      await ocppClientRef.current.sendCall('StopTransaction', stopPayload);

      // Send StatusNotification (Finishing)
      await sendStatusNotification(connectorId, 'Finishing');

      // Short delay then back to Available
      setTimeout(async () => {
        await sendStatusNotification(connectorId, 'Available');
        
        // Clear transaction
        setConnectors(prev => prev.map(conn => 
          conn.id === connectorId 
            ? { ...conn, transactionId: null, meterStart: 0 }
            : conn
        ));
      }, 2000);

      addLog({
        type: 'log',
        level: 'info',
        message: `⏹️ Stopped charging on connector ${connectorId}, final meter: ${meterStop}Wh`,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      addLog({
        type: 'log',
        level: 'error',
        message: `❌ Failed to stop charging: ${error.message}`,
        timestamp: new Date().toISOString()
      });
      throw error;
    }
  };

  const handleStatusChange = async (connectorId, newStatus) => {
    await sendStatusNotification(connectorId, newStatus);
    
    addLog({
      type: 'log',
      level: 'info',
      message: `🔧 Connector ${connectorId} status changed to ${newStatus}`,
      timestamp: new Date().toISOString()
    });
  };

  const handleRunPreset = async () => {
    if (!isConnected || connectors.length === 0) {
      throw new Error('Not connected or no connectors available');
    }

    const connectorId = 1; // Use first connector
    
    addLog({
      type: 'log',
      level: 'info',
      message: '🎯 Starting preset demo...',
      timestamp: new Date().toISOString()
    });

    try {
      // 1. Ensure Available
      await sendStatusNotification(connectorId, 'Available');
      await new Promise(resolve => setTimeout(resolve, 1000));

      // 2. Start transaction
      await handleLocalStart(connectorId, 3.5);
      await new Promise(resolve => setTimeout(resolve, 2000));

      // 3. Send 4 meter values (wait 5 seconds each)
      for (let i = 0; i < 4; i++) {
        await new Promise(resolve => setTimeout(resolve, 5000));
        addLog({
          type: 'log',
          level: 'info',
          message: `📊 Preset demo meter reading ${i + 1}/4`,
          timestamp: new Date().toISOString()
        });
      }

      // 4. Stop transaction
      await handleLocalStop(connectorId);

      addLog({
        type: 'log',
        level: 'info',
        message: '✅ Preset demo completed successfully!',
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      addLog({
        type: 'log',
        level: 'error',
        message: `❌ Preset demo failed: ${error.message}`,
        timestamp: new Date().toISOString()
      });
      throw error;
    }
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
      <div className="app-header">
        <h1>⚡ OCPP 1.6-J Charging Station Simulator</h1>
        <p>Mô phỏng trạm sạc điện với giao thức OCPP 1.6-J</p>
      </div>

      <div className="app-content">
        <div className="left-panel">
          <ConnectionPanel
            onConnect={handleConnect}
            onDisconnect={handleDisconnect}
            isConnected={isConnected}
            connectionStatus={connectionStatus}
          />
          
          <SimulatorActions
            onRunPreset={handleRunPreset}
            onExportLogs={handleExportLogs}
            isConnected={isConnected}
            logs={logs}
          />
        </div>

        <div className="middle-panel">
          <div className="connectors-section">
            <h2>🔌 Connectors</h2>
            <div className="connectors-grid">
              {isConnected && connectors.length === 2
                ? connectors.map(connector => (
                    <ConnectorCard
                      key={connector.id}
                      connectorId={connector.id}
                      status={connector.status}
                      transactionId={connector.transactionId}
                      meterTimer={meterTimers.get(connector.id)}
                      onLocalStart={handleLocalStart}
                      onLocalStop={handleLocalStop}
                      onStatusChange={handleStatusChange}
                      isConnected={isConnected}
                    />
                  ))
                : [1, 2].map(id => (
                    <ConnectorCard
                      key={id}
                      connectorId={id}
                      status="Chưa kết nối"
                      transactionId={null}
                      meterStart={0}
                      errorCode="NoError"
                      isConnected={false}
                      onLocalStart={() => {}}
                      onLocalStop={() => {}}
                      onStatusChange={() => {}}
                      disabled
                    />
                  ))}
            </div>
          </div>
        </div>

        <div className="right-panel">
          <LogConsole logs={logs} maxLogs={200} />
        </div>
      </div>
    </div>
  );
}

export default App;
