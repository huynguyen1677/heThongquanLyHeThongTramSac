import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { signOut, updatePassword, updateProfile } from 'firebase/auth'
import { auth } from '../services/firebase'

export default function Profile({ user }) {
  const navigate = useNavigate()
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [profileForm, setProfileForm] = useState({
    displayName: user?.displayName || ''
  })
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false)
  const [message, setMessage] = useState('')

  const handleSignOut = async () => {
    if (window.confirm('Bạn có chắc chắn muốn đăng xuất?')) {
      try {
        await signOut(auth)
        navigate('/login')
      } catch (error) {
        console.error('Sign out error:', error)
        alert('Không thể đăng xuất. Vui lòng thử lại.')
      }
    }
  }

  const handleUpdateProfile = async (e) => {
    e.preventDefault()
    setIsUpdatingProfile(true)
    setMessage('')

    try {
      await updateProfile(user, {
        displayName: profileForm.displayName
      })
      setMessage('Cập nhật thông tin thành công!')
    } catch (error) {
      console.error('Update profile error:', error)
      setMessage('Không thể cập nhật thông tin. Vui lòng thử lại.')
    } finally {
      setIsUpdatingProfile(false)
    }
  }

  const handleChangePassword = async (e) => {
    e.preventDefault()
    setMessage('')

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setMessage('Mật khẩu xác nhận không khớp')
      return
    }

    if (passwordForm.newPassword.length < 6) {
      setMessage('Mật khẩu mới phải có ít nhất 6 ký tự')
      return
    }

    try {
      await updatePassword(user, passwordForm.newPassword)
      setMessage('Đổi mật khẩu thành công!')
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      })
      setIsChangingPassword(false)
    } catch (error) {
      console.error('Change password error:', error)
      if (error.code === 'auth/requires-recent-login') {
        setMessage('Vui lòng đăng nhập lại để đổi mật khẩu')
      } else {
        setMessage('Không thể đổi mật khẩu. Vui lòng thử lại.')
      }
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="card text-center">
        <div className="text-4xl mb-3">👤</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Thông tin cá nhân
        </h1>
        <p className="text-gray-600">
          Quản lý tài khoản và cài đặt của bạn
        </p>
      </div>

      {/* Message */}
      {message && (
        <div className={`card ${
          message.includes('thành công') 
            ? 'bg-green-50 border-green-200' 
            : 'bg-red-50 border-red-200'
        }`}>
          <p className={`text-center ${
            message.includes('thành công') ? 'text-green-800' : 'text-red-800'
          }`}>
            {message}
          </p>
        </div>
      )}

      {/* Current User Info */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Thông tin tài khoản
        </h2>
        
        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="font-medium text-gray-700">Email:</span>
            <span className="text-gray-600">{user?.email}</span>
          </div>
          
          <div className="flex justify-between">
            <span className="font-medium text-gray-700">Tên hiển thị:</span>
            <span className="text-gray-600">
              {user?.displayName || 'Chưa đặt'}
            </span>
          </div>
          
          <div className="flex justify-between">
            <span className="font-medium text-gray-700">Tài khoản được tạo:</span>
            <span className="text-gray-600">
              {user?.metadata?.creationTime
                ? new Date(user.metadata.creationTime).toLocaleDateString('vi-VN')
                : 'Không xác định'
              }
            </span>
          </div>
          
          <div className="flex justify-between">
            <span className="font-medium text-gray-700">Đăng nhập cuối:</span>
            <span className="text-gray-600">
              {user?.metadata?.lastSignInTime
                ? new Date(user.metadata.lastSignInTime).toLocaleDateString('vi-VN')
                : 'Không xác định'
              }
            </span>
          </div>
        </div>
      </div>

      {/* Update Profile */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Cập nhật thông tin
        </h2>
        
        <form onSubmit={handleUpdateProfile} className="space-y-4">
          <div>
            <label htmlFor="displayName" className="block text-sm font-medium text-gray-700 mb-1">
              Tên hiển thị
            </label>
            <input
              type="text"
              id="displayName"
              value={profileForm.displayName}
              onChange={(e) => setProfileForm(prev => ({
                ...prev,
                displayName: e.target.value
              }))}
              placeholder="Nhập tên hiển thị"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isUpdatingProfile}
            />
          </div>
          
          <button
            type="submit"
            disabled={isUpdatingProfile}
            className="btn-primary"
          >
            {isUpdatingProfile ? 'Đang cập nhật...' : 'Cập nhật thông tin'}
          </button>
        </form>
      </div>

      {/* Change Password */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Đổi mật khẩu
        </h2>
        
        {!isChangingPassword ? (
          <button
            onClick={() => setIsChangingPassword(true)}
            className="btn-outline"
          >
            🔒 Đổi mật khẩu
          </button>
        ) : (
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1">
                Mật khẩu mới
              </label>
              <input
                type="password"
                id="newPassword"
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm(prev => ({
                  ...prev,
                  newPassword: e.target.value
                }))}
                placeholder="Nhập mật khẩu mới"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
                minLength="6"
              />
            </div>
            
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                Xác nhận mật khẩu mới
              </label>
              <input
                type="password"
                id="confirmPassword"
                value={passwordForm.confirmPassword}
                onChange={(e) => setPasswordForm(prev => ({
                  ...prev,
                  confirmPassword: e.target.value
                }))}
                placeholder="Nhập lại mật khẩu mới"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
                minLength="6"
              />
            </div>
            
            <div className="flex gap-3">
              <button type="submit" className="btn-primary">
                Đổi mật khẩu
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsChangingPassword(false)
                  setPasswordForm({
                    currentPassword: '',
                    newPassword: '',
                    confirmPassword: ''
                  })
                }}
                className="btn-outline"
              >
                Hủy
              </button>
            </div>
          </form>
        )}
      </div>

      {/* App Settings */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Cài đặt ứng dụng
        </h2>
        
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-gray-700">Thông báo push</span>
            <button className="text-gray-400 text-sm">
              Sắp có
            </button>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-gray-700">Chế độ tối</span>
            <button className="text-gray-400 text-sm">
              Sắp có
            </button>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-gray-700">Ngôn ngữ</span>
            <span className="text-gray-600 text-sm">Tiếng Việt</span>
          </div>
        </div>
      </div>

      {/* App Info */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Thông tin ứng dụng
        </h2>
        
        <div className="space-y-2 text-sm text-gray-600">
          <div className="flex justify-between">
            <span>Phiên bản:</span>
            <span>1.0.0</span>
          </div>
          
          <div className="flex justify-between">
            <span>Cập nhật cuối:</span>
            <span>{new Date().toLocaleDateString('vi-VN')}</span>
          </div>
        </div>
        
        <div className="mt-4 pt-4 border-t text-center">
          <p className="text-sm text-gray-500 mb-2">
            Cần hỗ trợ? Liên hệ:
          </p>
          <a 
            href="mailto:support@evcharging.vn" 
            className="text-blue-600 hover:text-blue-500 text-sm"
          >
            support@evcharging.vn
          </a>
        </div>
      </div>

      {/* Sign Out */}
      <div className="card">
        <button
          onClick={handleSignOut}
          className="btn-danger w-full"
        >
          🚪 Đăng xuất
        </button>
      </div>
    </div>
  )
}
