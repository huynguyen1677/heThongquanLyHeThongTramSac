import React, { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../services/firebase';
import AuthService from '../services/AuthService';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      try {
        setError(null);
        
        if (user) {
          // Lấy thông tin profile từ Firestore
          const profile = await AuthService.getUserProfile(user.uid);
          
          // Kiểm tra nếu không tìm thấy profile hoặc không phải admin
          if (!profile) {
            await AuthService.logout();
            setCurrentUser(null);
            setUserProfile(null);
            setError('Không tìm thấy thông tin người dùng trong hệ thống');
            setLoading(false);
            return;
          }
          
          // Kiểm tra role admin
          if (profile.role !== 'admin' && profile.role !== 'super-admin') {
            // Nếu không phải admin, đăng xuất luôn
            await AuthService.logout();
            setCurrentUser(null);
            setUserProfile(null);
            setError('Bạn không có quyền truy cập hệ thống này');
          } else {
            setCurrentUser(user);
            setUserProfile(profile);
          }
        } else {
          setCurrentUser(null);
          setUserProfile(null);
        }
      } catch (error) {
        console.error('Auth state change error:', error);
        setError('Có lỗi xảy ra khi xác thực');
        setCurrentUser(null);
        setUserProfile(null);
      } finally {
        setLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  const login = async (email, password) => {
    try {
      setError(null);
      setLoading(true);
      
      const result = await AuthService.login(email, password);
      
      // Kiểm tra role ngay sau khi login
      const profile = await AuthService.getUserProfile(result.user.uid);
      
      if (!profile) {
        await AuthService.logout();
        throw new Error('Không tìm thấy thông tin người dùng trong hệ thống');
      }
      
      if (profile.role !== 'admin' && profile.role !== 'super-admin') {
        await AuthService.logout();
        throw new Error('Bạn không có quyền truy cập hệ thống này');
      }

      return result;
    } catch (error) {
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      setError(null);
      await AuthService.logout();
      setCurrentUser(null);
      setUserProfile(null);
    } catch (error) {
      setError(error.message);
      throw error;
    }
  };

  const value = {
    currentUser,
    userProfile,
    loading,
    error,
    login,
    logout,
    isAuthenticated: !!currentUser,
    isAdmin: userProfile?.role === 'admin' || userProfile?.role === 'super-admin',
    isSuperAdmin: userProfile?.role === 'super-admin'
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;