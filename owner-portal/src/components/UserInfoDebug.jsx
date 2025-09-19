import React, { useState, useEffect } from 'react';
import AuthService from '../services/auth';

const UserInfoDebug = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = AuthService.onAuthStateChanged((userData) => {
      setUser(userData);
      setLoading(false);
      console.log('👤 Current user:', userData);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return <div>Đang kiểm tra trạng thái đăng nhập...</div>;
  }

  if (!user) {
    return (
      <div style={{ 
        padding: '1rem', 
        background: '#fee2e2', 
        border: '1px solid #fecaca',
        borderRadius: '0.5rem',
        margin: '1rem 0'
      }}>
        <h3>❌ Chưa đăng nhập</h3>
        <p>Vui lòng đăng nhập để tiếp tục.</p>
      </div>
    );
  }

  return (
    <div style={{ 
      padding: '1rem', 
      background: '#f0f9ff', 
      border: '1px solid #bae6fd',
      borderRadius: '0.5rem',
      margin: '1rem 0'
    }}>
      <h3>👤 Thông tin người dùng hiện tại:</h3>
      <pre style={{ 
        background: '#f8fafc', 
        padding: '0.5rem', 
        borderRadius: '0.25rem',
        fontSize: '0.75rem',
        overflow: 'auto'
      }}>
        {JSON.stringify(user, null, 2)}
      </pre>
      
      <div style={{ marginTop: '1rem' }}>
        <strong>Trạng thái truy cập Owner Portal:</strong>
        {user.role === 'owner' ? (
          <span style={{ color: '#16a34a', marginLeft: '0.5rem' }}>
            ✅ Được phép truy cập
          </span>
        ) : (
          <span style={{ color: '#dc2626', marginLeft: '0.5rem' }}>
            ❌ Không được phép (Role: {user.role})
          </span>
        )}
      </div>
    </div>
  );
};

export default UserInfoDebug;