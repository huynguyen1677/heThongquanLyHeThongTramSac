import React from 'react';
import { useAppState } from '../hooks/useAppState';
import LoginPage from '../pages/LoginPage';
import LoadingScreen from '../components/LoadingScreen';
import UserProfile from '../components/UserProfile';
import StationMap from '../components/StationMap';
import AppSidebar from '../components/AppSidebar';
import AppFooter from '../components/AppFooter';
import TabContent from '../components/TabContent';
import AppHeader from '../components/AppHeader';

/**
 * Main Home component
 * Sử dụng composition pattern để dễ maintain và extend
 */
const HomePage = () => {
  const {
    // State
    user,
    loading,
    selectedStation,
    userLocation,
    activeTab,
    sidebarOpen,
    isOnline,
    
    // Actions
    signOut,
    selectStation,
    updateLocation,
    setActiveTab,
    toggleSidebar,
    closeSidebar,
    handleSessionUpdate
  } = useAppState();

  // Loading state
  if (loading) {
    return (
      <LoadingScreen 
        message="Đang khởi tạo ứng dụng..."
        submessage="Kiểm tra thông tin xác thực và kết nối Firebase"
      />
    );
  }

  // Unauthenticated state
  if (!user) {
    return <LoginPage onAuthSuccess={(user) => {/* setUser được handle trong useAppState */}} />;
  }

  // Authenticated state - Main app layout
  return (
    <div className="app-container h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <AppHeader
        onMenuClick={toggleSidebar}
        user={user}
        onSignOut={signOut}
        onLocationUpdate={updateLocation}
      />

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Map Section */}
        <div className="flex-1 relative">
          <StationMap
            onStationSelect={selectStation}
            userLocation={userLocation}
            selectedStationId={selectedStation?.stationId}
          />
        </div>

        {/* Sidebar */}
        <AppSidebar
          sidebarOpen={sidebarOpen}
          onToggleSidebar={toggleSidebar}
          onCloseSidebar={closeSidebar}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        >
          <TabContent
            activeTab={activeTab}
            selectedStation={selectedStation}
            onSelectStation={setActiveTab}
            userId={user.uid}
            onSessionUpdate={handleSessionUpdate}
          />
        </AppSidebar>
      </div>

      {/* Footer */}
      <AppFooter isOnline={isOnline} />
    </div>
  );
};

export default HomePage;
