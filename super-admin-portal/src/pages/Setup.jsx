import React, { useState } from 'react';
import { createAdminUser } from '../utils/createAdminUser';
import { Shield, User, Plus, CheckCircle, AlertCircle, Loader } from 'lucide-react';
import './Setup.css';

const Setup = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    role: 'admin'
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    try {
      const createResult = await createAdminUser(
        formData.email,
        formData.password,
        formData.name,
        formData.role
      );

      setResult(createResult);

      if (createResult.success) {
        // Reset form
        setFormData({
          email: '',
          password: '',
          name: '',
          role: 'admin'
        });
      }
    } catch (error) {
      setResult({
        success: false,
        error: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  const createQuickTestUsers = async () => {
    setLoading(true);
    setResult(null);

    const testUsers = [
      {
        email: 'admin@test.com',
        password: '123456',
        name: 'Admin Test',
        role: 'admin'
      },
      {
        email: 'superadmin@test.com',
        password: '123456',
        name: 'Super Admin Test',
        role: 'super-admin'
      }
    ];

    const results = [];

    for (const userData of testUsers) {
      try {
        const createResult = await createAdminUser(
          userData.email,
          userData.password,
          userData.name,
          userData.role
        );
        results.push({
          email: userData.email,
          role: userData.role,
          success: createResult.success,
          error: createResult.error
        });
      } catch (error) {
        results.push({
          email: userData.email,
          role: userData.role,
          success: false,
          error: error.message
        });
      }
    }

    setResult({
      success: true,
      multipleUsers: results
    });

    setLoading(false);
  };

  return (
    <div className="setup-page">
      <div className="setup-container">
        <div className="setup-header">
          <Shield size={48} className="setup-icon" />
          <h1>Setup Admin Users</h1>
          <p>Tạo tài khoản admin để truy cập hệ thống</p>
        </div>

        {/* Quick Setup */}
        <div className="quick-setup">
          <h3>Quick Setup</h3>
          <p>Tạo nhanh 2 tài khoản test:</p>
          <ul>
            <li>admin@test.com / 123456 (Admin)</li>
            <li>superadmin@test.com / 123456 (Super Admin)</li>
          </ul>
          <button 
            className="btn btn-primary"
            onClick={createQuickTestUsers}
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader className="spinner" size={16} />
                <span>Đang tạo...</span>
              </>
            ) : (
              <>
                <Plus size={16} />
                <span>Tạo Test Users</span>
              </>
            )}
          </button>
        </div>

        {/* Custom Form */}
        <div className="custom-setup">
          <h3>Tạo Custom Admin</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                required
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label>Mật khẩu (tối thiểu 6 ký tự)</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                required
                minLength={6}
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label>Tên hiển thị</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label>Vai trò</label>
              <select
                name="role"
                value={formData.role}
                onChange={handleInputChange}
                disabled={loading}
              >
                <option value="admin">Admin</option>
                <option value="super-admin">Super Admin</option>
              </select>
            </div>

            <button 
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader className="spinner" size={16} />
                  <span>Đang tạo...</span>
                </>
              ) : (
                <>
                  <User size={16} />
                  <span>Tạo Admin User</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Result Display */}
        {result && (
          <div className={`result ${result.success ? 'success' : 'error'}`}>
            {result.multipleUsers ? (
              <div>
                <h4>Kết quả tạo test users:</h4>
                {result.multipleUsers.map((user, index) => (
                  <div key={index} className={`user-result ${user.success ? 'success' : 'error'}`}>
                    {user.success ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
                    <span>{user.email} ({user.role})</span>
                    {!user.success && <span className="error-text">: {user.error}</span>}
                  </div>
                ))}
              </div>
            ) : (
              <div>
                {result.success ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
                <span>
                  {result.success 
                    ? 'Tạo admin user thành công!' 
                    : `Lỗi: ${result.error}`
                  }
                </span>
              </div>
            )}
          </div>
        )}

        <div className="setup-note">
          <p><strong>Lưu ý:</strong> Sau khi tạo xong admin user, bạn có thể truy cập trang login để đăng nhập.</p>
        </div>
      </div>
    </div>
  );
};

export default Setup;