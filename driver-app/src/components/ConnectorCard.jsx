import { formatCurrency } from '../utils/format'

export function ConnectorCard({ 
  connectorId, 
  connector, 
  pricePerKwh, 
  isSelected, 
  onSelect, 
  onStartCharging 
}) {
  const getStatusColor = (status) => {
    switch (status) {
      case 'Available':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'Preparing':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'Charging':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'SuspendedEV':
      case 'SuspendedEVSE':
        return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'Finishing':
        return 'bg-purple-100 text-purple-800 border-purple-200'
      case 'Reserved':
        return 'bg-gray-100 text-gray-800 border-gray-200'
      case 'Unavailable':
      case 'Faulted':
      default:
        return 'bg-red-100 text-red-800 border-red-200'
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Available':
        return '🟢'
      case 'Preparing':
        return '🟡'
      case 'Charging':
        return '⚡'
      case 'SuspendedEV':
      case 'SuspendedEVSE':
        return '⏸️'
      case 'Finishing':
        return '🏁'
      case 'Reserved':
        return '🔒'
      case 'Unavailable':
      case 'Faulted':
      default:
        return '🔴'
    }
  }

  const getStatusText = (status) => {
    switch (status) {
      case 'Available':
        return 'Sẵn sáng'
      case 'Preparing':
        return 'Đang chuẩn bị'
      case 'Charging':
        return 'Đang sạc'
      case 'SuspendedEV':
        return 'Tạm dừng (EV)'
      case 'SuspendedEVSE':
        return 'Tạm dừng (EVSE)'
      case 'Finishing':
        return 'Đang kết thúc'
      case 'Reserved':
        return 'Đã đặt trước'
      case 'Unavailable':
        return 'Không khả dụng'
      case 'Faulted':
        return 'Lỗi'
      default:
        return status
    }
  }

  const isAvailable = connector.status === 'Available' || connector.status === 'Preparing'
  const currentPower = connector.power || 0
  const currentEnergy = connector.energy || 0

  return (
    <div 
      className={`card cursor-pointer transition-all ${
        isSelected ? 'ring-2 ring-blue-500 border-blue-200' : 'hover:shadow-md'
      } ${!isAvailable ? 'opacity-75' : ''}`}
      onClick={onSelect}
    >
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Connector {connectorId}
          </h3>
          <p className="text-sm text-gray-600">
            {formatCurrency(pricePerKwh)}/kWh
          </p>
        </div>
        
        <div className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(connector.status)}`}>
          {getStatusIcon(connector.status)} {getStatusText(connector.status)}
        </div>
      </div>

      {/* Current Readings */}
      {connector.status === 'Charging' && (
        <div className="grid grid-cols-3 gap-3 mb-4 p-3 bg-gradient-to-r from-blue-50 to-green-50 rounded-lg">
          <div className="text-center">
            <div className="text-lg font-bold text-blue-600">
              {connector.currentPower ? `${connector.currentPower}W` : '0W'}
            </div>
            <div className="text-xs text-gray-600">Công suất</div>
          </div>
          
          <div className="text-center">
            <div className="text-lg font-bold text-green-600">
              {connector.sessionKwh ? `${connector.sessionKwh.toFixed(2)}kWh` : '0kWh'}
            </div>
            <div className="text-xs text-gray-600">Năng lượng</div>
          </div>
          
          <div className="text-center">
            <div className="text-lg font-bold text-purple-600">
              {connector.sessionCost ? `${connector.sessionCost.toLocaleString()}đ` : '0đ'}
            </div>
            <div className="text-xs text-gray-600">Chi phí</div>
          </div>
        </div>
      )}
      
      {/* Connector Error */}
      {connector.hasError && connector.errorCode && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center gap-2">
            <span className="text-red-600">❌</span>
            <span className="text-sm font-medium text-red-800">Lỗi: {connector.errorCode}</span>
          </div>
        </div>
      )}

      {/* Connector Info */}
      <div className="grid grid-cols-2 gap-2 text-sm text-gray-600 mb-4">
        <div>
          <span className="font-medium">Loại connector:</span>
          <br />
          {connector.type || 'Type 2 (AC)'}
        </div>
        
        <div>
          <span className="font-medium">Công suất tối đa:</span>
          <br />
          {connector.power ? `${connector.power}kW` : '22kW'}
        </div>
      </div>

      {/* Live Session Info */}
      <div>
        {liveSession ? (
          <div>
            <div>⚡ Công suất: {liveSession.powerKw} kW</div>
            <div>🔋 Đã sạc: {liveSession.liveKwh?.toFixed(2)} kWh</div>
            <div>⏱️ Thời gian: {Math.floor(liveSession.elapsedSec/60)} phút {liveSession.elapsedSec%60} giây</div>
            <div>💰 Ước tính: {liveSession.estAmountVnd?.toLocaleString()} ₫</div>
          </div>
        ) : (
          <div className="text-gray-400">Chưa có phiên sạc</div>
        )}
      </div>

      {/* Action Button */}
      {isAvailable && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            onStartCharging()
          }}
          className="btn-primary w-full"
        >
          ⚡ Bắt đầu sạc
        </button>
      )}

      {!isAvailable && (
        <div className="text-center text-gray-500 text-sm py-2">
          {connector.status === 'Charging' 
            ? 'Đang được sử dụng bởi người khác'
            : 'Connector không khả dụng'
          }
        </div>
      )}
    </div>
  )
}
