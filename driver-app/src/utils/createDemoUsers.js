/**
 * Demo Script để tạo user demo cho testing
 * Chạy script này một lần để tạo tài khoản demo
 */

import authService from '../services/authService.js';

const createDemoUsers = async () => {
  console.log('🚀 Tạo tài khoản demo cho Driver App...');

  try {
    // Tạo demo user chính
    const mainDemo = await authService.createDemoUser();
    if (mainDemo) {
      console.log('✅ Tài khoản demo chính:', mainDemo);
    }

    // Tạo thêm một số user demo khác
    const additionalUsers = [
      {
        email: 'user1@demo.com',
        password: 'demo123456',
        displayName: 'Demo User 1'
      },
      {
        email: 'user2@demo.com', 
        password: 'demo123456',
        displayName: 'Demo User 2'
      }
    ];

    for (const userData of additionalUsers) {
      try {
        const result = await authService.signUpWithEmail(
          userData.email,
          userData.password,
          userData.displayName
        );
        
        if (result.success || result.error?.includes('đã được sử dụng')) {
          console.log(`✅ User demo: ${userData.email}`);
        } else {
          console.log(`❌ Lỗi tạo ${userData.email}:`, result.error);
        }
      } catch (error) {
        console.log(`❌ Lỗi tạo ${userData.email}:`, error.message);
      }
    }

    console.log('\n📝 Thông tin đăng nhập demo:');
    console.log('Main Demo: demo@example.com / password123');
    console.log('User 1: user1@demo.com / demo123456');
    console.log('User 2: user2@demo.com / demo123456');
    
  } catch (error) {
    console.error('❌ Lỗi tạo demo users:', error);
  }
};

// Uncomment để chạy script
// createDemoUsers();

export { createDemoUsers };
export default createDemoUsers;
