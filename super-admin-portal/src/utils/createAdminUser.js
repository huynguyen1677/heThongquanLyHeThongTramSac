/**
 * Create Admin User Script
 * Script để tạo user admin trong Firestore cho testing
 */

import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { db, auth } from '../services/firebase.js';

/**
 * Tạo admin user mới
 * @param {string} email - Email của admin
 * @param {string} password - Password
 * @param {string} name - Tên admin
 * @param {string} role - Role: 'admin' hoặc 'super-admin'
 */
export const createAdminUser = async (email, password, name, role = 'admin') => {
  try {
    console.log('🔧 Creating admin user...');
    
    // Tạo user trong Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    console.log('✅ User created in Firebase Auth:', user.uid);
    
    // Tạo document trong Firestore
    const userData = {
      uid: user.uid,
      email: email,
      name: name,
      role: role,
      status: 'active',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      lastLogin: null,
      phoneNumber: '',
      avatar: '',
      permissions: role === 'super-admin' ? [
        'view_dashboard',
        'manage_owners',
        'manage_stations', 
        'manage_users',
        'manage_pricing',
        'view_analytics',
        'system_settings',
        'audit_logs'
      ] : [
        'view_dashboard',
        'manage_owners',
        'manage_stations',
        'view_analytics'
      ]
    };
    
    await setDoc(doc(db, 'users', user.uid), userData);
    
    console.log('✅ User profile created in Firestore');
    console.log('📧 Email:', email);
    console.log('👤 Name:', name);
    console.log('🔑 Role:', role);
    console.log('🆔 UID:', user.uid);
    
    return {
      success: true,
      user: user,
      profile: userData
    };
    
  } catch (error) {
    console.error('❌ Error creating admin user:', error);
    
    // Custom error messages
    let errorMessage = 'Có lỗi xảy ra khi tạo user';
    
    switch (error.code) {
      case 'auth/email-already-in-use':
        errorMessage = 'Email đã được sử dụng';
        break;
      case 'auth/weak-password':
        errorMessage = 'Mật khẩu quá yếu (ít nhất 6 ký tự)';
        break;
      case 'auth/invalid-email':
        errorMessage = 'Email không hợp lệ';
        break;
      default:
        errorMessage = error.message;
    }
    
    return {
      success: false,
      error: errorMessage
    };
  }
};

// Preset admin users để test
export const createTestAdminUsers = async () => {
  const testUsers = [
    {
      email: 'admin@example.com',
      password: '123456',
      name: 'Admin Test',
      role: 'admin'
    },
    {
      email: 'superadmin@example.com', 
      password: '123456',
      name: 'Super Admin',
      role: 'super-admin'
    }
  ];
  
  console.log('🚀 Creating test admin users...');
  
  for (const userData of testUsers) {
    console.log(`\n📝 Creating ${userData.role}: ${userData.email}`);
    const result = await createAdminUser(
      userData.email,
      userData.password,
      userData.name,
      userData.role
    );
    
    if (result.success) {
      console.log(`✅ Successfully created ${userData.role}`);
    } else {
      console.log(`❌ Failed to create ${userData.role}:`, result.error);
    }
  }
  
  console.log('\n🎉 Test admin users creation completed!');
};

// Function để check user hiện tại
export const checkCurrentUser = () => {
  const user = auth.currentUser;
  if (user) {
    console.log('👤 Current user:', {
      uid: user.uid,
      email: user.email,
      emailVerified: user.emailVerified
    });
  } else {
    console.log('❌ No user currently logged in');
  }
};