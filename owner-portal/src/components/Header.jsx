import { LogOut, User } from 'lucide-react';

const Header = ({ user, onLogout }) => {
  return (
    <header style={{
      background: 'white',
      borderBottom: '1px solid #e5e7eb',
      padding: '1rem 2rem',
      boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        maxWidth: '1200px',
        margin: '0 auto'
      }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#1f2937' }}>
            🏢 Owner Portal
          </h1>
          <p style={{ color: '#6b7280', fontSize: '0.875rem', margin: 0 }}>
            Quản lý trạm sạc điện
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.5rem',
            padding: '0.5rem 1rem',
            backgroundColor: '#f3f4f6',
            borderRadius: '0.5rem'
          }}>
            <User size={16} style={{ color: '#6b7280' }} />
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontWeight: '500', color: '#374151', fontSize: '0.875rem' }}>
                {user.name || user.ownerId}
              </span>
              <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                {user.email}
              </span>
            </div>
          </div>

          <button 
            onClick={onLogout}
            className="btn btn-danger"
          >
            <LogOut size={16} />
            Đăng xuất
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
