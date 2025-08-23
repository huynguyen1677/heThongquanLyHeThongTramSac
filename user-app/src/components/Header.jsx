import React, { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

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
        <Link to="/" className="logo">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor" className="mr-2">
            <path d="M12 2L13.09 8.26L22 9L13.09 9.74L12 16L10.91 9.74L2 9L10.91 8.26L12 2Z"/>
            <circle cx="12" cy="12" r="3" fill="white"/>
          </svg>
          EV Charging
        </Link>

        {/* Desktop Navigation */}
        <nav className="nav">
          <Link 
            to="/" 
            className={`nav-link ${isActive('/') ? 'active' : ''}`}
          >
            Trang chủ
          </Link>
          <Link 
            to="/stations" 
            className={`nav-link ${isActive('/stations') ? 'active' : ''}`}
          >
            Trạm sạc
          </Link>
          {user && (
            <Link 
              to="/history" 
              className={`nav-link ${isActive('/history') ? 'active' : ''}`}
            >
              Lịch sử
            </Link>
          )}
          {user ? (
            <div className="flex items-center gap-4">
              <Link 
                to="/profile" 
                className={`nav-link ${isActive('/profile') ? 'active' : ''}`}
              >
                {user.email}
              </Link>
              <button onClick={handleLogout} className="btn btn-outline btn-sm">
                Đăng xuất
              </button>
            </div>
          ) : (
            <Link to="/login" className="btn btn-primary btn-sm">
              Đăng nhập
            </Link>
          )}
        </nav>

        {/* Mobile Menu Button */}
        <button 
          className="mobile-menu-btn"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <line x1="3" y1="12" x2="21" y2="12"></line>
            <line x1="3" y1="18" x2="21" y2="18"></line>
          </svg>
        </button>
      </div>

      {/* Mobile Navigation */}
      {isMenuOpen && (
        <div className="mobile-nav">
          <div className="flex justify-between items-center mb-6">
            <Link to="/" className="logo" onClick={() => setIsMenuOpen(false)}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor" className="mr-2">
                <path d="M12 2L13.09 8.26L22 9L13.09 9.74L12 16L10.91 9.74L2 9L10.91 8.26L12 2Z"/>
                <circle cx="12" cy="12" r="3" fill="white"/>
              </svg>
              EV Charging
            </Link>
            <button 
              onClick={() => setIsMenuOpen(false)}
              className="p-2"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
          
          <nav className="flex flex-col gap-4">
            <Link 
              to="/" 
              className={`nav-link ${isActive('/') ? 'active' : ''}`}
              onClick={() => setIsMenuOpen(false)}
            >
              Trang chủ
            </Link>
            <Link 
              to="/stations" 
              className={`nav-link ${isActive('/stations') ? 'active' : ''}`}
              onClick={() => setIsMenuOpen(false)}
            >
              Trạm sạc
            </Link>
            {user && (
              <Link 
                to="/history" 
                className={`nav-link ${isActive('/history') ? 'active' : ''}`}
                onClick={() => setIsMenuOpen(false)}
              >
                Lịch sử
              </Link>
            )}
            {user ? (
              <div className="flex flex-col gap-4 mt-4">
                <Link 
                  to="/profile" 
                  className={`nav-link ${isActive('/profile') ? 'active' : ''}`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  Tài khoản: {user.email}
                </Link>
                <button onClick={handleLogout} className="btn btn-outline">
                  Đăng xuất
                </button>
              </div>
            ) : (
              <Link 
                to="/login" 
                className="btn btn-primary mt-4"
                onClick={() => setIsMenuOpen(false)}
              >
                Đăng nhập
              </Link>
            )}
          </nav>
        </div>
      )}
    </header>
  )
}

export default Header
