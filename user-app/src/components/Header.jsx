import React, { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import '../styles/header-clean.css'

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const { user, logout } = useAuth()
  const location = useLocation()

  const isActive = (path) => location.pathname === path

  const handleLogout = () => {
    logout()
    setIsMenuOpen(false)
  }

  return (
    <header className="header">
      <div className="header-content">
        <div className="header-left">
          <h2>Dashboard</h2>
          <p>
            {user ? `Chào mừng trở lại, ${user.email?.split('@')[0]}` : 'Chào mừng đến với EV Station'}
          </p>
        </div>
        
        <div className="header-right">
          {/* Connection Status */}
          <div className="connection-status">
            <div className="status-dot"></div>
            <span>Đang kết nối</span>
          </div>
          
          {/* Notifications */}
          <button className="notification-btn">
            <i className="fas fa-bell"></i>
            <span className="notification-badge">3</span>
          </button>
          
          {/* User Avatar */}
          {user ? (
            <div className="user-section">
              <div className="user-avatar">
                <span>{user.email?.charAt(0).toUpperCase()}</span>
              </div>
              <button 
                onClick={handleLogout}
                className="logout-btn"
                title="Đăng xuất"
              >
                <i className="fas fa-sign-out-alt"></i>
              </button>
            </div>
          ) : (
            <Link to="/login" className="login-link">
              <i className="fas fa-sign-in-alt"></i>
            </Link>
          )}
        </div>
      </div>
    </header>
  )
}

export default Header
