import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { firestoreService } from '../services/firestore'
import { formatCurrency, formatEnergy, formatDuration } from '../utils/format'

export default function Receipt() {
  const { txId } = useParams()

  const { data: transaction, isLoading, error } = useQuery({
    queryKey: ['transaction', txId],
    queryFn: () => firestoreService.getTransactionById(txId),
    enabled: !!txId
  })

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="card">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-3/4 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !transaction) {
    return (
      <div className="card text-center">
        <div className="text-4xl mb-4">❌</div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Không tìm thấy hóa đơn
        </h2>
        <p className="text-gray-600 mb-4">
          Hóa đơn với mã "{txId}" không tồn tại hoặc đã bị xóa
        </p>
        <Link to="/history" className="btn-primary">
          Xem lịch sử sạc
        </Link>
      </div>
    )
  }

  const startTime = transaction.startTs?.toDate ? transaction.startTs.toDate() : new Date(transaction.startTs)
  const stopTime = transaction.stopTs?.toDate ? transaction.stopTs.toDate() : new Date(transaction.stopTs)
  const duration = stopTime - startTime

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="card text-center">
        <div className="text-4xl mb-3">
          {transaction.status === 'completed' ? '✅' : '⏳'}
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Hóa đơn sạc điện
        </h1>
        <p className="text-gray-600">
          Transaction ID: <span className="font-mono">{txId}</span>
        </p>
      </div>

      {/* Status */}
      <div className="card">
        <div className="flex items-center justify-between">
          <span className="font-medium text-gray-700">Trạng thái:</span>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
            transaction.status === 'completed'
              ? 'bg-green-100 text-green-800'
              : transaction.status === 'failed'
              ? 'bg-red-100 text-red-800'
              : 'bg-yellow-100 text-yellow-800'
          }`}>
            {transaction.status === 'completed' && '✅ Hoàn thành'}
            {transaction.status === 'failed' && '❌ Thất bại'}
            {transaction.status === 'processing' && '⏳ Đang xử lý'}
          </span>
        </div>
      </div>

      {/* Station & Connector Info */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">
          Thông tin trạm sạc
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium text-gray-700">Mã trạm:</span>
            <span className="ml-2 text-gray-600">{transaction.stationId}</span>
          </div>
          
          <div>
            <span className="font-medium text-gray-700">Connector:</span>
            <span className="ml-2 text-gray-600">{transaction.connectorId}</span>
          </div>
        </div>
      </div>

      {/* Time Info */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">
          Thời gian sạc
        </h3>
        
        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="font-medium text-gray-700">Bắt đầu:</span>
            <span className="text-gray-600">
              {startTime.toLocaleString('vi-VN')}
            </span>
          </div>
          
          <div className="flex justify-between">
            <span className="font-medium text-gray-700">Kết thúc:</span>
            <span className="text-gray-600">
              {stopTime.toLocaleString('vi-VN')}
            </span>
          </div>
          
          <div className="flex justify-between border-t pt-2">
            <span className="font-medium text-gray-700">Tổng thời gian:</span>
            <span className="text-gray-600 font-medium">
              {formatDuration(duration)}
            </span>
          </div>
        </div>
      </div>

      {/* Energy & Cost */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">
          Chi tiết sạc
        </h3>
        
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="font-medium text-gray-700">Năng lượng sạc:</span>
            <span className="text-xl font-bold text-blue-600">
              {formatEnergy(transaction.energyKwh || 0)}
            </span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="font-medium text-gray-700">Giá điện:</span>
            <span className="text-gray-600">
              {formatCurrency(transaction.pricePerKwh || 3500)}/kWh
            </span>
          </div>
          
          <div className="border-t pt-3 flex justify-between items-center">
            <span className="text-lg font-semibold text-gray-900">Tổng tiền:</span>
            <span className="text-2xl font-bold text-green-600">
              {formatCurrency(transaction.amountVnd || 0)}
            </span>
          </div>
        </div>
      </div>

      {/* Meter Values */}
      {(transaction.meterStart !== undefined && transaction.meterStop !== undefined) && (
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">
            Số đo công tơ
          </h3>
          
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="text-center p-3 bg-gray-50 rounded">
              <div className="font-medium text-gray-700">Số đầu</div>
              <div className="text-lg font-bold text-gray-900">
                {formatEnergy(transaction.meterStart / 1000)} {/* Convert Wh to kWh */}
              </div>
            </div>
            
            <div className="text-center p-3 bg-gray-50 rounded">
              <div className="font-medium text-gray-700">Số cuối</div>
              <div className="text-lg font-bold text-gray-900">
                {formatEnergy(transaction.meterStop / 1000)} {/* Convert Wh to kWh */}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* User Info */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">
          Thông tin người dùng
        </h3>
        
        <div className="text-sm">
          <div className="flex justify-between">
            <span className="font-medium text-gray-700">User ID:</span>
            <span className="text-gray-600 font-mono">{transaction.userId}</span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="space-y-3">
        <button
          onClick={() => window.print()}
          className="btn-primary w-full"
        >
          🖨️ In hóa đơn
        </button>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Link to="/history" className="btn-outline text-center">
            📊 Xem lịch sử
          </Link>
          
          <Link to="/find-station" className="btn-outline text-center">
            🔍 Sạc tiếp
          </Link>
        </div>
      </div>

      {/* Footer */}
      <div className="card bg-gray-50 text-center text-sm text-gray-600">
        <p className="mb-2">
          Cảm ơn bạn đã sử dụng dịch vụ sạc điện!
        </p>
        <p>
          Hóa đơn được tạo tự động vào {new Date().toLocaleString('vi-VN')}
        </p>
      </div>
    </div>
  )
}
