import { formatCurrency } from '../utils/format'

export function PriceTag({ pricePerKwh }) {
  return (
    <div className="card bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">
            💰 Giá điện hiện tại
          </h3>
          <p className="text-sm text-gray-600">
            Áp dụng cho tất cả connector
          </p>
        </div>
        
        <div className="text-right">
          <div className="text-2xl font-bold text-green-600">
            {formatCurrency(pricePerKwh)}
          </div>
          <div className="text-sm text-gray-600">per kWh</div>
        </div>
      </div>
      
      {/* Price breakdown example */}
      <div className="mt-4 pt-4 border-t border-green-100">
        <div className="grid grid-cols-3 gap-4 text-center text-sm">
          <div>
            <div className="font-medium text-gray-900">
              {formatCurrency(pricePerKwh * 10)}
            </div>
            <div className="text-gray-600">10 kWh</div>
          </div>
          
          <div>
            <div className="font-medium text-gray-900">
              {formatCurrency(pricePerKwh * 25)}
            </div>
            <div className="text-gray-600">25 kWh</div>
          </div>
          
          <div>
            <div className="font-medium text-gray-900">
              {formatCurrency(pricePerKwh * 50)}
            </div>
            <div className="text-gray-600">50 kWh</div>
          </div>
        </div>
        
        <div className="text-center mt-3">
          <p className="text-xs text-gray-500">
            ⚡ Giá có thể thay đổi theo thời gian thực
          </p>
        </div>
      </div>
    </div>
  )
}
