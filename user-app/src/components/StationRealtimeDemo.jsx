import React from 'react'
import { useStationRealtime } from '../hooks/useStationRealtime'

const StationRealtimeDemo = ({ stationId }) => {
  const { 
    stationData, 
    connectors, 
    loading, 
    error,
    getConnector,
    getStationSummary 
  } = useStationRealtime(stationId)

  if (loading) return <div>Đang tải dữ liệu realtime...</div>
  if (error) return <div>Lỗi: {error}</div>
  if (!stationData) return <div>Không có dữ liệu cho trạm {stationId}</div>

  const summary = getStationSummary()

  return (
    <div style={{ 
      background: '#f5f5f5', 
      padding: 20, 
      borderRadius: 8, 
      margin: 10,
      border: stationData.online ? '2px solid #4CAF50' : '2px solid #f44336'
    }}>
      <h3>🔌 Realtime Data - {stationId}</h3>
      
      <div style={{ marginBottom: 15 }}>
        <strong>Trạng thái:</strong> 
        <span style={{ 
          color: stationData.online ? '#4CAF50' : '#f44336',
          marginLeft: 8,
          fontWeight: 'bold'
        }}>
          {stationData.status}
        </span>
      </div>

      {summary && (
        <div style={{ marginBottom: 15 }}>
          <strong>Tổng quan:</strong>
          <ul style={{ margin: '8px 0', paddingLeft: 20 }}>
            <li>Tổng số cổng: {summary.totalConnectors}</li>
            <li>Sẵn sàng: {summary.availableConnectors}</li>
            <li>Đang sạc: {summary.chargingConnectors}</li>
            <li>Tỷ lệ sử dụng: {summary.occupancyRate}%</li>
          </ul>
        </div>
      )}

      <div>
        <strong>Connectors:</strong>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 10, marginTop: 10 }}>
          {connectors.map(connector => (
            <div 
              key={connector.id}
              style={{
                background: 'white',
                padding: 12,
                borderRadius: 6,
                border: `2px solid ${
                  connector.status === 'Available' ? '#4CAF50' :
                  connector.status === 'Charging' ? '#2196F3' :
                  '#FF9800'
                }`
              }}
            >
              <div><strong>Cổng {connector.id}</strong></div>
              <div>Trạng thái: {connector.status}</div>
              {connector.currentPower > 0 && (
                <div>Công suất: {(connector.currentPower / 1000).toFixed(1)} kW</div>
              )}
              {connector.sessionKwh > 0 && (
                <div>Năng lượng: {connector.sessionKwh.toFixed(2)} kWh</div>
              )}
              {connector.sessionCost > 0 && (
                <div>Chi phí: {connector.sessionCost.toLocaleString()} VNĐ</div>
              )}
              {connector.txId && (
                <div style={{ fontSize: 11, color: '#666' }}>
                  TX: {connector.txId}
                </div>
              )}
              {connector.meterValues && (
                <div style={{ fontSize: 11, color: '#666' }}>
                  {connector.meterValues.voltage > 0 && `${connector.meterValues.voltage.toFixed(0)}V `}
                  {connector.meterValues.current > 0 && `${connector.meterValues.current.toFixed(1)}A `}
                  {connector.meterValues.temperature > 0 && `${connector.meterValues.temperature.toFixed(0)}°C`}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {stationData.lastHeartbeat && (
        <div style={{ fontSize: 12, color: '#666', marginTop: 10 }}>
          Cập nhật cuối: {new Date(stationData.lastHeartbeat).toLocaleString('vi-VN')}
        </div>
      )}
    </div>
  )
}

export default StationRealtimeDemo
