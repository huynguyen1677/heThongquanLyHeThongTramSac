import { useEffect, useState } from 'react'
import { formatCurrency, formatEnergy, formatDuration } from '../utils/format'

export function LiveMeter({ connectorData, sessionStartTime, isCharging }) {
  const [elapsedTime, setElapsedTime] = useState(0)

  // Update elapsed time every second
  useEffect(() => {
    if (!sessionStartTime) return

    const updateElapsed = () => {
      setElapsedTime(Date.now() - sessionStartTime.getTime())
    }

    updateElapsed() // Initial update
    const interval = setInterval(updateElapsed, 1000)

    return () => clearInterval(interval)
  }, [sessionStartTime])

  const currentPower = connectorData?.power || 0
  const currentEnergy = (connectorData?.energy || 0) / 1000 // Convert Wh to kWh
  const pricePerKwh = connectorData?.pricePerKwh || 3500
  const estimatedCost = currentEnergy * pricePerKwh

  return (
    <div className="space-y-4">
      {/* Main Meter Display */}
      <div className="card bg-gradient-to-br from-blue-50 to-green-50 border-blue-200">
        <div className="text-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            {isCharging ? '⚡ Đang sạc điện' : '🔌 Sẵn sàng sạc'}
          </h2>
          <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
            isCharging 
              ? 'bg-green-100 text-green-800 animate-pulse'
              : 'bg-yellow-100 text-yellow-800'
          }`}>
            {connectorData?.status || 'Connecting...'}
          </div>
        </div>

        {/* Live Readings */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Power */}
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600 mb-1">
              {currentPower.toFixed(1)}
            </div>
            <div className="text-sm text-gray-600">kW</div>
            <div className="text-xs text-gray-500">Công suất</div>
          </div>

          {/* Energy */}
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600 mb-1">
              {currentEnergy.toFixed(3)}
            </div>
            <div className="text-sm text-gray-600">kWh</div>
            <div className="text-xs text-gray-500">Năng lượng</div>
          </div>

          {/* Cost */}
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-600 mb-1">
              {new Intl.NumberFormat('vi-VN').format(Math.round(estimatedCost))}
            </div>
            <div className="text-sm text-gray-600">VND</div>
            <div className="text-xs text-gray-500">Ước tính</div>
          </div>
        </div>
      </div>

      {/* Session Details */}
      {sessionStartTime && (
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">
            Chi tiết phiên sạc
          </h3>
          
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium text-gray-700">Thời gian sạc:</span>
              <div className="text-lg font-mono text-blue-600">
                {formatDuration(elapsedTime)}
              </div>
            </div>
            
            <div>
              <span className="font-medium text-gray-700">Bắt đầu lúc:</span>
              <div className="text-gray-600">
                {sessionStartTime.toLocaleTimeString('vi-VN')}
              </div>
            </div>
            
            <div>
              <span className="font-medium text-gray-700">Giá điện:</span>
              <div className="text-gray-600">
                {formatCurrency(pricePerKwh)}/kWh
              </div>
            </div>
            
            <div>
              <span className="font-medium text-gray-700">Tốc độ trung bình:</span>
              <div className="text-gray-600">
                {elapsedTime > 0 ? 
                  `${(currentEnergy / (elapsedTime / 3600000)).toFixed(1)} kW` : 
                  '0 kW'
                }
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Progress Indicators */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">
          Tiến trình sạc
        </h3>
        
        <div className="space-y-4">
          {/* Energy Progress */}
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-600">Năng lượng đã sạc</span>
              <span className="font-medium">{formatEnergy(currentEnergy)}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-green-500 h-2 rounded-full transition-all duration-1000"
                style={{ 
                  width: `${Math.min((currentEnergy / 50) * 100, 100)}%` // Assume max 50kWh for visual
                }}
              ></div>
            </div>
            <div className="text-xs text-gray-500 mt-1">
              Mục tiêu: 50 kWh (hoặc theo nhu cầu)
            </div>
          </div>

          {/* Time Progress */}
          {sessionStartTime && (
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">Thời gian sạc</span>
                <span className="font-medium">{formatDuration(elapsedTime)}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-500 h-2 rounded-full transition-all duration-1000"
                  style={{ 
                    width: `${Math.min((elapsedTime / (2 * 3600000)) * 100, 100)}%` // Assume max 2 hours for visual
                  }}
                ></div>
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Ước tính: 2 giờ (tùy theo dung lượng pin)
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Real-time Status */}
      <div className="card bg-gray-50">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-medium text-gray-900">Trạng thái kết nối</h4>
            <p className="text-sm text-gray-600">
              {isCharging ? 'Đang truyền tải điện' : 'Sẵn sàng kết nối'}
            </p>
          </div>
          
          <div className={`w-4 h-4 rounded-full ${
            isCharging ? 'bg-green-500 animate-pulse' : 'bg-yellow-500'
          }`}></div>
        </div>
        
        <div className="mt-3 text-xs text-gray-500">
          Cập nhật: {new Date().toLocaleTimeString('vi-VN')}
        </div>
      </div>
    </div>
  )
}
