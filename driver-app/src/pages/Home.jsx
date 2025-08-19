import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { firestoreService } from '../services/firestore'
import { auth } from '../services/firebase'

export default function Home() {
  // Lấy lịch sử giao dịch gần đây
  const { data: recentTransactions = [], isLoading } = useQuery({
    queryKey: ['recentTransactions', auth.currentUser?.uid],
    queryFn: async () => {
      if (!auth.currentUser?.uid) return [];
      try {
        return await firestoreService.getTransactionHistory(auth.currentUser.uid, 3);
      } catch (error) {
        console.warn('Failed to load recent transactions:', error);
        return [];
      }
    },
    enabled: !!auth.currentUser?.uid,
    retry: false
  })

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="card glass">
        <div className="text-center">
          <div className="text-6xl mb-4 text-glow">⚡</div>
          <h1 className="text-3xl font-bold heading-gradient mb-3">
            Chào mừng đến với EV Driver!
          </h1>
          <p className="text-gray-600 font-medium">
            Tìm trạm sạc và bắt đầu hành trình xanh của bạn
          </p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link to="/find-station" className="card glass hover:shadow-lg transition-all station-card">
          <div className="text-center">
            <div className="text-5xl mb-4 text-glow">🗺️</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Bản đồ trạm sạc
            </h3>
            <p className="text-gray-600 text-sm">
              Xem trạm sạc gần bạn trên bản đồ tương tác
            </p>
          </div>
        </Link>

        <Link to="/find-station" className="card glass hover:shadow-lg transition-all station-card">
          <div className="text-center">
            <div className="text-5xl mb-4 text-glow">🔍</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Tìm trạm sạc
            </h3>
            <p className="text-gray-600 text-sm">
              Nhập mã trạm hoặc quét QR code để kết nối
            </p>
          </div>
        </Link>

        <Link to="/history" className="card glass hover:shadow-lg transition-all station-card">
          <div className="text-center">
            <div className="text-5xl mb-4 text-glow">📊</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Lịch sử sạc
            </h3>
            <p className="text-gray-600 text-sm">
              Xem tất cả phiên sạc và hóa đơn của bạn
            </p>
          </div>
        </Link>

        <Link to="/debug-stations" className="card glass hover:shadow-lg transition-all station-card bg-gradient-to-r from-yellow-50 to-orange-50">
          <div className="text-center">
            <div className="text-5xl mb-4 text-glow">🔧</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Debug Stations
            </h3>
            <p className="text-gray-600 text-sm">
              Xem tất cả dữ liệu trạm sạc trong Firebase
            </p>
          </div>
        </Link>
      </div>

      {/* Recent Transactions */}
      <div className="card glass">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">
            ⚡ Phiên sạc gần đây
          </h2>
          <Link to="/history" className="text-blue-600 hover:text-blue-500 text-sm font-medium">
            Xem tất cả →
          </Link>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="animate-pulse">
                <div className="h-16 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        ) : recentTransactions.length > 0 ? (
          <div className="space-y-3">
            {recentTransactions.map(tx => (
              <Link
                key={tx.id}
                to={`/receipt/${tx.txId}`}
                className="block p-3 bg-gray-50 hover:bg-gray-100 rounded transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-gray-900">
                      {tx.stationId} - Connector {tx.connectorId}
                    </div>
                    <div className="text-sm text-gray-600">
                      {tx.energyKwh?.toFixed(2)} kWh • {new Date(tx.stopTs?.toDate ? tx.stopTs.toDate() : tx.stopTs).toLocaleDateString('vi-VN')}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-gray-900">
                      {new Intl.NumberFormat('vi-VN', {
                        style: 'currency',
                        currency: 'VND'
                      }).format(tx.amountVnd || 0)}
                    </div>
                    <div className="text-xs text-gray-500">
                      {tx.status === 'completed' ? '✅ Hoàn thành' : '⏳ Đang xử lý'}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <div className="text-4xl mb-2">🔋</div>
            <p>Bạn chưa có phiên sạc nào</p>
            <p className="text-sm">Hãy tìm trạm sạc để bắt đầu!</p>
          </div>
        )}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="card text-center">
          <div className="text-2xl font-bold text-blue-600">
            {recentTransactions.length}
          </div>
          <div className="text-sm text-gray-600">Tổng phiên sạc</div>
        </div>

        <div className="card text-center">
          <div className="text-2xl font-bold text-green-600">
            {recentTransactions.reduce((total, tx) => total + (tx.energyKwh || 0), 0).toFixed(1)}
          </div>
          <div className="text-sm text-gray-600">kWh đã sạc</div>
        </div>

        <div className="card text-center col-span-2 md:col-span-1">
          <div className="text-2xl font-bold text-purple-600">
            {new Intl.NumberFormat('vi-VN').format(
              recentTransactions.reduce((total, tx) => total + (tx.amountVnd || 0), 0)
            )}
          </div>
          <div className="text-sm text-gray-600">VND đã chi</div>
        </div>
      </div>
    </div>
  )
}
