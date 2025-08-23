import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useCharging } from '../contexts/ChargingContext'
import { useAuth } from '../contexts/AuthContext'
import { format } from 'date-fns'
import { vi } from 'date-fns/locale'

const ChargingSession = () => {
  const { stationId, connectorId } = useParams()
  const { stations, activeSession, startCharging, stopCharging, loading, pricePerKwh } = useCharging()
  const { user } = useAuth()
  const navigate = useNavigate()
  
  const [actionLoading, setActionLoading] = useState(false)
  const [error, setError] = useState('')
  const [targetEnergy, setTargetEnergy] = useState('')
  const [showStartModal, setShowStartModal] = useState(false)

  const station = stations.find(s => s.id === stationId)
  const connector = station?.connectors?.find(c => c.id === parseInt(connectorId))

  useEffect(() => {
    if (!user) {
      navigate('/login')
      return
    }

    if (!station || !connector) {
      navigate('/stations')
      return
    }
  }, [user, station, connector, navigate])

  const handleStartCharging = async () => {
    if (!user) {
      navigate('/login')
      return
    }

    setActionLoading(true)
    setError('')

    try {
      await startCharging(stationId, connectorId, {
        targetEnergy: targetEnergy ? parseFloat(targetEnergy) : null,
        paymentMethod: 'wallet'
      })
      
      setShowStartModal(false)
      setTargetEnergy('')
    } catch (error) {
      console.error('Start charging error:', error)
      setError(error.message)
    } finally {
      setActionLoading(false)
    }
  }

  const handleStopCharging = async () => {
    setActionLoading(true)
    setError('')

    try {
      await stopCharging()
      navigate('/history')
    } catch (error) {
      console.error('Stop charging error:', error)
      setError(error.message)
    } finally {
      setActionLoading(false)
    }
  }

  if (loading || !station || !connector) {
    return (
      <div className="container py-8">
        <div className="flex justify-center items-center min-h-64">
          <div className="spinner"></div>
        </div>
      </div>
    )
  }

  const isCurrentSession = activeSession?.stationId === stationId && 
                          activeSession?.connectorId === parseInt(connectorId)

  const currentSession = isCurrentSession ? activeSession : null
  const isCharging = currentSession?.status === 'Charging'

  const getProgressPercentage = () => {
    if (!currentSession || !currentSession.targetEnergy) return 0
    return Math.min((currentSession.energyConsumed / currentSession.targetEnergy) * 100, 100)
  }

  const getChargingDuration = () => {
    if (!currentSession) return '00:00'
    const startTime = new Date(currentSession.startTime)
    const now = new Date()
    const duration = Math.floor((now - startTime) / 1000) // seconds
    
    const hours = Math.floor(duration / 3600)
    const minutes = Math.floor((duration % 3600) / 60)
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
  }

  const getEstimatedCompletionTime = () => {
    if (!currentSession || !currentSession.targetEnergy || currentSession.energyConsumed === 0) {
      return null
    }
    
    const remainingEnergy = currentSession.targetEnergy - currentSession.energyConsumed
    const chargingRate = currentSession.power // kW
    const remainingHours = remainingEnergy / chargingRate
    
    const completionTime = new Date(Date.now() + remainingHours * 60 * 60 * 1000)
    return format(completionTime, 'HH:mm', { locale: vi })
  }

  return (
    <div className="container py-8">
      {/* Breadcrumb */}
      <nav className="mb-6">
        <div className="flex items-center text-sm text-gray-600">
          <button onClick={() => navigate('/stations')} className="hover:text-primary-600">
            Trạm sạc
          </button>
          <span className="mx-2">›</span>
          <span className="text-gray-900">{station.name}</span>
          <span className="mx-2">›</span>
          <span className="text-gray-900">Cổng {connectorId}</span>
        </div>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2">
          {/* Station Info */}
          <div className="card mb-6">
            <div className="card-header">
              <div className="flex justify-between items-start">
                <div>
                  <h1 className="text-2xl font-bold mb-2">{station.name}</h1>
                  <p className="text-gray-600">{station.address}</p>
                </div>
                <span className={`badge ${
                  station.status === 'Online' ? 'badge-success' : 'badge-danger'
                }`}>
                  {station.status === 'Online' ? 'Hoạt động' : 'Offline'}
                </span>
              </div>
            </div>
            
            <div className="card-body">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-gray-600 text-sm">Khoảng cách</p>
                  <p className="font-semibold">📍 {station.distance}km</p>
                </div>
                <div>
                  <p className="text-gray-600 text-sm">Đánh giá</p>
                  <div className="flex items-center">
                    <span className="text-yellow-500 mr-1">⭐</span>
                    <span className="font-semibold">{station.rating}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Connector Info */}
          <div className="card mb-6">
            <div className="card-header">
              <h2 className="text-xl font-semibold">Cổng sạc #{connectorId}</h2>
            </div>
            
            <div className="card-body">
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="text-center">
                  <p className="text-gray-600 text-sm">Loại sạc</p>
                  <p className="text-xl font-bold text-primary-600">{connector.type}</p>
                </div>
                <div className="text-center">
                  <p className="text-gray-600 text-sm">Công suất</p>
                  <p className="text-xl font-bold text-primary-600">{connector.power}kW</p>
                </div>
                <div className="text-center">
                  <p className="text-gray-600 text-sm">Giá</p>
                  <p className="text-xl font-bold text-primary-600">
                    {connector.price.toLocaleString()}đ/kWh
                  </p>
                </div>
              </div>

              <div className={`connector-card ${
                connector.status === 'Available' ? 'connector-available' :
                connector.status === 'Charging' ? 'connector-charging' :
                connector.status === 'Occupied' ? 'connector-occupied' :
                'connector-unavailable'
              } mb-4`}>
                <div className="text-center py-4">
                  <div className="text-2xl mb-2">
                    {connector.status === 'Available' ? '🔌' :
                     connector.status === 'Charging' ? '⚡' :
                     connector.status === 'Occupied' ? '🚗' : '❌'}
                  </div>
                  <p className="font-semibold">
                    {connector.status === 'Available' ? 'Sẵn sàng sạc' :
                     connector.status === 'Charging' ? 'Đang sạc' :
                     connector.status === 'Occupied' ? 'Đang được sử dụng' :
                     'Không khả dụng'}
                  </p>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="bg-danger-100 text-danger-600 p-4 rounded mb-4">
                  {error}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-4">
                {!isCharging && connector.status === 'Available' && (
                  <button
                    onClick={() => setShowStartModal(true)}
                    disabled={actionLoading}
                    className="btn btn-primary flex-1"
                  >
                    {actionLoading ? (
                      <>
                        <div className="spinner mr-2"></div>
                        Đang bắt đầu...
                      </>
                    ) : (
                      'Bắt đầu sạc'
                    )}
                  </button>
                )}

                {isCharging && (
                  <button
                    onClick={handleStopCharging}
                    disabled={actionLoading}
                    className="btn btn-danger flex-1"
                  >
                    {actionLoading ? (
                      <>
                        <div className="spinner mr-2"></div>
                        Đang dừng...
                      </>
                    ) : (
                      'Dừng sạc'
                    )}
                  </button>
                )}

                <button
                  onClick={() => navigate('/stations')}
                  className="btn btn-outline"
                >
                  Quay lại
                </button>
              </div>
            </div>
          </div>

          {/* Amenities */}
          {station.amenities && station.amenities.length > 0 && (
            <div className="card">
              <div className="card-header">
                <h3 className="text-lg font-semibold">Tiện ích</h3>
              </div>
              <div className="card-body">
                <div className="flex flex-wrap gap-2">
                  {station.amenities.map(amenity => (
                    <span key={amenity} className="badge badge-primary">
                      {amenity}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar - Charging Status */}
        <div className="lg:col-span-1">
          {isCharging && currentSession ? (
            <div className="card animate-charging">
              <div className="card-header">
                <h3 className="text-lg font-semibold text-center">
                  ⚡ Đang sạc
                </h3>
              </div>
              
              <div className="card-body">
                {/* Progress */}
                {currentSession.targetEnergy && (
                  <div className="mb-6">
                    <div className="flex justify-between text-sm text-gray-600 mb-2">
                      <span>Tiến trình</span>
                      <span>{Math.round(getProgressPercentage())}%</span>
                    </div>
                    <div className="progress">
                      <div 
                        className="progress-bar charging"
                        style={{ width: `${getProgressPercentage()}%` }}
                      ></div>
                    </div>
                  </div>
                )}

                {/* Stats */}
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Thời gian:</span>
                    <span className="font-semibold">{getChargingDuration()}</span>
                  </div>
                  
                  {/* Hiển thị công suất hiện tại */}
                  {currentSession.currentPower > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Công suất:</span>
                      <span className="font-semibold text-blue-600">
                        {(currentSession.currentPower / 1000).toFixed(1)}kW
                      </span>
                    </div>
                  )}
                  
                  <div className="flex justify-between">
                    <span className="text-gray-600">Năng lượng phiên:</span>
                    <span className="font-semibold">
                      {currentSession.energyConsumed?.toFixed(2) || 0}kWh
                    </span>
                  </div>

                  {/* Hiển thị tổng năng lượng nếu khác với phiên hiện tại */}
                  {currentSession.totalEnergyConsumed && 
                   currentSession.totalEnergyConsumed !== currentSession.energyConsumed && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Tổng năng lượng:</span>
                      <span className="font-semibold text-gray-500">
                        {currentSession.totalEnergyConsumed?.toFixed(2)}kWh
                      </span>
                    </div>
                  )}
                  
                  <div className="flex justify-between">
                    <span className="text-gray-600">Chi phí phiên:</span>
                    <span className="font-semibold text-primary-600">
                      {(currentSession.cost || 0).toLocaleString()}đ
                    </span>
                  </div>

                  {/* Hiển thị tổng chi phí nếu khác với phiên hiện tại */}
                  {currentSession.totalCost && 
                   currentSession.totalCost !== currentSession.cost && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Tổng chi phí:</span>
                      <span className="font-semibold text-gray-500">
                        {currentSession.totalCost.toLocaleString()}đ
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between">
                    <span className="text-gray-600">Giá điện:</span>
                    <span className="font-semibold">
                      {pricePerKwh.toLocaleString()}đ/kWh
                    </span>
                  </div>

                  {currentSession.targetEnergy && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Mục tiêu:</span>
                      <span className="font-semibold">
                        {currentSession.targetEnergy}kWh
                      </span>
                    </div>
                  )}

                  {getEstimatedCompletionTime() && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Hoàn thành:</span>
                      <span className="font-semibold">
                        ~{getEstimatedCompletionTime()}
                      </span>
                    </div>
                  )}

                  {/* Thông tin transaction ID */}
                  {currentSession.transactionId && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Mã giao dịch:</span>
                      <span className="font-mono text-xs">
                        #{currentSession.transactionId}
                      </span>
                    </div>
                  )}

                  {/* Hiển thị trạng thái connector */}
                  {currentSession.connectorStatus && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Trạng thái:</span>
                      <span className={`badge badge-sm ${
                        currentSession.connectorStatus === 'Charging' ? 'badge-success' :
                        currentSession.connectorStatus === 'Preparing' ? 'badge-info' :
                        currentSession.connectorStatus === 'Finishing' ? 'badge-warning' :
                        'badge-secondary'
                      }`}>
                        {currentSession.connectorStatus}
                      </span>
                    </div>
                  )}

                  {/* Cập nhật cuối cùng */}
                  {currentSession.lastUpdate && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Cập nhật:</span>
                      <span className="text-xs text-gray-500">
                        {format(new Date(currentSession.lastUpdate), 'HH:mm:ss', { locale: vi })}
                      </span>
                    </div>
                  )}
                </div>

                <div className="mt-6 pt-6 border-t border-gray-200">
                  <p className="text-center text-sm text-gray-600">
                    Phiên sạc bắt đầu lúc<br/>
                    <span className="font-medium">
                      {format(new Date(currentSession.startTime), 'HH:mm - dd/MM/yyyy', { locale: vi })}
                    </span>
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="card">
              <div className="card-header">
                <h3 className="text-lg font-semibold">Thông tin sạc</h3>
              </div>
              
              <div className="card-body">
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl">🔌</span>
                  </div>
                  <p className="text-gray-600">
                    {connector.status === 'Available' 
                      ? 'Sẵn sàng để bắt đầu sạc'
                      : 'Cổng sạc không khả dụng'
                    }
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Start Charging Modal */}
      {showStartModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="card-header">
              <h3 className="text-xl font-semibold">Bắt đầu sạc</h3>
            </div>
            
            <div className="card-body">
              <div className="mb-4">
                <p className="text-gray-600 mb-4">
                  Bạn có muốn đặt mục tiêu năng lượng sạc không?
                </p>
                
                <label className="form-label">Mục tiêu năng lượng (tùy chọn)</label>
                <input
                  type="number"
                  value={targetEnergy}
                  onChange={(e) => setTargetEnergy(e.target.value)}
                  className="form-input"
                  placeholder="Ví dụ: 50"
                  min="1"
                  max="100"
                />
                <p className="text-gray-500 text-sm mt-1">
                  Để trống nếu bạn muốn tự dừng sạc
                </p>
              </div>

              <div className="bg-gray-50 p-4 rounded">
                <div className="flex justify-between mb-2">
                  <span>Giá sạc:</span>
                  <span className="font-semibold">
                    {connector.price.toLocaleString()}đ/kWh
                  </span>
                </div>
                
                {targetEnergy && (
                  <div className="flex justify-between">
                    <span>Ước tính chi phí:</span>
                    <span className="font-semibold text-primary-600">
                      {(parseFloat(targetEnergy) * connector.price).toLocaleString()}đ
                    </span>
                  </div>
                )}
              </div>
            </div>
            
            <div className="card-footer flex gap-4">
              <button
                onClick={() => setShowStartModal(false)}
                className="btn btn-outline flex-1"
                disabled={actionLoading}
              >
                Hủy
              </button>
              <button
                onClick={handleStartCharging}
                className="btn btn-primary flex-1"
                disabled={actionLoading}
              >
                {actionLoading ? (
                  <>
                    <div className="spinner mr-2"></div>
                    Đang bắt đầu...
                  </>
                ) : (
                  'Bắt đầu sạc'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ChargingSession
