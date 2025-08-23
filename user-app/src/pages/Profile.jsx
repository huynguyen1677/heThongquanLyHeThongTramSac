import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

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

  if (!user) {
    return (
      <div className="container py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Tài khoản</h1>
          <p className="text-gray-600 mb-6">Vui lòng đăng nhập để xem thông tin tài khoản</p>
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
    <div className="container py-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Tài khoản của tôi</h1>
          <p className="text-gray-600">
            Quản lý thông tin cá nhân và cài đặt tài khoản
          </p>
        </div>

        {/* Profile Card */}
        <div className="card mb-6">
          <div className="card-header">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Thông tin cá nhân</h2>
              {!isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="btn btn-outline btn-sm"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mr-2">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                  </svg>
                  Chỉnh sửa
                </button>
              )}
            </div>
          </div>

          <div className="card-body">
            {/* Messages */}
            {error && (
              <div className="bg-danger-100 text-danger-600 p-4 rounded mb-4">
                {error}
              </div>
            )}

            {success && (
              <div className="bg-success-100 text-success-600 p-4 rounded mb-4">
                {success}
              </div>
            )}

            <form onSubmit={handleSave}>
              <div className="space-y-6">
                {/* Avatar */}
                <div className="flex items-center">
                  <div className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center mr-4">
                    <span className="text-2xl font-bold text-primary-600">
                      {user.name?.charAt(0)?.toUpperCase() || user.email?.charAt(0)?.toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">{user.name || 'Chưa cập nhật'}</h3>
                    <p className="text-gray-600">{user.email}</p>
                  </div>
                </div>

                {/* Form Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="form-label">Họ tên</label>
                    {isEditing ? (
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        className="form-input"
                        placeholder="Nhập họ tên"
                        required
                      />
                    ) : (
                      <p className="form-input bg-gray-50 text-gray-700">
                        {user.name || 'Chưa cập nhật'}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="form-label">Email</label>
                    <p className="form-input bg-gray-50 text-gray-700">
                      {user.email}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Email không thể thay đổi
                    </p>
                  </div>

                  <div className="md:col-span-2">
                    <label className="form-label">Số điện thoại</label>
                    {isEditing ? (
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        className="form-input"
                        placeholder="0901234567"
                      />
                    ) : (
                      <p className="form-input bg-gray-50 text-gray-700">
                        {user.phone || 'Chưa cập nhật'}
                      </p>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                {isEditing && (
                  <div className="flex gap-4 pt-6 border-t">
                    <button
                      type="button"
                      onClick={handleCancel}
                      className="btn btn-outline flex-1"
                      disabled={loading}
                    >
                      Hủy
                    </button>
                    <button
                      type="submit"
                      className="btn btn-primary flex-1"
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <div className="spinner mr-2"></div>
                          Đang lưu...
                        </>
                      ) : (
                        'Lưu thay đổi'
                      )}
                    </button>
                  </div>
                )}
              </div>
            </form>
          </div>
        </div>

        {/* Account Info */}
        <div className="card mb-6">
          <div className="card-header">
            <h2 className="text-xl font-semibold">Thông tin tài khoản</h2>
          </div>
          
          <div className="card-body">
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-gray-600">ID tài khoản:</span>
                <span className="font-mono text-sm">{user.id}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-600">Ngày tạo:</span>
                <span>
                  {user.createdAt ? 
                    new Date(user.createdAt).toLocaleDateString('vi-VN') : 
                    'Không xác định'
                  }
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-600">Cập nhật cuối:</span>
                <span>
                  {user.updatedAt ? 
                    new Date(user.updatedAt).toLocaleDateString('vi-VN') : 
                    'Không xác định'
                  }
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <button
            onClick={() => navigate('/history')}
            className="btn btn-outline flex items-center justify-center"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mr-2">
              <circle cx="12" cy="12" r="10"/>
              <polyline points="12,6 12,12 16,14"/>
            </svg>
            Lịch sử sạc
          </button>
          
          <button
            onClick={() => navigate('/stations')}
            className="btn btn-outline flex items-center justify-center"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mr-2">
              <path d="M12 2L13.09 8.26L22 9L13.09 9.74L12 16L10.91 9.74L2 9L10.91 8.26L12 2Z"/>
              <circle cx="12" cy="12" r="3"/>
            </svg>
            Tìm trạm sạc
          </button>

          <button
            onClick={() => navigate('/')}
            className="btn btn-outline flex items-center justify-center"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mr-2">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
              <polyline points="9,22 9,12 15,12 15,22"/>
            </svg>
            Trang chủ
          </button>
        </div>

        {/* Danger Zone */}
        <div className="card border-danger-200">
          <div className="card-header bg-danger-50 border-b border-danger-200">
            <h2 className="text-xl font-semibold text-danger-700">Vùng nguy hiểm</h2>
          </div>
          
          <div className="card-body">
            <p className="text-gray-600 mb-4">
              Đăng xuất khỏi tài khoản hiện tại. Bạn sẽ cần đăng nhập lại để sử dụng dịch vụ.
            </p>
            
            <button
              onClick={handleLogout}
              className="btn btn-danger"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mr-2">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                <polyline points="16,17 21,12 16,7"/>
                <line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
              Đăng xuất
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Profile
