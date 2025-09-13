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
      
      // Kiểm tra role - chỉ cho phép owner đăng nhập
      if (!ownerData || ownerData.role !== 'owner') {
        // Đăng xuất ngay lập tức nếu không phải owner
        await signOut(auth);
        throw new Error('Bạn không có quyền truy cập vào hệ thống Owner Portal. Chỉ chủ trạm mới có thể đăng nhập.');
      }

      // Kiểm tra trạng thái active
      if (!ownerData.active) {
        await signOut(auth);
        throw new Error('Tài khoản của bạn đã bị tạm khóa. Vui lòng liên hệ admin để biết thêm chi tiết.');
      }
      
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
        try {
          // User is signed in - kiểm tra quyền owner
          const ownerData = await this.getOwnerProfile(user.uid);
          
          // Kiểm tra role - chỉ cho phép owner
          if (!ownerData || ownerData.role !== 'owner') {
            console.warn('User không có quyền owner, đăng xuất tự động');
            await signOut(auth);
            callback(null);
            return;
          }

          // Kiểm tra trạng thái active
          if (!ownerData.active) {
            console.warn('Tài khoản owner bị khóa, đăng xuất tự động');
            await signOut(auth);
            callback(null);
            return;
          }

          callback({
            uid: user.uid,
            email: user.email,
            ...ownerData
          });
        } catch (error) {
          console.error('Error in auth state change:', error);
          await signOut(auth);
          callback(null);
        }
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
        const userData = ownerSnap.data();
        
        // Chỉ trả về dữ liệu nếu là owner
        if (userData.role === 'owner') {
          return userData;
        } else {
          console.warn(`User ${uid} có role '${userData.role}', không phải owner`);
          return null;
        }
      } else {
        console.warn(`Không tìm thấy profile cho user ${uid}`);
        return null;
      }
    } catch (error) {
      console.error('Error getting owner profile:', error);
      return null;
    }
  }

  // Cập nhật thông tin owner
  static async updateOwnerProfile(uid, profileData) {
    try {
      const ownerRef = doc(db, 'users', uid);
      const updateData = {
        ...profileData,
        role: 'owner', // Đảm bảo role luôn là owner
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
      
      await setDoc(doc(db, 'users', user.uid), ownerProfile);
      
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
    
    // Nếu error là string thì trả về trực tiếp
    if (typeof errorCode === 'string' && !errorCode.startsWith('auth/')) {
      return new Error(errorCode);
    }
    
    return new Error(errorMessages[errorCode] || 'Có lỗi xảy ra khi đăng nhập');
  }

  // Lấy user hiện tại
  static getCurrentUser() {
    return auth.currentUser;
  }
}

export default AuthService;
