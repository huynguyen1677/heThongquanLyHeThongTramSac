import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  sendPasswordResetEmail,
  updateProfile,
  signOut,
  onAuthStateChanged
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from './firebase';

class AuthService {
  constructor() {
    this.currentUser = null;
    this.googleProvider = new GoogleAuthProvider();
    this.googleProvider.setCustomParameters({
      prompt: 'select_account'
    });
    
    // Listen to auth state changes
    onAuthStateChanged(auth, (user) => {
      this.currentUser = user;
    });
  }

  // Email/Password Sign In
  async signInWithEmail(email, password) {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      await this.createOrUpdateUserProfile(userCredential.user);
      return { success: true, user: userCredential.user };
    } catch (error) {
      return { success: false, error: this.getErrorMessage(error) };
    }
  }

  // Email/Password Sign Up
  async signUpWithEmail(email, password, displayName) {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      // Update display name
      if (displayName) {
        await updateProfile(userCredential.user, {
          displayName: displayName
        });
      }
      
      await this.createOrUpdateUserProfile(userCredential.user, { displayName });
      return { success: true, user: userCredential.user };
    } catch (error) {
      return { success: false, error: this.getErrorMessage(error) };
    }
  }

  // Google Sign In
  async signInWithGoogle() {
    try {
      const result = await signInWithPopup(auth, this.googleProvider);
      await this.createOrUpdateUserProfile(result.user);
      return { success: true, user: result.user };
    } catch (error) {
      if (error.code === 'auth/popup-closed-by-user' || error.code === 'auth/cancelled-popup-request') {
        return { success: false, error: null }; // User cancelled, don't show error
      }
      return { success: false, error: this.getErrorMessage(error) };
    }
  }

  // Password Reset
  async resetPassword(email) {
    try {
      await sendPasswordResetEmail(auth, email);
      return { success: true };
    } catch (error) {
      return { success: false, error: this.getErrorMessage(error) };
    }
  }

  // Sign Out
  async signOut() {
    try {
      await signOut(auth);
      this.currentUser = null;
      return { success: true };
    } catch (error) {
      return { success: false, error: this.getErrorMessage(error) };
    }
  }

  // Create or update user profile in Firestore
  async createOrUpdateUserProfile(user, additionalData = {}) {
    if (!user) return;

    const userRef = doc(db, 'users', user.uid);
    const userDoc = await getDoc(userRef);

    const userData = {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName || additionalData.displayName || '',
      photoURL: user.photoURL || '',
      lastSignIn: new Date(),
      userType: 'driver', // Set as driver for this app
      ...additionalData
    };

    if (!userDoc.exists()) {
      // Create new user document
      userData.createdAt = new Date();
      await setDoc(userRef, userData);
    } else {
      // Update existing user document
      await setDoc(userRef, userData, { merge: true });
    }
  }

  // Get current user
  getCurrentUser() {
    return this.currentUser;
  }

  // Check if user is authenticated
  isAuthenticated() {
    return !!this.currentUser;
  }

  // Get user profile from Firestore
  async getUserProfile(uid) {
    try {
      const userRef = doc(db, 'users', uid);
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists()) {
        return userDoc.data();
      }
      return null;
    } catch (error) {
      console.error('Error getting user profile:', error);
      return null;
    }
  }

  // Error message mapping
  getErrorMessage(error) {
    switch (error.code) {
      case 'auth/user-not-found':
        return 'Không tìm thấy tài khoản với email này';
      case 'auth/wrong-password':
        return 'Mật khẩu không chính xác';
      case 'auth/invalid-credential':
        return 'Thông tin đăng nhập không hợp lệ';
      case 'auth/email-already-in-use':
        return 'Email này đã được sử dụng';
      case 'auth/weak-password':
        return 'Mật khẩu quá yếu. Vui lòng chọn mật khẩu mạnh hơn';
      case 'auth/invalid-email':
        return 'Email không hợp lệ';
      case 'auth/user-disabled':
        return 'Tài khoản này đã bị vô hiệu hóa';
      case 'auth/too-many-requests':
        return 'Quá nhiều lần thử. Vui lòng thử lại sau';
      case 'auth/network-request-failed':
        return 'Lỗi kết nối mạng. Vui lòng kiểm tra internet và thử lại';
      case 'auth/popup-closed-by-user':
        return 'Popup đăng nhập đã bị đóng';
      case 'auth/cancelled-popup-request':
        return 'Yêu cầu đăng nhập đã bị hủy';
      case 'auth/operation-not-allowed':
        return 'Phương thức đăng nhập này chưa được kích hoạt';
      case 'auth/invalid-action-code':
        return 'Mã xác thực không hợp lệ hoặc đã hết hạn';
      case 'auth/expired-action-code':
        return 'Mã xác thực đã hết hạn';
      default:
        return error.message || 'Đã xảy ra lỗi không xác định';
    }
  }

  // Create demo user (for testing)
  async createDemoUser() {
    const demoCredentials = {
      email: 'demo@example.com',
      password: 'password123',
      displayName: 'Demo User'
    };

    try {
      // Try to create demo user
      const result = await this.signUpWithEmail(
        demoCredentials.email, 
        demoCredentials.password, 
        demoCredentials.displayName
      );
      
      if (result.success) {
        console.log('Demo user created successfully');
        return demoCredentials;
      } else if (result.error.includes('đã được sử dụng')) {
        // User already exists, just return credentials
        console.log('Demo user already exists');
        return demoCredentials;
      } else {
        console.error('Failed to create demo user:', result.error);
        return null;
      }
    } catch (error) {
      console.error('Error creating demo user:', error);
      return null;
    }
  }

  // Login with demo credentials
  async loginAsDemo() {
    try {
      const result = await this.signInWithEmail('demo@example.com', 'password123');
      return result;
    } catch (error) {
      // If demo user doesn't exist, create it first
      await this.createDemoUser();
      return await this.signInWithEmail('demo@example.com', 'password123');
    }
  }
}

// Export singleton instance
const authService = new AuthService();
export default authService;
