import { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../services/firebase';
import authService from '../services/authService';

/**
 * Custom hook để quản lý state chính của app
 * Tách logic ra khỏi component chính để dễ test và tái sử dụng
 */
export const useAppState = () => {
  // Authentication state
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Location and station state
  const [selectedStation, setSelectedStation] = useState(null);
  const [userLocation, setUserLocation] = useState(null);

  // UI state
  const [activeTab, setActiveTab] = useState('map');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Online/offline status monitoring
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Authentication state monitoring
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Actions
  const actions = {
    // Authentication actions
    signOut: async () => {
      try {
        const result = await authService.signOut();
        if (result.success) {
          setUser(null);
          setSelectedStation(null);
          setUserLocation(null);
          setActiveTab('map');
        } else {
          console.error('Sign out error:', result.error);
        }
      } catch (error) {
        console.error('Sign out error:', error);
      }
    },

    // Station actions
    selectStation: (station) => {
      setSelectedStation(station);
      setActiveTab('control');
      setSidebarOpen(true);
    },

    // Location actions
    updateLocation: (location) => {
      setUserLocation(location);
    },

    // UI actions
    setActiveTab: (tab) => {
      setActiveTab(tab);
      if (window.innerWidth < 768) {
        setSidebarOpen(true);
      }
    },

    toggleSidebar: () => {
      setSidebarOpen(!sidebarOpen);
    },

    closeSidebar: () => {
      setSidebarOpen(false);
    },

    // Session actions
    handleSessionUpdate: (sessionId) => {
      console.log('Session updated:', sessionId);
      // Có thể thêm logic khác ở đây
    }
  };

  return {
    // State
    user,
    loading,
    selectedStation,
    userLocation,
    activeTab,
    sidebarOpen,
    isOnline,
    
    // Actions
    ...actions
  };
};
