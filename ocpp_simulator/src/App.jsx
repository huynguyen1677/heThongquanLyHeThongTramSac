import { useState, useEffect, useRef } from 'react';
import { OcppClient } from './services/OcppClient';
import { MeterTimer } from './services/MeterTimer';
import ConnectionPanel from './components/ConnectionPanel';
import ConnectorCard from './components/ConnectorCard';
import SimulatorActions from './components/SimulatorActions';
import LogConsole from './components/LogConsole';
import ChargingHistory from './components/ChargingHistory';
import './App.css';

function App() {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [stationConfig, setStationConfig] = useState(null);
  const [connectors, setConnectors] = useState([]);
  const [logs, setLogs] = useState([]);
  const [meterTimers, setMeterTimers] = useState(new Map());
  
  const ocppClientRef = useRef(null);
  const chargingHistoryRefs = useRef(new Map());

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
      
      // Send BootNotification with extended info
      const bootPayload = {
        chargePointVendor: config.vendor,
        chargePointModel: config.model,
        firmwareVersion: config.firmwareVersion,
        ownerId: config.ownerId, // Thêm ownerId vào payload
        // Include location information in BootNotification
        chargePointSerialNumber: config.stationId,
        iccid: config.stationId,
        imsi: config.stationId,
        meterSerialNumber: config.stationId,
        meterType: 'Energy',
        // Custom location data (will be handled by CSMS)
        stationName: config.stationName,
        address: config.address,
        latitude: config.latitude,
        longitude: config.longitude
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
            cumulativeMeter: 0, // Bắt đầu từ 0 cho máy mới
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

  const sendStatusNotification = async (connectorId, status, errorCode = 'NoError', additionalInfo = {}) => {
    const payload = {
      connectorId,
      status,
      errorCode,
      timestamp: new Date().toISOString(),
      info: additionalInfo.info || undefined,
      // Thêm metadata cho CSMS để lưu vào Firebase
      ...additionalInfo
    };

    try {
      await ocppClientRef.current.sendCall('StatusNotification', payload);
      
      // Update connector state locally
      setConnectors(prev => prev.map(conn => 
        conn.id === connectorId 
          ? { ...conn, status, errorCode, ...additionalInfo }
          : conn
      ));
      
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
        message: `❌ Failed to send StatusNotification for connector ${connectorId}: ${error.message}`,
        timestamp: new Date().toISOString()
      });
      throw error;
    }
  };

  const handleLocalStart = async (connectorId, powerKw) => {
    try {
      const connector = connectors.find(c => c.id === connectorId);
      if (!connector) {
        throw new Error('Connector not found');
      }

      // Kiểm tra trạng thái connector - có thể là Available hoặc Preparing
      if (!['Available', 'Preparing'].includes(connector.status)) {
        throw new Error(`Connector not ready for start. Current status: ${connector.status}`);
      }

      // Nếu chưa ở trạng thái Preparing, chuyển sang Preparing trước
      if (connector.status === 'Available') {
        await sendStatusNotification(connectorId, 'Preparing');
        // Delay ngắn để mô phỏng quá trình chuẩn bị
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      // 2. Tùy chọn: Authorize
      try {
        const authResponse = await ocppClientRef.current.sendCall('Authorize', {
          idTag: 'DEMO_USER'
        });
        
        if (authResponse.idTagInfo.status !== 'Accepted') {
          throw new Error(`Authorization failed: ${authResponse.idTagInfo.status}`);
        }
        
        addLog({
          type: 'log',
          level: 'info',
          message: `✅ Authorization successful for connector ${connectorId}`,
          timestamp: new Date().toISOString()
        });
      } catch (authError) {
        addLog({
          type: 'log',
          level: 'warn',
          message: `⚠️ Authorization failed, continuing anyway: ${authError.message}`,
          timestamp: new Date().toISOString()
        });
      }

      // 3. Bắt đầu transaction
      // Lấy meterStart từ connector hiện tại (tích lũy từ các session trước)
      const currentConnector = connectors.find(c => c.id === connectorId);
      const meterStart = currentConnector?.cumulativeMeter || 0; // Sử dụng giá trị tích lũy thay vì random
      
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

      // Get session statistics before stopping
      const sessionStats = meterTimer ? meterTimer.getChargingStats() : {};
      const sessionEndTime = new Date();
      const sessionDuration = sessionStats.duration || 0; // Ensure we have a valid duration
      const sessionStartTime = new Date(sessionEndTime.getTime() - sessionDuration * 1000);

      // Stop transaction
      const stopPayload = {
        transactionId: connector.transactionId,
        meterStop,
        timestamp: new Date().toISOString(),
        idTag: 'DEMO_USER'
      };

      await ocppClientRef.current.sendCall('StopTransaction', stopPayload);

      // Send StatusNotification (Finishing) immediately
      await sendStatusNotification(connectorId, 'Finishing');

      // Update local state to Finishing immediately
      setConnectors(prev => prev.map(conn => 
        conn.id === connectorId 
          ? { ...conn, status: 'Finishing' }
          : conn
      ));

      // Prepare session summary data
      const sessionSummaryData = {
        id: `session_${Date.now()}_${connectorId}`,
        transactionId: connector.transactionId,
        connectorId: connectorId,
        userId: 'DEMO_USER',
        stationId: stationConfig?.id || 'UNKNOWN',
        startTime: sessionStartTime.getTime(), // Use timestamp instead of ISO string
        endTime: sessionEndTime.getTime(), // Use timestamp instead of ISO string
        duration: sessionDuration,
        meterStart: connector.meterStart || 0,
        meterStop: meterStop,
        energyConsumed: meterStop - (connector.meterStart || 0),
        pricePerKwh: sessionStats.pricePerKwh || 0,
        estimatedCost: sessionStats.estimatedCost || 0,
        status: 'completed',
        reason: 'Local stop requested'
      };

      // Save session to history instead of showing modal
      const historyRef = chargingHistoryRefs.current.get(connectorId);
      if (historyRef && historyRef.addSession) {
        historyRef.addSession(sessionSummaryData);
      }

      // Short delay then back to Available
      setTimeout(async () => {
        await sendStatusNotification(connectorId, 'Available');
        
        // Lưu cumulativeMeter và clear transaction
        setConnectors(prev => prev.map(conn => 
          conn.id === connectorId 
            ? { 
                ...conn, 
                transactionId: null, 
                meterStart: 0,
                cumulativeMeter: meterStop, // Lưu giá trị meter cuối để dùng cho session tiếp theo
                status: 'Available' // Ensure status is updated here too
              }
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

  const handleStatusChange = async (connectorId, newStatus, safetyCheckData = null) => {
    const additionalInfo = {};
    
    // Nếu chuyển sang Preparing, bao gồm thông tin safety check
    if (newStatus === 'Preparing' && safetyCheckData) {
      additionalInfo.safetyCheck = {
        vehicleParked: safetyCheckData.parked,
        cablePlugged: safetyCheckData.plugged,
        userConfirmed: safetyCheckData.confirmed,
        timestamp: new Date().toISOString(),
        passed: safetyCheckData.parked && safetyCheckData.plugged && safetyCheckData.confirmed
      };
      additionalInfo.info = `Safety check completed: ${additionalInfo.safetyCheck.passed ? 'PASSED' : 'FAILED'}`;
    }

    // Xử lý MeterTimer dựa trên trạng thái mới
    const connector = connectors.find(c => c.id === connectorId);
    console.log(`🔍 [DEBUG] handleStatusChange: connectorId=${connectorId}, newStatus=${newStatus}, connector found:`, !!connector, connector?.meterTimer ? 'has meterTimer' : 'no meterTimer');
    
    if (connector && connector.meterTimer) {
      if (newStatus === 'SuspendedEV' || newStatus === 'SuspendedEVSE') {
        // Tạm dừng MeterTimer khi suspend
        console.log(`🔍 [DEBUG] About to call pause() for connector ${connectorId}`);
        connector.meterTimer.pause();
        addLog({
          type: 'log',
          level: 'info',
          message: `⏸️ MeterTimer paused for connector ${connectorId} (${newStatus})`,
          timestamp: new Date().toISOString()
        });
      } else if (newStatus === 'Charging' && (connector.status === 'SuspendedEV' || connector.status === 'SuspendedEVSE')) {
        // Tiếp tục MeterTimer khi resume từ suspend
        connector.meterTimer.resume();
        addLog({
          type: 'log',
          level: 'info',
          message: `▶️ MeterTimer resumed for connector ${connectorId}`,
          timestamp: new Date().toISOString()
        });
      }
    }
    
    await sendStatusNotification(connectorId, newStatus, 'NoError', additionalInfo);
    
    // Cập nhật state connector sau khi gửi StatusNotification thành công
    setConnectors(prev => prev.map(c => 
      c.id === connectorId 
        ? { ...c, status: newStatus }
        : c
    ));
    
    addLog({
      type: 'log',
      level: 'info',
      message: `🔧 Connector ${connectorId} status changed to ${newStatus}${
        additionalInfo.safetyCheck ? ` (Safety: ${additionalInfo.safetyCheck.passed ? '✅' : '❌'})` : ''
      }`,
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
      await handleLocalStart(connectorId, 11);
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
          
          {/* Charging History Section */}
          <div className="charging-history-section">
            {isConnected && connectors.length > 0 && connectors.map(connector => (
              <ChargingHistory
                key={`history-${connector.id}`}
                connectorId={connector.id}
                onSessionSelect={(ref) => {
                  chargingHistoryRefs.current.set(connector.id, ref);
                }}
              />
            ))}
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
