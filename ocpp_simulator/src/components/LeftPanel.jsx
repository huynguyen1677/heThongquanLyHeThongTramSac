import ConnectionPanel from './ConnectionPanel';
import SimulatorActions from './SimulatorActions';

function LeftPanel({ 
  onConnect, 
  onDisconnect, 
  isConnected, 
  connectionStatus, 
  onExportLogs, 
  logs 
}) {
  return (
    <div className="left-panel">
      <ConnectionPanel
        onConnect={onConnect}
        onDisconnect={onDisconnect}
        isConnected={isConnected}
        connectionStatus={connectionStatus}
      />

      <SimulatorActions
        onExportLogs={onExportLogs}
        isConnected={isConnected}
        logs={logs}
      />
    </div>
  );
}

export default LeftPanel;