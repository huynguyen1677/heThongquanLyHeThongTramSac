import { 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  createUserWithEmailAndPassword 
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from './firebase';

export class AuthService {
  
  // Đăng nhập bằng email và password
  static async signIn(email, password) {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Lấy thông tin owner từ Firestore
      const ownerData = await this.getOwnerProfile(user.uid);
      
      return {
        uid: user.uid,
        email: user.email,
        ...ownerData
      };
    } catch (error) {
      console.error('Sign in error:', error);
      throw this.getErrorMessage(error.code);
    }
  }

  // Đăng xuất
  static async signOut() {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    }
  }

  // Lắng nghe thay đổi trạng thái authentication
  static onAuthStateChanged(callback) {
    return onAuthStateChanged(auth, async (user) => {
      if (user) {
        // User is signed in
        const ownerData = await this.getOwnerProfile(user.uid);
        callback({
          uid: user.uid,
          email: user.email,
          ...ownerData
        });
      } else {
        // User is signed out
        callback(null);
      }
    });
  }

  // Lấy thông tin owner từ Firestore
  static async getOwnerProfile(uid) {
    try {
      const ownerRef = doc(db, 'users', uid);
      const ownerSnap = await getDoc(ownerRef);
      
      if (ownerSnap.exists()) {
        return ownerSnap.data();
      } else {
        // Nếu chưa có profile, tạo profile mặc định
        const defaultProfile = {
          ownerId: `OWNER_${uid.substring(0, 8)}`,
          name: '',
          phone: '',
          address: '',
          role: 'owner',
          active: true,
          createdAt: new Date().toISOString()
        };
        
        await setDoc(ownerRef, defaultProfile);
        return defaultProfile;
      }
    } catch (error) {
      console.error('Error getting owner profile:', error);
      return {
        ownerId: `OWNER_${uid.substring(0, 8)}`,
        name: '',
        phone: '',
        address: '',
        role: 'owner',
        active: true
      };
    }
  }

  // Cập nhật thông tin owner
  static async updateOwnerProfile(uid, profileData) {
    try {
      const ownerRef = doc(db, 'owners', uid);
      const updateData = {
        ...profileData,
        updatedAt: new Date().toISOString()
      };
      
      await setDoc(ownerRef, updateData, { merge: true });
      return updateData;
    } catch (error) {
      console.error('Error updating owner profile:', error);
      throw error;
    }
  }

  // Tạo tài khoản mới (chỉ dành cho admin)
  static async createOwnerAccount(email, password, ownerData) {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Tạo profile owner
      const ownerProfile = {
        ownerId: ownerData.ownerId,
        name: ownerData.name,
        phone: ownerData.phone || '',
        address: ownerData.address || '',
        role: 'owner',
        active: true,
        createdAt: new Date().toISOString()
      };
      
      await setDoc(doc(db, 'owners', user.uid), ownerProfile);
      
      return {
        uid: user.uid,
        email: user.email,
        ...ownerProfile
      };
    } catch (error) {
      console.error('Error creating owner account:', error);
      throw this.getErrorMessage(error.code);
    }
  }

  // Chuyển đổi error code thành message tiếng Việt
  static getErrorMessage(errorCode) {
    const errorMessages = {
      'auth/user-not-found': 'Không tìm thấy tài khoản với email này',
      'auth/wrong-password': 'Mật khẩu không đúng',
      'auth/invalid-email': 'Email không hợp lệ',
      'auth/user-disabled': 'Tài khoản đã bị vô hiệu hóa',
      'auth/too-many-requests': 'Quá nhiều lần thử đăng nhập. Vui lòng thử lại sau',
      'auth/network-request-failed': 'Lỗi kết nối mạng',
      'auth/email-already-in-use': 'Email đã được sử dụng',
      'auth/weak-password': 'Mật khẩu quá yếu (tối thiểu 6 ký tự)',
      'auth/invalid-credential': 'Thông tin đăng nhập không đúng'
    };
    
    return new Error(errorMessages[errorCode] || 'Có lỗi xảy ra khi đăng nhập');
  }

  // Lấy user hiện tại
  static getCurrentUser() {
    return auth.currentUser;
  }
}

export default AuthService;
