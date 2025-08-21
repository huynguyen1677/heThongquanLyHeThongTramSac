import { useState, useEffect } from 'react';
import LoginForm from './components/LoginForm';
import Header from './components/Header';
import StationList from './components/StationList';
import ChargingSessionsList from './components/ChargingSessionsList';
import RealtimeService from './services/realtime';
import AuthService from './services/auth';

function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('stations');

  useEffect(() => {
    const unsubscribe = AuthService.onAuthStateChanged((user) => {
      setCurrentUser(user);
      setIsAuthLoading(false);
    });

    // Cleanup subscription on unmount
    return unsubscribe;
  }, []);

  const handleLogin = async (userData) => {
    setIsLoading(true);
    try {
      // userData đã được AuthService xử lý
      console.log(`🎉 Logged in as: ${userData.email} (${userData.ownerId})`);
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await AuthService.signOut();
      console.log('👋 Logged out');
    } catch (error) {
      console.error('Logout error:', error);
      alert(`Lỗi khi đăng xuất: ${error.message}`);
    }
  };

  const handleSyncData = async () => {
    if (!currentUser) return;

    setIsLoading(true);
    try {
      console.log(`🔄 Starting data sync for owner: ${currentUser.ownerId}...`);
      const result = await RealtimeService.syncRealtimeToFirestore(currentUser.ownerId);
      
      alert(`Đồng bộ hoàn tất!\n✅ Đã đồng bộ: ${result.synced} trạm\n⏭️ Đã bỏ qua: ${result.skipped} trạm (đã tồn tại)`);
      
      // Reload the page to show updated data
      window.location.reload();
    } catch (error) {
      console.error('Sync error:', error);
      alert(`Lỗi khi đồng bộ dữ liệu: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  if (isAuthLoading) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh'
      }}>
        <div className="loading" style={{ width: '40px', height: '40px' }}></div>
        <p style={{ marginLeft: '1rem', color: '#6b7280' }}>Đang kiểm tra phiên đăng nhập...</p>
      </div>
    )
  }

  if (!currentUser) {
    return <LoginForm onLogin={handleLogin} />;
  }

  return (
    <div>
      <Header
        user={currentUser}
        onLogout={handleLogout}
        onSyncData={handleSyncData}
      />
      
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '1rem' }}>
        {/* Navigation Tabs */}
        <div style={{ borderBottom: '1px solid #e5e7eb', marginBottom: '2rem' }}>
          <nav style={{ display: 'flex', gap: '2rem' }}>
            <button
              onClick={() => setActiveTab('stations')}
              style={{
                padding: '0.75rem 0',
                color: activeTab === 'stations' ? '#2563eb' : '#6b7280',
                borderBottom: activeTab === 'stations' ? '2px solid #2563eb' : '2px solid transparent',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontWeight: activeTab === 'stations' ? '600' : '400'
              }}
            >
              Quản lý trạm sạc
            </button>
            <button
              onClick={() => setActiveTab('sessions')}
              style={{
                padding: '0.75rem 0',
                color: activeTab === 'sessions' ? '#2563eb' : '#6b7280',
                borderBottom: activeTab === 'sessions' ? '2px solid #2563eb' : '2px solid transparent',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontWeight: activeTab === 'sessions' ? '600' : '400'
              }}
            >
              Lịch sử phiên sạc
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        <main>
          {activeTab === 'stations' && (
            <StationList ownerId={currentUser.ownerId} />
          )}
          {activeTab === 'sessions' && (
            <ChargingSessionsList ownerId={currentUser.ownerId} />
          )}
        </main>
      </div>

      {isLoading && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2000
        }}>
          <div className="card">
            <div className="card-body text-center" style={{ padding: '2rem' }}>
              <div className="loading" style={{ width: '40px', height: '40px', margin: '0 auto 1rem' }}></div>
              <p style={{ color: '#374151', margin: 0 }}>Đang xử lý...</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
