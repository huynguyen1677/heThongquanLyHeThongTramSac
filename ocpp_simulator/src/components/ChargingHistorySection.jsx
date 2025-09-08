import ChargingHistory from './ChargingHistory';

function ChargingHistorySection({ 
  isConnected, 
  connectors, 
  chargingHistoryRefs 
}) {
  if (!isConnected || connectors.length === 0) {
    return null;
  }

  return (
    <div className="charging-history-section">
      {connectors.map(connector => (
        <ChargingHistory
          key={`history-${connector.id}`}
          connectorId={connector.id}
          onSessionSelect={(ref) => {
            chargingHistoryRefs.current.set(connector.id, ref);
          }}
        />
      ))}
    </div>
  );
}

export default ChargingHistorySection;