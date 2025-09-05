import React, { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useCharging } from '../contexts/ChargingContext'
import { format } from 'date-fns'
import { vi } from 'date-fns/locale'
import { countTotalSessions, filterCompletedSessions } from '../utils/chargingStats';
import '../styles/history-page.css'

function History() {
  const { user } = useAuth()
  const { chargingHistory, loading, reloadHistory } = useCharging()
  
  const [statusFilter, setStatusFilter] = useState('all')
  const [dateFilter, setDateFilter] = useState('all')
  const [stationFilter, setStationFilter] = useState('all')
  const [viewMode, setViewMode] = useState('grid') // grid hoặc list

  // Lọc sessions
  const filteredSessions = useMemo(() => {
    if (!Array.isArray(chargingHistory)) return [];
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
    if (!Array.isArray(filteredSessions)) return {
      totalSessions: 0,
      completedSessions: 0,
      totalEnergy: 0,
      totalCost: 0,
      avgDuration: 0
    };
    
    const totalSessions = countTotalSessions(filteredSessions);
    const completedSessionsArr = filterCompletedSessions(filteredSessions);

    const totalEnergyWh = completedSessionsArr.reduce((sum, s) => {
      const energyWh = typeof s.energyConsumed === "number" 
        ? s.energyConsumed 
        : parseFloat(s.energyConsumed || 0);
      return sum + (isNaN(energyWh) ? 0 : energyWh);
    }, 0);
    const totalEnergykWh = totalEnergyWh / 1000;
    
    const totalCost = completedSessionsArr.reduce((sum, s) => sum + (s.estimatedCost || s.cost || 0), 0);
    const totalDuration = completedSessionsArr.reduce((sum, s) => sum + (s.duration || 0), 0);
    
    return {
      totalSessions,
      completedSessions: completedSessionsArr.length,
      totalEnergy: totalEnergykWh.toFixed(2),
      totalCost: Math.round(totalCost),
      avgDuration: completedSessionsArr.length > 0 ? Math.round(totalDuration / completedSessionsArr.length) : 0
    };
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

  const resetFilters = () => {
    setStatusFilter('all')
    setDateFilter('all')
    setStationFilter('all')
  }

  if (!user) {
    return (
      <div className="history-container">
        <div className="auth-required">
          <div className="auth-icon">
            <i className="fas fa-user-lock"></i>
          </div>
          <h1 className="auth-title">Lịch sử sạc</h1>
          <p className="auth-message">Vui lòng đăng nhập để xem lịch sử sạc của bạn</p>
          <Link to="/login" className="btn btn-primary btn-lg">
            <i className="fas fa-sign-in-alt"></i>
            Đăng nhập
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="history-container">
      {/* Header */}
      <div className="history-header">
        <div className="header-content">
          <div className="header-left">
            <h1 className="page-title">Lịch sử sạc</h1>
            <p className="page-subtitle">Xem lại các phiên sạc của bạn</p>
          </div>
          <div className="header-actions">
            <button
              onClick={reloadHistory}
              className="btn btn-outline"
              disabled={loading}
            >
              <i className={`fas ${loading ? 'fa-spinner fa-spin' : 'fa-sync-alt'}`}></i>
              {loading ? "Đang làm mới..." : "Làm mới"}
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card stat-primary">
          <div className="stat-content">
            <div className="stat-info">
              <p className="stat-label">Tổng phiên</p>
              <p className="stat-value">{stats.totalSessions}</p>
            </div>
            <div className="stat-icon icon-bg-primary">
              <i className="fas fa-charging-station"></i>
            </div>
          </div>
        </div>
        
        <div className="stat-card stat-success">
          <div className="stat-content">
            <div className="stat-info">
              <p className="stat-label">Hoàn thành</p>
              <p className="stat-value">{stats.completedSessions}</p>
            </div>
            <div className="stat-icon icon-bg-success">
              <i className="fas fa-check-circle"></i>
            </div>
          </div>
        </div>
        
        <div className="stat-card stat-warning">
          <div className="stat-content">
            <div className="stat-info">
              <p className="stat-label">Năng lượng</p>
              <p className="stat-value">{stats.totalEnergy} kWh</p>
            </div>
            <div className="stat-icon icon-bg-warning">
              <i className="fas fa-bolt"></i>
            </div>
          </div>
        </div>
        
        <div className="stat-card stat-info">
          <div className="stat-content">
            <div className="stat-info">
              <p className="stat-label">Chi phí</p>
              <p className="stat-value">{stats.totalCost.toLocaleString()}₫</p>
            </div>
            <div className="stat-icon icon-bg-info">
              <i className="fas fa-wallet"></i>
            </div>
          </div>
        </div>
        
        <div className="stat-card stat-secondary">
          <div className="stat-content">
            <div className="stat-info">
              <p className="stat-label">Thời gian TB</p>
              <p className="stat-value">{stats.avgDuration} phút</p>
            </div>
            <div className="stat-icon icon-bg-secondary">
              <i className="fas fa-clock"></i>
            </div>
          </div>
        </div>
      </div>

      {/* Filters & Controls */}
      <div className="filters-section">
        <div className="filters-header">
          <h3 className="filters-title">Bộ lọc & Sắp xếp</h3>
          <div className="view-controls">
            <button
              className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
              onClick={() => setViewMode('grid')}
              title="Xem dạng lưới"
            >
              <i className="fas fa-th"></i>
            </button>
            <button
              className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
              onClick={() => setViewMode('list')}
              title="Xem dạng danh sách"
            >
              <i className="fas fa-list"></i>
            </button>
          </div>
        </div>
        
        <div className="filters-content">
          <div className="filters-grid">
            <div className="filter-group">
              <label className="filter-label">
                <i className="fas fa-info-circle"></i>
                Trạng thái
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="filter-select"
              >
                <option value="all">Tất cả trạng thái</option>
                <option value="Charging">Đang sạc</option>
                <option value="Completed">Hoàn thành</option>
                <option value="Cancelled">Đã hủy</option>
                <option value="Failed">Thất bại</option>
              </select>
            </div>

            <div className="filter-group">
              <label className="filter-label">
                <i className="fas fa-calendar-alt"></i>
                Thời gian
              </label>
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="filter-select"
              >
                <option value="all">Tất cả thời gian</option>
                <option value="7d">7 ngày qua</option>
                <option value="30d">30 ngày qua</option>
                <option value="90d">90 ngày qua</option>
              </select>
            </div>

            <div className="filter-group">
              <label className="filter-label">
                <i className="fas fa-map-marker-alt"></i>
                Trạm sạc
              </label>
              <select
                value={stationFilter}
                onChange={(e) => setStationFilter(e.target.value)}
                className="filter-select"
              >
                <option value="all">Tất cả trạm</option>
                {uniqueStations.map(station => (
                  <option key={station.id} value={station.id}>
                    {station.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="filter-group">
              <button
                onClick={resetFilters}
                className="btn btn-outline btn-reset"
              >
                <i className="fas fa-times"></i>
                Xóa bộ lọc
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Results Info */}
      <div className="results-info">
        <p className="results-text">
          Hiển thị <span className="results-count">{filteredSessions.length}</span> phiên sạc
          {(statusFilter !== 'all' || dateFilter !== 'all' || stationFilter !== 'all') && (
            <button onClick={resetFilters} className="reset-link">
              <i className="fas fa-times"></i> Xóa bộ lọc
            </button>
          )}
        </p>
      </div>

      {/* Sessions List */}
      {loading ? (
        <div className="loading-section">
          <div className="loading-spinner-large">
            <i className="fas fa-spinner fa-spin"></i>
          </div>
          <p className="loading-text">Đang tải dữ liệu...</p>
        </div>
      ) : filteredSessions.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">
            <i className="fas fa-history"></i>
          </div>
          <h3 className="empty-title">Chưa có phiên sạc nào</h3>
          <p className="empty-message">
            Bạn chưa có phiên sạc nào hoặc không có phiên nào khớp với bộ lọc hiện tại.
          </p>
          <div className="empty-actions">
            <button onClick={resetFilters} className="btn btn-outline">
              <i className="fas fa-filter"></i>
              Xóa bộ lọc
            </button>
            <Link to="/stations" className="btn btn-primary">
              <i className="fas fa-search"></i>
              Tìm trạm sạc
            </Link>
          </div>
        </div>
      ) : (
        <div className={`sessions-container ${viewMode}`}>
          {filteredSessions.map(session => (
            <SessionCard key={session.id} session={session} viewMode={viewMode} />
          ))}
        </div>
      )}
    </div>
  )
}

// Enhanced Session Card Component
const SessionCard = ({ session, viewMode }) => {
  const getStatusConfig = (status) => {
    switch (status) {
      case 'Charging':
        return { 
          class: 'status-charging', 
          icon: 'fa-bolt',
          text: 'Đang sạc',
          color: 'warning'
        }
      case 'Completed':
        return { 
          class: 'status-completed', 
          icon: 'fa-check-circle',
          text: 'Hoàn thành',
          color: 'success'
        }
      case 'Cancelled':
        return { 
          class: 'status-cancelled', 
          icon: 'fa-times-circle',
          text: 'Đã hủy',
          color: 'secondary'
        }
      case 'Failed':
        return { 
          class: 'status-failed', 
          icon: 'fa-exclamation-triangle',
          text: 'Thất bại',
          color: 'error'
        }
      default:
        return { 
          class: 'status-unknown', 
          icon: 'fa-question-circle',
          text: status,
          color: 'secondary'
        }
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

  const statusConfig = getStatusConfig(session.status)

  return (
    <div className={`session-card ${viewMode} ${statusConfig.class}`}>
      <div className="session-card-header">
        <div className="session-status">
          <div className={`status-indicator status-${statusConfig.color}`}>
            <i className={`fas ${statusConfig.icon}`}></i>
          </div>
          <span className={`status-text status-${statusConfig.color}`}>
            {statusConfig.text}
          </span>
        </div>
        <div className="session-actions">
          {session.status === 'Charging' && (
            <Link
              to={`/charging/${session.stationId}/${session.connectorId}`}
              className="btn btn-primary btn-sm"
              title="Xem chi tiết phiên sạc"
            >
              <i className="fas fa-eye"></i>
            </Link>
          )}
          <button className="session-menu-btn" title="Tùy chọn khác">
            <i className="fas fa-ellipsis-v"></i>
          </button>
        </div>
      </div>

      <div className="session-card-content">
        <div className="session-main-info">
          <h3 className="session-station-name">
            <i className="fas fa-charging-station"></i>
            {session.stationName || session.stationId || 'Trạm không xác định'}
          </h3>
          <p className="session-station-address">
            <i className="fas fa-map-marker-alt"></i>
            {session.stationAddress || session.address || 'Địa chỉ không xác định'}
          </p>
        </div>

        <div className="session-details">
          <div className="session-detail-row">
            <div className="detail-item">
              <i className="fas fa-plug"></i>
              <span>Cổng {session.connectorId || 'N/A'}</span>
            </div>
            <div className="detail-item">
              <i className="fas fa-bolt"></i>
              <span>
                {session.connectorType || 'AC'} - {session.power || session.powerKW || 'N/A'}kW
              </span>
            </div>
            {session.duration > 0 && (
              <div className="detail-item">
                <i className="fas fa-clock"></i>
                <span>{formatDuration(session.duration)}</span>
              </div>
            )}
          </div>

          <div className="session-time-info">
            <div className="time-item">
              <span className="time-label">Bắt đầu:</span>
              <span className="time-value">
                {session.startTime ? 
                  format(new Date(session.startTime), 'HH:mm - dd/MM/yyyy', { locale: vi }) :
                  'N/A'
                }
              </span>
            </div>
            {session.endTime && (
              <div className="time-item">
                <span className="time-label">Kết thúc:</span>
                <span className="time-value">
                  {format(new Date(session.endTime), 'HH:mm - dd/MM/yyyy', { locale: vi })}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="session-card-footer">
        <div className="session-metrics">
          <div className="metric-item energy">
            <div className="metric-icon">
              <i className="fas fa-battery-three-quarters"></i>
            </div>
            <div className="metric-info">
              <span className="metric-label">Năng lượng</span>
              <span className="metric-value">
                {/* Chuyển đổi từ Wh sang kWh */}
                {((session.energyConsumed || 0) / 1000).toFixed(2)} kWh
              </span>
            </div>
          </div>
          
          <div className="metric-item cost">
            <div className="metric-icon">
              <i className="fas fa-coins"></i>
            </div>
            <div className="metric-info">
              <span className="metric-label">Chi phí</span>
              <span className="metric-value">
                {(session.estimatedCost || session.cost || session.totalCost || 0).toLocaleString()}₫
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default History
