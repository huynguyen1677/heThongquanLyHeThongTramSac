import React, { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useCharging } from '../contexts/ChargingContext'
import { format } from 'date-fns'
import { vi } from 'date-fns/locale'

function History() {
  const { user } = useAuth()
  const { chargingHistory, loading } = useCharging()
  
  const [statusFilter, setStatusFilter] = useState('all')
  const [dateFilter, setDateFilter] = useState('all')
  const [stationFilter, setStationFilter] = useState('all')

  // Lọc sessions
  const filteredSessions = useMemo(() => {
    if (!chargingHistory) return []
    
    return chargingHistory.filter(session => {
      const matchesStatus = statusFilter === 'all' || session.status === statusFilter
      
      const matchesDate = dateFilter === 'all' || (() => {
        const sessionDate = new Date(session.startTime)
        const now = new Date()
        const daysDiff = Math.floor((now - sessionDate) / (1000 * 60 * 60 * 24))
        
        switch (dateFilter) {
          case '7d': return daysDiff <= 7
          case '30d': return daysDiff <= 30
          case '90d': return daysDiff <= 90
          default: return true
        }
      })()
      
      const matchesStation = stationFilter === 'all' || session.stationId === stationFilter
      
      return matchesStatus && matchesDate && matchesStation
    })
  }, [chargingHistory, statusFilter, dateFilter, stationFilter])

  // Thống kê
  const stats = useMemo(() => {
    const totalSessions = filteredSessions.length
    const completedSessions = filteredSessions.filter(s => s.status === 'Completed')
    const totalEnergy = completedSessions.reduce((sum, s) => sum + (s.energyConsumed || 0), 0)
    const totalCost = completedSessions.reduce((sum, s) => sum + (s.estimatedCost || s.cost || 0), 0)
    const totalDuration = completedSessions.reduce((sum, s) => sum + (s.duration || 0), 0)
    
    return {
      totalSessions,
      completedSessions: completedSessions.length,
      totalEnergy: totalEnergy.toFixed(2),
      totalCost: Math.round(totalCost),
      avgDuration: completedSessions.length > 0 ? Math.round(totalDuration / completedSessions.length) : 0
    }
  }, [filteredSessions])

  // Danh sách stations duy nhất
  const uniqueStations = useMemo(() => {
    const stations = new Set()
    chargingHistory?.forEach(session => {
      if (session.stationId && session.stationName) {
        stations.add(JSON.stringify({ id: session.stationId, name: session.stationName }))
      }
    })
    return Array.from(stations).map(s => JSON.parse(s))
  }, [chargingHistory])

  if (!user) {
    return (
      <div className="container py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Lịch sử sạc</h1>
          <p className="text-gray-600 mb-6">Vui lòng đăng nhập để xem lịch sử sạc</p>
          <Link to="/login" className="btn btn-primary">
            Đăng nhập
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="container py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Lịch sử sạc</h1>
        <p className="text-gray-600">
          Xem lại các phiên sạc của bạn
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        <div className="card text-center">
          <div className="card-body">
            <div className="text-2xl font-bold text-primary-600 mb-1">
              {stats.totalSessions}
            </div>
            <p className="text-gray-600 text-sm">Tổng phiên</p>
          </div>
        </div>
        
        <div className="card text-center">
          <div className="card-body">
            <div className="text-2xl font-bold text-success-600 mb-1">
              {stats.completedSessions}
            </div>
            <p className="text-gray-600 text-sm">Hoàn thành</p>
          </div>
        </div>
        
        <div className="card text-center">
          <div className="card-body">
            <div className="text-2xl font-bold text-warning-600 mb-1">
              {stats.totalEnergy}
            </div>
            <p className="text-gray-600 text-sm">kWh</p>
          </div>
        </div>
        
        <div className="card text-center">
          <div className="card-body">
            <div className="text-2xl font-bold text-danger-600 mb-1">
              {stats.totalCost.toLocaleString()}
            </div>
            <p className="text-gray-600 text-sm">VNĐ</p>
          </div>
        </div>
        
        <div className="card text-center">
          <div className="card-body">
            <div className="text-2xl font-bold text-gray-600 mb-1">
              {stats.avgDuration}
            </div>
            <p className="text-gray-600 text-sm">phút TB</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card mb-6">
        <div className="card-body">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="form-label">Trạng thái</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="form-input"
              >
                <option value="all">Tất cả</option>
                <option value="Charging">Đang sạc</option>
                <option value="Completed">Hoàn thành</option>
                <option value="Cancelled">Đã hủy</option>
                <option value="Failed">Thất bại</option>
              </select>
            </div>

            <div>
              <label className="form-label">Thời gian</label>
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="form-input"
              >
                <option value="all">Tất cả</option>
                <option value="7d">7 ngày qua</option>
                <option value="30d">30 ngày qua</option>
                <option value="90d">90 ngày qua</option>
              </select>
            </div>

            <div>
              <label className="form-label">Trạm sạc</label>
              <select
                value={stationFilter}
                onChange={(e) => setStationFilter(e.target.value)}
                className="form-input"
              >
                <option value="all">Tất cả trạm</option>
                {uniqueStations.map(station => (
                  <option key={station.id} value={station.id}>
                    {station.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={() => {
                  setStatusFilter('all')
                  setDateFilter('all')
                  setStationFilter('all')
                }}
                className="btn btn-outline w-full"
              >
                Xóa bộ lọc
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="mb-4">
        <p className="text-gray-600">
          Hiển thị <span className="font-semibold">{filteredSessions.length}</span> phiên sạc
        </p>
      </div>

      {/* Sessions List */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="card">
              <div className="card-body">
                <div className="animate-pulse">
                  <div className="bg-gray-200 h-6 rounded mb-2"></div>
                  <div className="bg-gray-200 h-4 rounded mb-2 w-3/4"></div>
                  <div className="bg-gray-200 h-4 rounded w-1/2"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : filteredSessions.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-400">
              <path d="M12 2L13.09 8.26L22 9L13.09 9.74L12 16L10.91 9.74L2 9L10.91 8.26L12 2Z"/>
              <circle cx="12" cy="12" r="3"/>
            </svg>
          </div>
          <h3 className="text-lg font-semibold mb-2">Chưa có phiên sạc nào</h3>
          <p className="text-gray-600 mb-4">
            Bạn chưa có phiên sạc nào hoặc không có phiên nào khớp với bộ lọc
          </p>
          <div className="flex gap-4 justify-center">
            <button 
              onClick={() => {
                setStatusFilter('all')
                setDateFilter('all') 
                setStationFilter('all')
              }}
              className="btn btn-outline"
            >
              Xóa bộ lọc
            </button>
            <Link to="/stations" className="btn btn-primary">
              Tìm trạm sạc
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredSessions.map(session => (
            <SessionCard key={session.id} session={session} />
          ))}
        </div>
      )}
    </div>
  )
}

// Session Card Component
const SessionCard = ({ session }) => {
  const getStatusBadge = (status) => {
    switch (status) {
      case 'Charging':
        return 'badge-warning'
      case 'Completed':
        return 'badge-success'
      case 'Cancelled':
        return 'badge-primary'
      case 'Failed':
        return 'badge-danger'
      default:
        return 'badge-primary'
    }
  }

  const getStatusText = (status) => {
    switch (status) {
      case 'Charging':
        return 'Đang sạc'
      case 'Completed':
        return 'Hoàn thành'
      case 'Cancelled':
        return 'Đã hủy'
      case 'Failed':
        return 'Thất bại'
      default:
        return status
    }
  }

  const formatDuration = (minutes) => {
    if (!minutes) return '0 phút'
    
    const hours = Math.floor(minutes / 60)
    const mins = Math.round(minutes % 60)
    
    if (hours > 0) {
      return `${hours}h ${mins > 0 ? mins + 'm' : ''}`
    }
    return `${mins}m`
  }

  return (
    <div className="card">
      <div className="card-body">
        <div className="flex flex-col md:flex-row md:items-center justify-between">
          <div className="flex-1 mb-4 md:mb-0">
            <div className="flex items-start justify-between mb-2">
              <div>
                <h3 className="font-semibold text-lg mb-1">
                  {session.stationName || `Trạm ${session.stationId}`}
                </h3>
                <p className="text-gray-600 text-sm mb-2">
                  {session.stationAddress || 'Địa chỉ không xác định'}
                </p>
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <span>Cổng {session.connectorId}</span>
                  <span>•</span>
                  <span>{session.connectorType} - {session.power}kW</span>
                  {session.duration > 0 && (
                    <>
                      <span>•</span>
                      <span>{formatDuration(session.duration)}</span>
                    </>
                  )}
                </div>
              </div>
              
              <span className={`badge ${getStatusBadge(session.status)}`}>
                {getStatusText(session.status)}
              </span>
            </div>

            <div className="text-sm text-gray-600">
              <p>
                Bắt đầu: {format(new Date(session.startTime), 'HH:mm - dd/MM/yyyy', { locale: vi })}
              </p>
              {session.endTime && (
                <p>
                  Kết thúc: {format(new Date(session.endTime), 'HH:mm - dd/MM/yyyy', { locale: vi })}
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <div className="text-center md:text-right">
              <p className="text-sm text-gray-600">Năng lượng</p>
              <p className="font-semibold text-lg">
                {(session.energyConsumed || 0).toFixed(2)}kWh
              </p>
            </div>
            
            <div className="text-center md:text-right">
              <p className="text-sm text-gray-600">Chi phí</p>
              <p className="font-semibold text-lg text-primary-600">
                {(session.estimatedCost || session.cost || 0).toLocaleString()}đ
              </p>
            </div>

            {session.status === 'Charging' && (
              <Link
                to={`/charging/${session.stationId}/${session.connectorId}`}
                className="btn btn-primary btn-sm"
              >
                Xem chi tiết
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default History
