import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import { LiveMeter } from '../components/LiveMeter'
import { rtdbService } from '../services/rtdb'
import { csmsApi } from '../services/csmsApi'
import { auth } from '../services/firebase'
import { formatCurrency, formatEnergy, formatDuration } from '../utils/format'

export default function ChargingSession() {
  const { stationId, connectorId } = useParams()
  const navigate = useNavigate()
  const [sessionStarted, setSessionStarted] = useState(false)
  const [txId, setTxId] = useState(null)
  const [sessionStartTime, setSessionStartTime] = useState(null)

  // Lấy dữ liệu realtime của connector
  const { data: connectorData, refetch } = useQuery({
    queryKey: ['connector', stationId, connectorId],
    queryFn: () => rtdbService.getConnectorData(stationId, connectorId),
    refetchInterval: 1000, // Refresh mỗi giây
    enabled: !!stationId && !!connectorId
  })

  // Mutation để start charging
  const startChargingMutation = useMutation({
    mutationFn: () => csmsApi.startCharging(stationId, connectorId, auth.currentUser?.uid),
    onSuccess: (response) => {
      setTxId(response.txId)
      setSessionStarted(true)
      setSessionStartTime(new Date())
      refetch()
    },
    onError: (error) => {
      console.error('Start charging error:', error)
      alert('Không thể bắt đầu sạc. Vui lòng thử lại.')
    }
  })

  // Mutation để stop charging
  const stopChargingMutation = useMutation({
    mutationFn: () => csmsApi.stopCharging(stationId, connectorId, txId),
    onSuccess: (response) => {
      // Navigate to receipt page
      navigate(`/receipt/${response.txId || txId}`)
    },
    onError: (error) => {
      console.error('Stop charging error:', error)
      alert('Không thể dừng sạc. Vui lòng thử lại hoặc liên hệ hỗ trợ.')
    }
  })

  const handleStartCharging = () => {
    startChargingMutation.mutate()
  }

  const handleStopCharging = () => {
    if (window.confirm('Bạn có chắc chắn muốn dừng sạc?')) {
      stopChargingMutation.mutate()
    }
  }

  // Auto-start charging nếu connector sẵn sàng
  useEffect(() => {
    if (connectorData && !sessionStarted && !startChargingMutation.isPending) {
      if (connectorData.status === 'Available' || connectorData.status === 'Preparing') {
        // Tự động bắt đầu sạc sau 3 giây
        const timer = setTimeout(() => {
          handleStartCharging()
        }, 3000)
        
        return () => clearTimeout(timer)
      }
    }
  }, [connectorData, sessionStarted])

  if (!connectorData) {
    return (
      <div className="space-y-6">
        <div className="card text-center">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-3/4 mx-auto mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto"></div>
          </div>
        </div>
      </div>
    )
  }

  const isCharging = connectorData.status === 'Charging'
  const canStart = connectorData.status === 'Available' || connectorData.status === 'Preparing'
  const canStop = isCharging && sessionStarted

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="card">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {stationId} - Connector {connectorId}
            </h1>
            <p className="text-gray-600">
              {isCharging ? 'Đang sạc...' : 'Chuẩn bị sạc'}
            </p>
          </div>
          
          <div className={`px-3 py-1 rounded-full text-sm font-medium ${
            isCharging 
              ? 'bg-green-100 text-green-800'
              : canStart
              ? 'bg-yellow-100 text-yellow-800' 
              : 'bg-gray-100 text-gray-800'
          }`}>
            {connectorData.status}
          </div>
        </div>
      </div>

      {/* Live Meter */}
      <LiveMeter 
        connectorData={connectorData}
        sessionStartTime={sessionStartTime}
        isCharging={isCharging}
      />

      {/* Session Info */}
      {sessionStarted && sessionStartTime && (
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">
            Thông tin phiên sạc
          </h3>
          
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium text-gray-700">Transaction ID:</span>
              <span className="ml-2 text-gray-600 font-mono">{txId}</span>
            </div>
            
            <div>
              <span className="font-medium text-gray-700">Bắt đầu lúc:</span>
              <span className="ml-2 text-gray-600">
                {sessionStartTime.toLocaleTimeString('vi-VN')}
              </span>
            </div>
            
            <div>
              <span className="font-medium text-gray-700">Thời gian sạc:</span>
              <span className="ml-2 text-gray-600">
                {formatDuration(Date.now() - sessionStartTime.getTime())}
              </span>
            </div>
            
            <div>
              <span className="font-medium text-gray-700">Người dùng:</span>
              <span className="ml-2 text-gray-600">
                {auth.currentUser?.email?.split('@')[0] || 'Guest'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Control Buttons */}
      <div className="space-y-3">
        {!sessionStarted && canStart && (
          <button
            onClick={handleStartCharging}
            disabled={startChargingMutation.isPending}
            className="btn-primary w-full"
          >
            {startChargingMutation.isPending ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Đang bắt đầu sạc...
              </div>
            ) : (
              '⚡ Bắt đầu sạc'
            )}
          </button>
        )}

        {canStop && (
          <button
            onClick={handleStopCharging}
            disabled={stopChargingMutation.isPending}
            className="btn-danger w-full"
          >
            {stopChargingMutation.isPending ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Đang dừng sạc...
              </div>
            ) : (
              '🛑 Dừng sạc'
            )}
          </button>
        )}

        <button
          onClick={() => navigate(`/station/${stationId}`)}
          className="btn-outline w-full"
        >
          ← Quay lại thông tin trạm
        </button>
      </div>

      {/* Status Messages */}
      {!sessionStarted && !canStart && (
        <div className="card bg-yellow-50 border-yellow-200">
          <div className="flex items-center">
            <div className="text-yellow-600 mr-3">⚠️</div>
            <div>
              <h4 className="font-medium text-yellow-800">
                Connector không khả dụng
              </h4>
              <p className="text-yellow-700 text-sm">
                Vui lòng chọn connector khác hoặc đợi connector này sẵn sàng
              </p>
            </div>
          </div>
        </div>
      )}

      {sessionStarted && !isCharging && (
        <div className="card bg-blue-50 border-blue-200">
          <div className="flex items-center">
            <div className="text-blue-600 mr-3">ℹ️</div>
            <div>
              <h4 className="font-medium text-blue-800">
                Đang chuẩn bị sạc
              </h4>
              <p className="text-blue-700 text-sm">
                Hệ thống đang khởi tạo phiên sạc. Vui lòng đợi trong giây lát...
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Emergency Contact */}
      <div className="card bg-red-50 border-red-200">
        <div className="text-center">
          <h4 className="font-medium text-red-800 mb-2">
            🆘 Cần hỗ trợ?
          </h4>
          <p className="text-red-700 text-sm mb-3">
            Nếu gặp sự cố, vui lòng liên hệ hotline: 
            <br />
            <strong>1900-xxxx</strong>
          </p>
          <button
            onClick={() => window.open('tel:1900xxxx')}
            className="text-red-600 hover:text-red-500 text-sm font-medium"
          >
            📞 Gọi ngay
          </button>
        </div>
      </div>
    </div>
  )
}
