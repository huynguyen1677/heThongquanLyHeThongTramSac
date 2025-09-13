import { 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  sendPasswordResetEmail
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from './firebase';
import BaseService from './BaseService';

/**
 * AuthService - Service xử lý authentication và authorization
 * Kế thừa từ BaseService để sử dụng error handling
 */
export class AuthService extends BaseService {

  // ===== AUTHENTICATION =====

  /**
   * Đăng nhập với email và password
   * @param {string} email - Email người dùng
   * @param {string} password - Mật khẩu
   */
  static async login(email, password) {
    try {
      this.validateRequiredFields({ email, password }, ['email', 'password']);
      
      const result = await signInWithEmailAndPassword(auth, email, password);
      
      // Ghi log audit
      console.log('🔐 User logged in:', {
        uid: result.user.uid,
        email: result.user.email,
        timestamp: new Date().toISOString()
      });

      return result;
    } catch (error) {
      // Xử lý các lỗi Firebase Auth
      let errorMessage = 'Đăng nhập thất bại';
      
      switch (error.code) {
        case 'auth/user-not-found':
          errorMessage = 'Không tìm thấy tài khoản với email này';
          break;
        case 'auth/wrong-password':
          errorMessage = 'Mật khẩu không chính xác';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Email không hợp lệ';
          break;
        case 'auth/user-disabled':
          errorMessage = 'Tài khoản đã bị khóa';
          break;
        case 'auth/too-many-requests':
          errorMessage = 'Quá nhiều lần thử. Vui lòng thử lại sau';
          break;
        case 'auth/network-request-failed':
          errorMessage = 'Lỗi kết nối mạng';
          break;
        default:
          errorMessage = error.message || 'Đăng nhập thất bại';
      }
      
      this.handleError(new Error(errorMessage), 'AuthService.login');
    }
  }

  /**
   * Đăng xuất
   */
  static async logout() {
    try {
      await signOut(auth);
      
      console.log('🔐 User logged out:', {
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      this.handleError(error, 'AuthService.logout');
    }
  }

  /**
   * Lấy thông tin profile của user từ Firestore
   * @param {string} userId - UID của user
   */
  static async getUserProfile(userId) {
    try {
      if (!userId) {
        throw new Error('User ID is required');
      }

      const userDoc = await getDoc(doc(db, 'users', userId));
      
      if (!userDoc.exists()) {
        // Return null instead of throwing error to handle gracefully
        console.warn(`User profile not found for UID: ${userId}`);
        return null;
      }

      const userData = userDoc.data();
      
      return {
        id: userDoc.id,
        ...userData,
        createdAt: this.timestampToDate(userData.createdAt),
        updatedAt: this.timestampToDate(userData.updatedAt)
      };
      
    } catch (error) {
      console.error('Error getting user profile:', error);
      return null;
    }
  }

  /**
   * Kiểm tra quyền admin
   * @param {string} userId - UID của user
   */
  static async checkAdminRole(userId) {
    try {
      const profile = await this.getUserProfile(userId);
      return profile && (profile.role === 'admin' || profile.role === 'super-admin');
    } catch (error) {
      console.error('Error checking admin role:', error);
      return false;
    }
  }

  /**
   * Gửi email reset password
   * @param {string} email - Email để reset password
   */
  static async sendPasswordReset(email) {
    try {
      this.validateRequiredFields({ email }, ['email']);
      
      await sendPasswordResetEmail(auth, email);
      
      console.log('📧 Password reset email sent:', {
        email,
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      let errorMessage = 'Gửi email reset password thất bại';
      
      switch (error.code) {
        case 'auth/user-not-found':
          errorMessage = 'Không tìm thấy tài khoản với email này';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Email không hợp lệ';
          break;
        case 'auth/too-many-requests':
          errorMessage = 'Quá nhiều yêu cầu. Vui lòng thử lại sau';
          break;
        default:
          errorMessage = error.message || 'Gửi email reset password thất bại';
      }
      
      this.handleError(new Error(errorMessage), 'AuthService.sendPasswordReset');
    }
  }

  /**
   * Lấy user hiện tại
   */
  static getCurrentUser() {
    return auth.currentUser;
  }

  /**
   * Subscribe to auth state changes
   * @param {function} callback - Callback function
   */
  static onAuthStateChanged(callback) {
    return onAuthStateChanged(auth, callback);
  }

  // ===== VALIDATION HELPERS =====

  /**
   * Validate email format
   * @param {string} email 
   */
  static validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Validate password strength
   * @param {string} password 
   */
  static validatePassword(password) {
    if (!password || password.length < 6) {
      return { isValid: false, message: 'Mật khẩu phải có ít nhất 6 ký tự' };
    }
    
    return { isValid: true };
  }

  // ===== AUDIT LOGGING =====

  /**
   * Log authentication events for audit
   * @param {string} event - Event type
   * @param {Object} data - Event data
   */
  static logAuthEvent(event, data = {}) {
    console.log(`🔐 Auth Event: ${event}`, {
      ...data,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent
    });
  }
}

export default AuthService;