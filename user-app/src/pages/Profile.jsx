import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import '../styles/profile.css'

const Profile = () => {
  const { user, updateProfile, logout } = useAuth()
  const navigate = useNavigate()
  
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || ''
  })

  const handleInputChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
    setError('')
    setSuccess('')
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const result = await updateProfile(formData)
      if (result.success) {
        setSuccess('Cập nhật thông tin thành công!')
        setIsEditing(false)
      } else {
        setError(result.error || 'Có lỗi xảy ra')
      }
    } catch (error) {
      setError(error.message || 'Có lỗi xảy ra')
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    setFormData({
      name: user?.name || '',
      email: user?.email || '',
      phone: user?.phone || ''
    })
    setIsEditing(false)
    setError('')
    setSuccess('')
  }

  const handleLogout = async () => {
    try {
      await logout()
      navigate('/')
    } catch (error) {
      setError('Có lỗi khi đăng xuất')
    }
  }

  const getUserInitial = () => {
    return user?.name?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || 'U'
  }

  if (!user) {
    return (
      <div className="profile-container">
        <div className="profile-card" style={{ textAlign: 'center' }}>
          <h1>Tài khoản</h1>
          <p>Vui lòng đăng nhập để xem thông tin tài khoản</p>
          <button
            onClick={() => navigate('/login')}
            className="btn btn-primary"
          >
            Đăng nhập
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="profile-container">
      {/* Profile Header */}
      <div className="profile-header">
        <div className="profile-avatar">
          {getUserInitial()}
        </div>
        <div className="profile-info">
          <h1>{user?.name || 'Người dùng'}</h1>
          <p>{user?.email}</p>
        </div>
      </div>

      <div className="profile-content">
        {/* Personal Information Card */}
        <div className="profile-card">
          <h3>
            <svg className="profile-card-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            Thông tin cá nhân
          </h3>

          {/* Messages */}
          {error && (
            <div className="alert alert-error" style={{ 
              background: '#fee', 
              color: '#c33', 
              padding: '1rem', 
              borderRadius: '8px', 
              marginBottom: '1rem',
              border: '1px solid #fcc'
            }}>
              {error}
            </div>
          )}

          {success && (
            <div className="alert alert-success" style={{ 
              background: '#efe', 
              color: '#363', 
              padding: '1rem', 
              borderRadius: '8px', 
              marginBottom: '1rem',
              border: '1px solid #cfc'
            }}>
              {success}
            </div>
          )}

          <form onSubmit={handleSave}>
            <div className="profile-form-group">
              <label htmlFor="name">Họ và tên</label>
              {isEditing ? (
                <input
                  id="name"
                  name="name"
                  type="text"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                />
              ) : (
                <input
                  id="name"
                  type="text"
                  value={user?.name || 'Chưa cập nhật'}
                  disabled={true}
                />
              )}
            </div>

            <div className="profile-form-group">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                value={user?.email || ''}
                disabled={true}
              />
              <small style={{ color: '#666', fontSize: '0.8rem' }}>Email không thể thay đổi</small>
            </div>

            <div className="profile-form-group">
              <label htmlFor="phone">Số điện thoại</label>
              {isEditing ? (
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="0901234567"
                />
              ) : (
                <input
                  id="phone"
                  type="tel"
                  value={user?.phone || 'Chưa cập nhật'}
                  disabled={true}
                />
              )}
            </div>

            <div className="form-actions">
              {isEditing ? (
                <>
                  <button 
                    type="button"
                    className="btn btn-secondary" 
                    onClick={handleCancel}
                    disabled={loading}
                  >
                    Hủy
                  </button>
                  <button 
                    type="submit"
                    className="btn btn-primary"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <div style={{ display: 'inline-block', width: '16px', height: '16px', border: '2px solid #fff', borderRadius: '50%', borderTopColor: 'transparent', animation: 'spin 1s linear infinite', marginRight: '0.5rem' }}></div>
                        Đang lưu...
                      </>
                    ) : (
                      <>
                        <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Lưu thay đổi
                      </>
                    )}
                  </button>
                </>
              ) : (
                <button 
                  type="button"
                  className="btn btn-primary" 
                  onClick={() => setIsEditing(true)}
                >
                  <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Chỉnh sửa
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Account Information Card */}
        <div className="profile-card">
          <h3>
            <svg className="profile-card-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            Thông tin tài khoản
          </h3>
          <div className="account-info-grid">
            <div className="account-info-item">
              <strong>User ID</strong>
              <span>{user?.userId || 'N/A'}</span>
            </div>
            <div className="account-info-item">
              <strong>Ngày tạo</strong>
              <span>{user?.createdAt ? new Date(user.createdAt).toLocaleDateString('vi-VN') : 'Không xác định'}</span>
            </div>
            <div className="account-info-item">
              <strong>Cập nhật cuối</strong>
              <span>{user?.updatedAt ? new Date(user.updatedAt).toLocaleDateString('vi-VN') : 'Không xác định'}</span>
            </div>
            <div className="account-info-item">
              <strong>Trạng thái</strong>
              <span style={{ color: '#22c55e', fontWeight: 'bold' }}>Đang hoạt động</span>
            </div>
          </div>
        </div>

        {/* Quick Actions Card */}
        <div className="profile-card">
          <h3>
            <svg className="profile-card-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Thao tác nhanh
          </h3>
          <div className="quick-actions">
            <button className="quick-action-btn" onClick={() => navigate('/')}>
              <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              Về trang chủ
            </button>
            <button className="quick-action-btn" onClick={() => navigate('/stations')}>
              <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Trạm sạc
            </button>
            <button className="quick-action-btn" onClick={() => navigate('/wallet')}>
              <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
              Ví tiền
            </button>
            <button className="quick-action-btn" onClick={() => navigate('/history')}>
              <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Lịch sử sạc
            </button>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="profile-card danger-zone">
          <p>Đăng xuất khỏi tài khoản hiện tại. Bạn sẽ cần đăng nhập lại để sử dụng dịch vụ.</p>
          <button className="btn btn-danger" onClick={handleLogout}>
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Đăng xuất
          </button>
        </div>
      </div>
    </div>
  )
}

export default Profile
