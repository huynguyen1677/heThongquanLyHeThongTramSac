import React, { createContext, useContext, useState, useEffect } from 'react'
import { 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile as updateFirebaseProfile // Đổi tên import để tránh xung đột
} from 'firebase/auth'
import { doc, setDoc, getDoc, updateDoc, runTransaction } from 'firebase/firestore'
import { auth, db } from '../services/firebase'
import { ref, onValue, set } from 'firebase/database' // Thay update bằng set
import { realtimeDb } from '../services/firebase'

const AuthContext = createContext()

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Lấy thông tin user từ Firestore
        try {
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid))
          const userData = userDoc.exists() ? userDoc.data() : {}
          
          const user = {
            id: firebaseUser.uid,
            email: firebaseUser.email,
            name: userData.name || firebaseUser.displayName || firebaseUser.email?.split('@')[0],
            phone: userData.phone || null,
            createdAt: userData.createdAt || firebaseUser.metadata.creationTime,
            ...userData,
            userId: userData.userId ? userData.userId.toString().padStart(6, '0') : undefined
          }
          
          setUser(user)
        } catch (error) {
          console.error('Error fetching user data:', error)
          setUser({
            id: firebaseUser.uid,
            email: firebaseUser.email,
            name: firebaseUser.displayName || firebaseUser.email?.split('@')[0]
          })
        }
      } else {
        setUser(null)
      }
      setLoading(false)
    })

    return unsubscribe
  }, [])

  useEffect(() => {
    if (!user?.userId) return;
    
    // Lắng nghe thay đổi số dư ví từ Firebase
    const walletRef = ref(realtimeDb, `users/${user.userId}/walletBalance`);
    
    const unsubscribe = onValue(walletRef, (snapshot) => {
      if (snapshot.exists()) {
        const newBalance = snapshot.val();
        console.log('💰 Wallet balance updated:', newBalance);
        
        setUser(prev => ({
          ...prev,
          walletBalance: newBalance
        }));
      }
    });
    
    return () => unsubscribe();
  }, [user?.userId])

  const login = async (email, password) => {
    try {
      setLoading(true)
      const userCredential = await signInWithEmailAndPassword(auth, email, password)
      return { success: true, user: userCredential.user }
    } catch (error) {
      console.error('Login error:', error)
      let errorMessage = 'Đăng nhập thất bại'
      
      switch (error.code) {
        case 'auth/user-not-found':
          errorMessage = 'Không tìm thấy tài khoản với email này'
          break
        case 'auth/wrong-password':
          errorMessage = 'Mật khẩu không chính xác'
          break
        case 'auth/invalid-email':
          errorMessage = 'Email không hợp lệ'
          break
        case 'auth/user-disabled':
          errorMessage = 'Tài khoản đã bị vô hiệu hóa'
          break
        default:
          errorMessage = error.message
      }
      
      return { success: false, error: errorMessage }
    } finally {
      setLoading(false)
    }
  }

  const register = async (email, password, name, phone) => {
    try {
      setLoading(true)
      const userCredential = await createUserWithEmailAndPassword(auth, email, password)
      const firebaseUser = userCredential.user

      // Lấy userId số tự tăng
      let numericUserId = await getNextUserId()
      const userId = numericUserId.toString().padStart(6, '0')

      // Cập nhật displayName - sử dụng tên đã import
      if (name) {
        await updateFirebaseProfile(firebaseUser, { displayName: name })
      }

      // Lưu thông tin user vào Firestore
      const userData = {
        email,
        name,
        phone: phone || null,
        role: 'user',
        userId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        walletBalance: 100000 // Tặng 100k khi đăng ký mới
      }

      await setDoc(doc(db, 'users', firebaseUser.uid), userData)
      console.log('User registered and saved to Firestore:', userData)

      return { success: true, user: firebaseUser, userId }
    } catch (error) {
      console.error('Registration error:', error)
      let errorMessage = 'Đăng ký thất bại'

      switch (error.code) {
        case 'auth/email-already-in-use':
          errorMessage = 'Email này đã được sử dụng'
          break
        case 'auth/invalid-email':
          errorMessage = 'Email không hợp lệ'
          break
        case 'auth/weak-password':
          errorMessage = 'Mật khẩu quá yếu (tối thiểu 6 ký tự)'
          break
        default:
          errorMessage = error.message
      }

      return { success: false, error: errorMessage }
    } finally {
      setLoading(false)
    }
  }

  const logout = async () => {
    try {
      await signOut(auth)
      setUser(null)
      return { success: true }
    } catch (error) {
      console.error('Logout error:', error)
      return { success: false, error: error.message }
    }
  }

  // Đổi tên hàm để tránh xung đột
  const updateUserProfile = async (userData) => {
    try {
      if (!user) throw new Error('User not authenticated')
      
      // Cập nhật Firebase Auth profile nếu có displayName
      if (userData.name && userData.name !== user.name) {
        await updateFirebaseProfile(auth.currentUser, { displayName: userData.name })
      }
      
      // Cập nhật Firestore
      const updatedData = {
        ...userData,
        updatedAt: new Date().toISOString()
      }
      
      await updateDoc(doc(db, 'users', user.id), updatedData)
      
      // Cập nhật local state
      setUser(prev => ({ ...prev, ...updatedData }))
      
      return { success: true }
    } catch (error) {
      console.error('Profile update error:', error)
      return { success: false, error: error.message }
    }
  }

  // Hàm lấy số userId mới
  const getNextUserId = async () => {
    const counterRef = doc(db, 'counters', 'users')
    let newId = 100000
    await runTransaction(db, async (transaction) => {
      const counterDoc = await transaction.get(counterRef)
      if (counterDoc.exists()) {
        newId = counterDoc.data().value + 1
        transaction.update(counterRef, { value: newId })
      } else {
        transaction.set(counterRef, { value: newId })
      }
    })
    return newId
  }

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    updateProfile: updateUserProfile, // Export với tên mới
    getNextUserId
  }

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  )
}
