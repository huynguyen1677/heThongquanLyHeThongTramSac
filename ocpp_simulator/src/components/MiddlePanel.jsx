import ConnectorsGrid from './ConnectorsGrid';
import ChargingHistorySection from './ChargingHistorySection';

function MiddlePanel({
  isConnected,
  connectors,
  meterServices,
  onLocalStart,
  onLocalStop,
  onStatusChange,
  chargingHistoryRefs,
  performSafetyCheck
}) {
  return (
    <div className="middle-panel">
      <ConnectorsGrid
        isConnected={isConnected}
        connectors={connectors}
        meterServices={meterServices}
        onLocalStart={onLocalStart}
        onLocalStop={onLocalStop}
        onStatusChange={onStatusChange}
        performSafetyCheck={performSafetyCheck}
      />

      <ChargingHistorySection
        isConnected={isConnected}
        connectors={connectors}
        chargingHistoryRefs={chargingHistoryRefs}
      />
    </div>
  );
}

export default MiddlePanel;