import ConnectorCard from './ConnectorCard';

function ConnectorsGrid({ 
  isConnected, 
  connectors, 
  meterServices, 
  onLocalStart, 
  onLocalStop, 
  onStatusChange, 
  performSafetyCheck // Nhận props performSafetyCheck
}) {
  return (
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
                meterService={meterServices.get(connector.id)}
                onLocalStart={onLocalStart}
                onLocalStop={onLocalStop}
                onStatusChange={onStatusChange}
                performSafetyCheck={performSafetyCheck} // Thêm dòng này
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
  );
}

export default ConnectorsGrid;