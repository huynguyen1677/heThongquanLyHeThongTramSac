import { useState } from 'react';
import { Mail, Key, LogIn } from 'lucide-react';
import AuthService from '../services/auth';

const LoginForm = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email.trim()) {
      alert('Vui lòng nhập Email!');
      return;
    }

    if (!password.trim()) {
      alert('Vui lòng nhập mật khẩu!');
      return;
    }

    setIsLoading(true);
    try {
      const userData = await AuthService.signIn(email, password);
      await onLogin(userData);
    } catch (error) {
      alert(`Đăng nhập thất bại: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '1rem'
    }}>
      <div className="card" style={{ width: '100%', maxWidth: '400px' }}>
        <div className="card-header text-center">
          <h1 className="card-title" style={{ color: '#3b82f6', marginBottom: '0.5rem' }}>
            🏢 Owner Portal
          </h1>
          <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>
            Quản lý hệ thống trạm sạc của bạn
          </p>
        </div>
        
        <div className="card-body">
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="email">
                <Mail size={16} style={{ display: 'inline', marginRight: '0.5rem' }} />
                Email *
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Nhập email của bạn"
                disabled={isLoading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">
                <Key size={16} style={{ display: 'inline', marginRight: '0.5rem' }} />
                Mật khẩu *
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Nhập mật khẩu"
                disabled={isLoading}
              />
            </div>

            <button 
              type="submit" 
              className="btn btn-primary w-full"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <div className="loading"></div>
                  Đang đăng nhập...
                </>
              ) : (
                <>
                  <LogIn size={16} />
                  Đăng nhập
                </>
              )}
            </button>
          </form>

          <div style={{ 
            marginTop: '1.5rem', 
            padding: '1rem', 
            backgroundColor: '#f3f4f6', 
            borderRadius: '0.5rem',
            fontSize: '0.75rem',
            color: '#6b7280'
          }}>
            <strong>💡 Tài khoản demo:</strong>
            <ul style={{ marginTop: '0.5rem', paddingLeft: '1rem' }}>
              <li>Email: <code>owner1@example.com</code></li>
              <li>Mật khẩu: <code>123456</code></li>
            </ul>
            <p style={{ marginTop: '0.5rem', fontSize: '0.7rem' }}>
              * Liên hệ admin để tạo tài khoản mới
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;
