import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { firestoreService } from '../services/firestore'
import { auth } from '../services/firebase'
import { formatCurrency, formatEnergy, formatDuration } from '../utils/format'

export default function History() {
  const [filter, setFilter] = useState('all') // all, completed, failed, processing
  const [dateRange, setDateRange] = useState('30days') // 7days, 30days, 90days, all

  const { data: transactions = [], isLoading, error } = useQuery({
    queryKey: ['transactionHistory', auth.currentUser?.uid, dateRange],
    queryFn: async () => {
      if (!auth.currentUser?.uid) return [];
      try {
        const daysBack = dateRange === '7days' ? 7 : dateRange === '30days' ? 30 : dateRange === '90days' ? 90 : null;
        return await firestoreService.getTransactionHistory(auth.currentUser.uid, null, daysBack);
      } catch (error) {
        console.warn('Failed to load transaction history:', error);
        return []; // Return empty array on error
      }
    },
    enabled: !!auth.currentUser?.uid,
    retry: false // Don't retry on permission errors
  })

  const filteredTransactions = transactions.filter(tx => {
    if (filter === 'all') return true
    return tx.status === filter
  })

  const stats = {
    total: transactions.length,
    completed: transactions.filter(tx => tx.status === 'completed').length,
    totalEnergy: transactions.reduce((sum, tx) => sum + (tx.energyKwh || 0), 0),
    totalAmount: transactions.reduce((sum, tx) => sum + (tx.amountVnd || 0), 0)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="card">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Lịch sử sạc điện 📊
        </h1>
        <p className="text-gray-600">
          Xem tất cả phiên sạc và hóa đơn của bạn
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card text-center">
          <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
          <div className="text-sm text-gray-600">Tổng phiên sạc</div>
        </div>
        
        <div className="card text-center">
          <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
          <div className="text-sm text-gray-600">Hoàn thành</div>
        </div>
        
        <div className="card text-center">
          <div className="text-2xl font-bold text-purple-600">
            {formatEnergy(stats.totalEnergy).replace(' kWh', '')}
          </div>
          <div className="text-sm text-gray-600">kWh đã sạc</div>
        </div>
        
        <div className="card text-center">
          <div className="text-2xl font-bold text-orange-600">
            {new Intl.NumberFormat('vi-VN').format(stats.totalAmount)}
          </div>
          <div className="text-sm text-gray-600">VND đã chi</div>
        </div>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="flex flex-wrap gap-4">
          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Trạng thái
            </label>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Tất cả</option>
              <option value="completed">Hoàn thành</option>
              <option value="processing">Đang xử lý</option>
              <option value="failed">Thất bại</option>
            </select>
          </div>

          {/* Date Range Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Thời gian
            </label>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="7days">7 ngày qua</option>
              <option value="30days">30 ngày qua</option>
              <option value="90days">90 ngày qua</option>
              <option value="all">Tất cả</option>
            </select>
          </div>
        </div>
      </div>

      {/* Transaction List */}
      <div className="space-y-4">
        {isLoading ? (
          // Loading skeleton
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="card">
                <div className="animate-pulse">
                  <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredTransactions.length > 0 ? (
          filteredTransactions.map(tx => {
            const startTime = tx.startTs?.toDate ? tx.startTs.toDate() : new Date(tx.startTs)
            const stopTime = tx.stopTs?.toDate ? tx.stopTs.toDate() : new Date(tx.stopTs)
            const duration = stopTime - startTime

            return (
              <Link
                key={tx.id}
                to={`/receipt/${tx.txId}`}
                className="card hover:shadow-lg transition-shadow block"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-gray-900">
                        {tx.stationId} - Connector {tx.connectorId}
                      </h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        tx.status === 'completed'
                          ? 'bg-green-100 text-green-800'
                          : tx.status === 'failed'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {tx.status === 'completed' && '✅'}
                        {tx.status === 'failed' && '❌'}
                        {tx.status === 'processing' && '⏳'}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm text-gray-600">
                      <div>
                        <span className="font-medium">Thời gian:</span>
                        <br />
                        {startTime.toLocaleDateString('vi-VN')}
                      </div>
                      
                      <div>
                        <span className="font-medium">Thời lượng:</span>
                        <br />
                        {formatDuration(duration)}
                      </div>
                      
                      <div>
                        <span className="font-medium">Năng lượng:</span>
                        <br />
                        {formatEnergy(tx.energyKwh || 0)}
                      </div>
                      
                      <div>
                        <span className="font-medium">Thành tiền:</span>
                        <br />
                        <span className="font-semibold text-gray-900">
                          {formatCurrency(tx.amountVnd || 0)}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-gray-400 ml-4">
                    →
                  </div>
                </div>
              </Link>
            )
          })
        ) : (
          <div className="card text-center">
            <div className="text-4xl mb-4">📋</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Không có phiên sạc nào
            </h3>
            <p className="text-gray-600 mb-4">
              {filter === 'all' 
                ? 'Bạn chưa có phiên sạc nào trong khoảng thời gian đã chọn'
                : `Không có phiên sạc nào có trạng thái "${filter}"`
              }
            </p>
            <Link to="/find-station" className="btn-primary">
              Bắt đầu sạc ngay
            </Link>
          </div>
        )}
      </div>

      {/* Export Actions */}
      {filteredTransactions.length > 0 && (
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">
            Xuất báo cáo
          </h3>
          
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => {
                // Tạo CSV export
                const csvData = filteredTransactions.map(tx => ({
                  'Transaction ID': tx.txId,
                  'Trạm sạc': tx.stationId,
                  'Connector': tx.connectorId,
                  'Bắt đầu': new Date(tx.startTs?.toDate ? tx.startTs.toDate() : tx.startTs).toLocaleString('vi-VN'),
                  'Kết thúc': new Date(tx.stopTs?.toDate ? tx.stopTs.toDate() : tx.stopTs).toLocaleString('vi-VN'),
                  'Năng lượng (kWh)': tx.energyKwh,
                  'Thành tiền (VND)': tx.amountVnd,
                  'Trạng thái': tx.status
                }))
                
                const csv = [
                  Object.keys(csvData[0]).join(','),
                  ...csvData.map(row => Object.values(row).join(','))
                ].join('\n')
                
                const blob = new Blob([csv], { type: 'text/csv' })
                const url = URL.createObjectURL(blob)
                const a = document.createElement('a')
                a.href = url
                a.download = `ev-charging-history-${new Date().toISOString().split('T')[0]}.csv`
                a.click()
              }}
              className="btn-outline text-sm"
            >
              📊 Xuất CSV
            </button>
            
            <button
              onClick={() => window.print()}
              className="btn-outline text-sm"
            >
              🖨️ In báo cáo
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
