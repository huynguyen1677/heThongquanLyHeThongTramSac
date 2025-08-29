import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useCharging } from '../contexts/ChargingContext'
import { format } from 'date-fns'
import { vi } from 'date-fns/locale'
import './ChargingSession.css'

const ChargingSession = () => {
  const { user } = useAuth()
  const { stationId, connectorId } = useParams()
  const navigate = useNavigate()
  
  const { 
    stations, 
    activeSession,
    startCharging, 
    stopCharging, 
    loading, 
    error,
    confirmationRequest,
    respondToConfirmationRequest
  } = useCharging()

  // Hook để lắng nghe realtime data của trạm cụ thể
  const { 
    stationData: realtimeStation, 
    connectors: realtimeConnectors, 
    loading: realtimeLoading, 
    error: realtimeError,
    getConnector,
    getStationSummary 
  } = useStationRealtime(stationId)

  const [showModal, setShowModal] = useState(false)
  const [elapsedTime, setElapsedTime] = useState(0)

  // Debug log để kiểm tra URL params
  console.log('URL Params - stationId:', stationId, 'connectorId:', connectorId)

  // Hàm format thời gian từ giây thành HH:MM:SS
  const formatTime = (seconds) => {
    if (!seconds) return '00:00:00'
    const hrs = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  // Format số điện năng (kWh)
  const formatKwh = (kwh) => {
    if (!kwh) return '0.00'
    return parseFloat(kwh).toFixed(2)
  }

  // Format công suất (từ W sang kW)
  const formatPower = (watts) => {
    if (!watts) return '0.0'
    return (watts / 1000).toFixed(1)
  }

  // Format chi phí
  const formatCost = (cost) => {
    if (!cost) return '0'
    return new Intl.NumberFormat('vi-VN').format(cost)
  }

  // Format thời gian cập nhật cuối
  const formatLastUpdate = (timestamp) => {
    if (!timestamp) return 'Chưa có dữ liệu'
    return format(new Date(timestamp), 'HH:mm:ss dd/MM/yyyy', { locale: vi })
  }

  // Lấy trạng thái connector realtime
  const getConnectorStatus = (status) => {
    const statusMap = {
      'Available': { text: 'Sẵn sàng', color: '#4CAF50' },
      'Preparing': { text: 'Chuẩn bị', color: '#FF9800' },
      'Charging': { text: 'Đang sạc', color: '#2196F3' },
      'SuspendedEV': { text: 'Tạm dừng (xe)', color: '#9C27B0' },
      'SuspendedEVSE': { text: 'Tạm dừng (trạm)', color: '#FF5722' },
      'Finishing': { text: 'Kết thúc', color: '#795548' },
      'Reserved': { text: 'Đã đặt trước', color: '#607D8B' },
      'Unavailable': { text: 'Không khả dụng', color: '#F44336' },
      'Faulted': { text: 'Lỗi', color: '#E91E63' }
    }
    
    return statusMap[status] || { text: status || 'Không xác định', color: '#9E9E9E' }
  }

  // Hiển thị thông tin tải hoặc lỗi
  if (loading || realtimeLoading) {
    return (
      <div className="charging-session">
        <div className="loading">
          <div className="loading-spinner"></div>
          <p>Đang tải thông tin trạm sạc...</p>
        </div>
      </div>
    )
  }

  if (error || realtimeError) {
    return (
      <div className="charging-session">
        <div className="error">
          <h2>Lỗi</h2>
          <p>{error || realtimeError}</p>
          <button onClick={() => navigate('/stations')}>
            Quay lại danh sách trạm
          </button>
        </div>
      </div>
    )
  }

  // Tìm station từ danh sách Firestore và merge với realtime data
  const firestoreStation = stations.find(s => s.id === stationId)
  const station = firestoreStation ? {
    ...firestoreStation,
    // Ưu tiên dữ liệu realtime nếu có
    ...(realtimeStation && {
      online: realtimeStation.online,
      status: realtimeStation.status,
      lastHeartbeat: realtimeStation.lastHeartbeat,
    })
  } : null

  console.log('Station data merged:', { firestoreStation, realtimeStation, station })

  if (!station) {
    return (
      <div className="charging-session">
        <div className="error">
          <h2>Không tìm thấy trạm sạc</h2>
          <p>Trạm sạc {stationId} không tồn tại hoặc đã bị xóa.</p>
          <button onClick={() => navigate('/stations')}>
            Quay lại danh sách trạm
          </button>
        </div>
      </div>
    )
  }

  // Lấy thông tin connector - ưu tiên dữ liệu realtime
  let currentConnector = null
  
  if (connectorId) {
    // Thử lấy từ realtime trước
    currentConnector = getConnector(connectorId)
    
    // Nếu không có realtime, lấy từ Firestore
    if (!currentConnector && station.connectors) {
      if (Array.isArray(station.connectors)) {
        currentConnector = station.connectors.find(c => 
          c.id === connectorId || 
          c.id === parseInt(connectorId) ||
          c.id === parseFloat(connectorId) ||
          String(c.id) === connectorId
        )
      } else {
        currentConnector = station.connectors[connectorId] || 
                          station.connectors[parseInt(connectorId)] ||
                          station.connectors[parseFloat(connectorId)] ||
                          station.connectors[String(connectorId)]
        
        if (currentConnector && !currentConnector.id) {
          currentConnector = { ...currentConnector, id: connectorId }
        }
      }
    }
  }

  // Debug log để kiểm tra dữ liệu
  console.log('Connectors data:', { 
    firestore: station.connectors, 
    realtime: realtimeConnectors,
    looking_for: connectorId,
    found: currentConnector 
  })

  // Nếu không có connectorId, hiển thị danh sách connectors để chọn
  if (!connectorId) {
    return (
      <div className="charging-session">
        <header className="session-header">
          <button onClick={() => navigate('/stations')} className="back-button">
            ← Quay lại
          </button>
          <h1>Chọn cổng sạc</h1>
        </header>

        {/* Thông tin trạm sạc với trạng thái realtime */}
        <div className="station-info">
          <h2>{station.name}</h2>
          <div className="station-status">
            <span className={`status-indicator ${station.online ? 'online' : 'offline'}`}>
              {station.online ? '🟢 Online' : '🔴 Offline'}
            </span>
            {station.lastHeartbeat && (
              <span className="last-update">
                Cập nhật: {formatLastUpdate(station.lastHeartbeat)}
              </span>
            )}
          </div>
          <p>{station.location}</p>
          
          {/* Thêm thông tin chi tiết từ realtime */}
          {realtimeStation && (
            <div className="station-details">
              <div className="detail-grid">
                {realtimeStation.model && (
                  <div className="detail-item">
                    <label>Model:</label>
                    <span>{realtimeStation.model}</span>
                  </div>
                )}
                {realtimeStation.vendor && (
                  <div className="detail-item">
                    <label>Vendor:</label>
                    <span>{realtimeStation.vendor}</span>
                  </div>
                )}
                {realtimeStation.firmwareVersion && (
                  <div className="detail-item">
                    <label>Firmware:</label>
                    <span>{realtimeStation.firmwareVersion}</span>
                  </div>
                )}
                {realtimeStation.serialNumber && (
                  <div className="detail-item">
                    <label>Serial:</label>
                    <span>{realtimeStation.serialNumber}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Hiển thị demo realtime data đầy đủ */}
        {stationId && (
          <div className="realtime-demo-section">
            <StationRealtimeDemo stationId={stationId} />
          </div>
        )}

        {/* Danh sách connectors để chọn - ưu tiên realtime data */}
        <div className="connector-selection">
          <h3>Chọn cổng sạc:</h3>
          <div className="connectors-grid">
            {(realtimeConnectors.length > 0 ? realtimeConnectors : 
              (station.connectors && (Array.isArray(station.connectors) 
                ? station.connectors 
                : Object.entries(station.connectors).map(([id, connector]) => ({ id, ...connector }))
              ))
            ).map((connector, idx) => {
              const connectorStatusInfo = getConnectorStatus(connector.status)
              const canUse = connector.status === 'Available'
              
              return (
                <div 
                  key={connector.id || idx}
                  className={`connector-card ${canUse ? 'available' : 'unavailable'}`}
                  onClick={() => canUse && navigate(`/charging/${stationId}/${connector.id || idx}`)}
                >
                  <h4>Cổng {connector.id || idx}</h4>
                  <div 
                    className="connector-status-badge"
                    style={{ backgroundColor: connectorStatusInfo.color }}
                  >
                    {connectorStatusInfo.text}
                  </div>
                  <div className="connector-specs">
                    <div>Loại: {connector.type || 'AC Type 2'}</div>
                    <div>Công suất: {connector.maxPower || 22} kW</div>
                    <div>Giá: {formatCost(connector.pricePerKwh || 3500)} VNĐ/kWh</div>
                    {/* Hiển thị dữ liệu realtime nếu có */}
                    {connector.currentPower > 0 && (
                      <div style={{ color: '#2196F3', fontWeight: 'bold' }}>
                        Công suất hiện tại: {formatPower(connector.currentPower)} kW
                      </div>
                    )}
                    {connector.sessionKwh > 0 && (
                      <div style={{ color: '#FF9800' }}>
                        Đang sạc: {formatKwh(connector.sessionKwh)} kWh
                      </div>
                    )}
                  </div>
                  {canUse && <div className="click-hint">👆 Click để sạc</div>}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    )
  }

  if (!currentConnector) {
    return (
      <div className="charging-session">
        <div className="error">
          <h2>Không tìm thấy cổng sạc</h2>
          <p>Cổng sạc {connectorId} không tồn tại tại trạm này.</p>
          <details style={{ marginTop: 10, fontSize: 12, color: '#666' }}>
            <summary>Debug Information</summary>
            <div style={{ marginTop: 8, padding: 8, background: '#f5f5f5', borderRadius: 4 }}>
              <p><strong>Tìm kiếm connector ID:</strong> {connectorId} (type: {typeof connectorId})</p>
              <p><strong>Connectors có sẵn:</strong></p>
              <ul>
                {station.connectors && Object.entries(station.connectors).map(([key, value]) => (
                  <li key={key}>
                    Key: {key} (type: {typeof key}) - ID: {value.id} (type: {typeof value.id})
                  </li>
                ))}
              </ul>
              <p><strong>Realtime connectors:</strong> {JSON.stringify(realtimeConnectors, null, 2)}</p>
            </div>
          </details>
          <button onClick={() => navigate('/stations')}>
            Quay lại danh sách trạm
          </button>
        </div>
      </div>
    )
  }

  // Timer cho elapsed time
  useEffect(() => {
    let interval = null
    if (activeSession?.isCharging) {
      interval = setInterval(() => {
        const now = Date.now()
        const startTime = new Date(activeSession.startTime).getTime()
        setElapsedTime(Math.floor((now - startTime) / 1000))
      }, 1000)
    } else {
      setElapsedTime(0)
    }
    return () => clearInterval(interval)
  }, [activeSession?.isCharging, activeSession?.startTime])

  const handleStartCharging = async () => {
    try {
      await startCharging(stationId, connectorId)
    } catch (error) {
      console.error('Error starting charging:', error)
      alert('Không thể bắt đầu sạc: ' + error.message)
    }
  }

  const handleStopCharging = async () => {
    try {
      await stopCharging()
      setShowModal(true)
    } catch (error) {
      console.error('Error stopping charging:', error)
      alert('Không thể dừng sạc: ' + error.message)
    }
  }

  const isCharging = activeSession && 
    activeSession.stationId === stationId && 
    activeSession.connectorId === connectorId && 
    activeSession.isCharging

  const canStartCharging = currentConnector.status === 'Available' && !isCharging

  const connectorStatusInfo = getConnectorStatus(currentConnector.status)

  return (
    <div className="charging-session">
      <header className="session-header">
        <button onClick={() => navigate('/stations')} className="back-button">
          ← Quay lại
        </button>
        <h1>Phiên sạc</h1>
      </header>

      {/* Thông tin trạm sạc với trạng thái realtime */}
      <div className="station-info">
        <h2>{station.name}</h2>
        <div className="station-status">
          <span className={`status-indicator ${station.online ? 'online' : 'offline'}`}>
            {station.online ? '🟢 Online' : '🔴 Offline'}
          </span>
          {station.lastHeartbeat && (
            <span className="last-update">
              Cập nhật: {formatLastUpdate(station.lastHeartbeat)}
            </span>
          )}
        </div>
        <p>{station.location}</p>
        
        {/* Thêm thông tin chi tiết từ realtime */}
        {realtimeStation && (
          <div className="station-details">
            <div className="detail-grid">
              {realtimeStation.model && (
                <div className="detail-item">
                  <label>Model:</label>
                  <span>{realtimeStation.model}</span>
                </div>
              )}
              {realtimeStation.vendor && (
                <div className="detail-item">
                  <label>Vendor:</label>
                  <span>{realtimeStation.vendor}</span>
                </div>
              )}
              {realtimeStation.firmwareVersion && (
                <div className="detail-item">
                  <label>Firmware:</label>
                  <span>{realtimeStation.firmwareVersion}</span>
                </div>
              )}
              {realtimeStation.serialNumber && (
                <div className="detail-item">
                  <label>Serial:</label>
                  <span>{realtimeStation.serialNumber}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Hiển thị demo realtime data đầy đủ */}
      {stationId && (
        <div className="realtime-demo-section">
          <StationRealtimeDemo stationId={stationId} />
        </div>
      )}

      {/* Thông tin connector với dữ liệu realtime */}
      <div className="connector-info">
        <h3>Cổng sạc {connectorId}</h3>
        <div className="connector-details">
          <div className="connector-status">
            <span 
              className="status-badge"
              style={{ backgroundColor: connectorStatusInfo.color }}
            >
              {connectorStatusInfo.text}
            </span>
            {currentConnector.txId && (
              <span className="transaction-id">
                TX: {currentConnector.txId}
              </span>
            )}
          </div>
          
          <div className="connector-specs">
            <div className="spec-item">
              <label>Loại:</label>
              <span>{currentConnector.type || 'AC Type 2'}</span>
            </div>
            <div className="spec-item">
              <label>Công suất tối đa:</label>
              <span>{currentConnector.maxPower || 22} kW</span>
            </div>
            <div className="spec-item">
              <label>Giá:</label>
              <span>{formatCost(currentConnector.pricePerKwh || 3500)} VNĐ/kWh</span>
            </div>
          </div>

          {/* Hiển thị dữ liệu realtime từ connector - luôn hiển thị */}
          <div className="realtime-data">
            <h4>📊 Dữ liệu thời gian thực</h4>
            <div className="realtime-metrics">
              <div className="metric">
                <label>Công suất hiện tại:</label>
                <span className="value">{formatPower(currentConnector.currentPower || 0)} kW</span>
              </div>
              <div className="metric">
                <label>Điện năng tổng:</label>
                <span className="value">{formatKwh(currentConnector.energyConsumed || 0)} kWh</span>
              </div>
              <div className="metric">
                <label>Điện năng phiên sạc:</label>
                <span className="value">{formatKwh(currentConnector.sessionKwh || 0)} kWh</span>
              </div>
              <div className="metric">
                <label>Chi phí phiên sạc:</label>
                <span className="value">{formatCost(currentConnector.sessionCost || 0)} VNĐ</span>
              </div>
              <div className="metric">
                <label>Chi phí ước tính:</label>
                <span className="value">{formatCost(currentConnector.totalCost || 0)} VNĐ</span>
              </div>
              
              {/* Meter values từ OCPP */}
              {currentConnector.meterValues && (
                <>
                  <div className="metric">
                    <label>Điện áp:</label>
                    <span className="value">{(currentConnector.meterValues.voltage || 0).toFixed(1)} V</span>
                  </div>
                  <div className="metric">
                    <label>Dòng điện:</label>
                    <span className="value">{(currentConnector.meterValues.current || 0).toFixed(2)} A</span>
                  </div>
                  <div className="metric">
                    <label>Nhiệt độ:</label>
                    <span className="value">{(currentConnector.meterValues.temperature || 0).toFixed(1)} °C</span>
                  </div>
                  <div className="metric">
                    <label>Tần số:</label>
                    <span className="value">{(currentConnector.meterValues.frequency || 0).toFixed(1)} Hz</span>
                  </div>
                  <div className="metric">
                    <label>Hệ số công suất:</label>
                    <span className="value">{(currentConnector.meterValues.powerFactor || 0).toFixed(2)}</span>
                  </div>
                  <div className="metric">
                    <label>Tổng Wh:</label>
                    <span className="value">{formatKwh((currentConnector.meterValues.whTotal || 0) / 1000)} kWh</span>
                  </div>
                </>
              )}
            </div>
            
            {/* Thông tin session đang hoạt động */}
            {currentConnector.activeSession && (
              <div className="active-session-info">
                <h5>🔋 Phiên sạc đang hoạt động</h5>
                <div className="session-details">
                  <div>Transaction ID: {currentConnector.activeSession.transactionId}</div>
                  <div>ID Tag: {currentConnector.activeSession.idTag}</div>
                  {currentConnector.activeSession.startTime && (
                    <div>Bắt đầu: {formatLastUpdate(currentConnector.activeSession.startTime)}</div>
                  )}
                  {currentConnector.activeSession.sessionDuration && (
                    <div>Thời gian: {formatTime(currentConnector.activeSession.sessionDuration)}</div>
                  )}
                  {currentConnector.activeSession.meterStart > 0 && (
                    <div>Meter bắt đầu: {currentConnector.activeSession.meterStart} Wh</div>
                  )}
                </div>
              </div>
            )}
            
            {currentConnector.lastUpdate && (
              <div className="last-update-info">
                <small>Cập nhật lần cuối: {formatLastUpdate(currentConnector.lastUpdate)}</small>
              </div>
            )}
          </div>

          {/* Hiển thị lỗi nếu có */}
          {currentConnector.errorCode && (
            <div className="error-info">
              <h4>⚠️ Cảnh báo</h4>
              <p>Mã lỗi: {currentConnector.errorCode}</p>
            </div>
          )}
        </div>
      </div>

      {/* Thông tin phiên sạc hiện tại */}
      {isCharging && activeSession && (
        <div className="session-info">
          <h3>📱 Phiên sạc hiện tại</h3>
          <div className="session-metrics">
            <div className="metric-card">
              <div className="metric-label">Thời gian sạc</div>
              <div className="metric-value">{formatTime(elapsedTime)}</div>
            </div>
            <div className="metric-card">
              <div className="metric-label">Điện năng</div>
              <div className="metric-value">
                {formatKwh(activeSession.energyConsumed || activeSession.sessionKwh)} kWh
              </div>
            </div>
            <div className="metric-card">
              <div className="metric-label">Công suất</div>
              <div className="metric-value">
                {formatPower(activeSession.currentPower || currentConnector.currentPower)} kW
              </div>
            </div>
            <div className="metric-card">
              <div className="metric-label">Chi phí</div>
              <div className="metric-value">
                {formatCost(activeSession.cost || activeSession.sessionCost)} VNĐ
              </div>
            </div>
          </div>

          {/* Progress bar */}
          <div className="charging-progress">
            <div className="progress-info">
              <span>Đang sạc...</span>
              <span>{Math.min(100, Math.floor((activeSession.energyConsumed || 0) / 50 * 100))}%</span>
            </div>
            <div className="progress-bar">
              <div 
                className="progress-fill"
                style={{ width: `${Math.min(100, Math.floor((activeSession.energyConsumed || 0) / 50 * 100))}%` }}
              ></div>
            </div>
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="charging-controls">
        {canStartCharging ? (
          <button 
            onClick={handleStartCharging}
            className="start-button"
            disabled={!station.online}
          >
            {!station.online ? 'Trạm đang offline' : 'Bắt đầu sạc'}
          </button>
        ) : isCharging ? (
          <button 
            onClick={handleStopCharging}
            className="stop-button"
          >
            Dừng sạc
          </button>
        ) : (
          <button 
            className="disabled-button"
            disabled
          >
            {connectorStatusInfo.text}
          </button>
        )}
      </div>

      {/* Modal kết thúc phiên sạc */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Phiên sạc đã kết thúc</h3>
            <div className="session-summary">
              <p><strong>Thời gian sạc:</strong> {formatTime(elapsedTime)}</p>
              <p><strong>Điện năng tiêu thụ:</strong> {formatKwh(activeSession?.energyConsumed)} kWh</p>
              <p><strong>Tổng chi phí:</strong> {formatCost(activeSession?.cost)} VNĐ</p>
            </div>
            <div className="modal-actions">
              <button onClick={() => setShowModal(false)}>Đóng</button>
              <button onClick={() => {
                setShowModal(false)
                navigate('/history')
              }}>
                Xem lịch sử
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Popup xác nhận sạc từ CSMS */}
      <ChargingConfirmationDialog
        confirmationRequest={confirmationRequest}
        onRespond={respondToConfirmationRequest}
      />
    </div>
  )
}

// Thêm component dialog xác nhận ở cuối file
function ChargingConfirmationDialog({ confirmationRequest, onRespond }) {
  if (!confirmationRequest) return null;
  return (
    <div className="modal-overlay">
      <div className="modal">
        <h3>Yêu cầu xác nhận sạc</h3>
        <p>
          Trạm <b>{confirmationRequest.stationId}</b> - Cổng <b>{confirmationRequest.connectorId}</b> muốn bắt đầu sạc.<br />
          Bạn có đồng ý không?
        </p>
        <div className="modal-actions">
          <button onClick={() => onRespond(true)} className="start-button">Đồng ý</button>
          <button onClick={() => onRespond(false)} className="stop-button">Từ chối</button>
        </div>
      </div>
    </div>
  );
}

export default ChargingSession
