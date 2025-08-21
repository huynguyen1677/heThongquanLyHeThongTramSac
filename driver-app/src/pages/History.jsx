import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore'
import { auth, db } from '../services/firebase'
import { formatCurrency, formatEnergy, formatDuration } from '../utils/format'

export default function History() {
  const [filter, setFilter] = useState('all') // all, completed, cancelled, active
  const [dateRange, setDateRange] = useState('30days') // 7days, 30days, 90days, all
  const [sessions, setSessions] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  // Get current user ID (you might need to adjust this based on your auth system)
  const userId = auth.currentUser?.uid || localStorage.getItem('userId') || 'user123';

  useEffect(() => {
    const fetchSessions = async () => {
      if (!userId) return;

      try {
        setIsLoading(true);
        setError(null);
        
        // Query Firestore directly for charging sessions by userId
        // Remove orderBy to avoid composite index requirement for now
        const sessionsRef = collection(db, 'chargingSessions');
        const q = query(
          sessionsRef,
          where('userId', '==', userId),
          limit(100)
        );
        
        const querySnapshot = await getDocs(q);
        const sessionsData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        // Sort manually after fetching
        const sortedSessions = sessionsData.sort((a, b) => {
          const dateA = new Date(a.startTime);
          const dateB = new Date(b.startTime);
          return dateB - dateA; // Newest first
        });
        
        // Filter by date range
        const filteredByDate = sortedSessions.filter(session => {
          if (dateRange === 'all') return true;
          
          const sessionDate = new Date(session.startTime);
          const now = new Date();
          const daysBack = dateRange === '7days' ? 7 : dateRange === '30days' ? 30 : 90;
          const cutoffDate = new Date(now.getTime() - (daysBack * 24 * 60 * 60 * 1000));
          
          return sessionDate >= cutoffDate;
        });
        
        setSessions(filteredByDate);
      } catch (err) {
        console.error('Error fetching charging sessions from Firestore:', err);
        setError('Không thể tải lịch sử phiên sạc');
        setSessions([]); // Set empty array on error
      } finally {
        setIsLoading(false);
      }
    };

    fetchSessions();
  }, [userId, dateRange]);

  const filteredTransactions = sessions.filter(session => {
    if (filter === 'all') return true
    return session.status === filter
  })

  const stats = {
    total: sessions.length,
    completed: sessions.filter(session => session.status === 'completed').length,
    totalEnergy: sessions.reduce((sum, session) => sum + ((session.energyConsumed || 0) / 1000), 0), // Convert Wh to kWh
    totalAmount: sessions.reduce((sum, session) => sum + (session.estimatedCost || 0), 0)
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
              <option value="active">Đang sạc</option>
              <option value="cancelled">Đã hủy</option>
              <option value="error">Lỗi</option>
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
          filteredTransactions.map(session => {
            const startTime = new Date(session.startTime)
            const stopTime = session.stopTime ? new Date(session.stopTime) : null
            const duration = session.duration || (stopTime && startTime ? (stopTime - startTime) / 1000 : 0)

            return (
              <Link
                key={session.id}
                to={`/receipt`}
                state={{ session }}
                className="card hover:shadow-lg transition-shadow block"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-gray-900">
                        {session.stationName || session.stationId} - Connector {session.connectorId}
                      </h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        session.status === 'completed'
                          ? 'bg-green-100 text-green-800'
                          : session.status === 'cancelled' || session.status === 'error'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {session.status === 'completed' && '✅'}
                        {(session.status === 'cancelled' || session.status === 'error') && '❌'}
                        {session.status === 'active' && '⚡'}
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
                        {formatDuration(duration * 1000)}
                      </div>
                      
                      <div>
                        <span className="font-medium">Năng lượng:</span>
                        <br />
                        {formatEnergy((session.energyConsumed || 0) / 1000)}
                      </div>
                      
                      <div>
                        <span className="font-medium">Thành tiền:</span>
                        <br />
                        <span className="font-semibold text-gray-900">
                          {formatCurrency(session.estimatedCost || 0)}
                        </span>
                      </div>
                    </div>

                    {session.stationInfo?.address && (
                      <div className="mt-2 text-sm text-gray-500">
                        📍 {session.stationInfo.address}
                      </div>
                    )}
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
                // Tạo CSV export từ charging sessions
                const csvData = filteredTransactions.map(session => ({
                  'Session ID': session.id,
                  'Trạm sạc': session.stationName || session.stationId,
                  'Connector': session.connectorId,
                  'Bắt đầu': new Date(session.startTime).toLocaleString('vi-VN'),
                  'Kết thúc': session.stopTime ? new Date(session.stopTime).toLocaleString('vi-VN') : 'N/A',
                  'Năng lượng (kWh)': ((session.energyConsumed || 0) / 1000).toFixed(2),
                  'Thành tiền (VND)': session.estimatedCost || 0,
                  'Trạng thái': session.status
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
