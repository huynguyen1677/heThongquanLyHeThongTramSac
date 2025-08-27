import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

const Login = () => {
  const [isLogin, setIsLogin] = useState(true)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    phone: '',
    confirmPassword: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const { login, register } = useAuth()
  const navigate = useNavigate()

  const handleInputChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      if (isLogin) {
        const result = await login(formData.email, formData.password)
        if (result.success) {
          navigate('/')
        } else {
          setError(result.error)
        }
      } else {
        if (formData.password !== formData.confirmPassword) {
          setError('Mật khẩu xác nhận không khớp')
          setLoading(false)
          return
        }
        const result = await register(formData.email, formData.password, formData.name, formData.phone)
        if (result.success) {
          setFormData({
            email: '',
            password: '',
            name: '',
            phone: '',
            confirmPassword: ''
          })
          setError('')
          setIsLogin(true)
        } else {
          setError(result.error)
        }
      }
    } catch (error) {
      setError(error.message || 'Có lỗi xảy ra')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center py-12">
      <div className="container">
        <div className="max-w-md mx-auto">
          <div className="card">
            <div className="card-header text-center">
              <Link to="/" className="logo mb-4 inline-flex">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor" className="mr-2">
                  <path d="M12 2L13.09 8.26L22 9L13.09 9.74L12 16L10.91 9.74L2 9L10.91 8.26L12 2Z"/>
                  <circle cx="12" cy="12" r="3" fill="white"/>
                </svg>
                EV Charging
              </Link>
              
              <h2 className="text-2xl font-bold mb-2">
                {isLogin ? 'Đăng nhập' : 'Đăng ký'}
              </h2>
              <p className="text-gray-600">
                {isLogin 
                  ? 'Đăng nhập để bắt đầu sạc xe điện'
                  : 'Tạo tài khoản mới để sử dụng dịch vụ'
                }
              </p>
            </div>

            <div className="card-body">
              {error && (
                <div className="bg-danger-100 text-danger-600 p-4 rounded mb-4">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit}>
                {!isLogin && (
                  <>
                    <div className="mb-4">
                      <label className="form-label">Họ tên</label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        className="form-input"
                        required={!isLogin}
                        placeholder="Nhập họ tên của bạn"
                      />
                    </div>
                    <div className="mb-4">
                      <label className="form-label">Số điện thoại</label>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        className="form-input"
                        placeholder="0901234567"
                      />
                    </div>
                  </>
                )}

                <div className="mb-4">
                  <label className="form-label">Email</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="form-input"
                    required
                    placeholder="name@example.com"
                  />
                </div>

                <div className="mb-4">
                  <label className="form-label">Mật khẩu</label>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className="form-input"
                    required
                    placeholder="Nhập mật khẩu"
                    minLength="6"
                  />
                </div>

                {!isLogin && (
                  <div className="mb-6">
                    <label className="form-label">Xác nhận mật khẩu</label>
                    <input
                      type="password"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      className="form-input"
                      required={!isLogin}
                      placeholder="Nhập lại mật khẩu"
                      minLength="6"
                    />
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="btn btn-primary w-full mb-4"
                >
                  {loading ? (
                    <>
                      <div className="spinner mr-2"></div>
                      {isLogin ? 'Đang đăng nhập...' : 'Đang đăng ký...'}
                    </>
                  ) : (
                    isLogin ? 'Đăng nhập' : 'Đăng ký'
                  )}
                </button>

                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => {
                      setIsLogin(!isLogin)
                      setError('')
                      setFormData({
                        email: '',
                        password: '',
                        name: '',
                        phone: '',
                        confirmPassword: ''
                      })
                    }}
                    className="text-primary-600 hover:text-primary-700"
                  >
                    {isLogin 
                      ? 'Chưa có tài khoản? Đăng ký ngay'
                      : 'Đã có tài khoản? Đăng nhập'
                    }
                  </button>
                </div>
              </form>
            </div>
          </div>

          <div className="text-center mt-6">
            <Link to="/" className="text-gray-600 hover:text-gray-700">
              ← Quay lại trang chủ
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Login
