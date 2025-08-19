import { useState, useEffect } from 'react';
import LoginForm from './components/LoginForm';
import Header from './components/Header';
import StationList from './components/StationList';
import RealtimeService from './services/realtime';
import AuthService from './services/auth';

function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

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
      
      <main style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <StationList ownerId={currentUser.ownerId} />
      </main>

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
