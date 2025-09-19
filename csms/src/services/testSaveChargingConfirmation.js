import dotenv from 'dotenv';
import { realtimeService } from './realtime.js';
import { firebase } from './firebase.js';

// QUAN TRỌNG: Load environment variables trước
dotenv.config();

async function testSaveChargingConfirmation() {
  console.log('🔥 Khởi tạo Firebase service...');
  
  // QUAN TRỌNG: Khởi tạo Firebase TRƯỚC khi dùng realtime service
  await firebase.initialize();
  
  console.log('📡 Khởi tạo Realtime service...');
  
  // Sau đó khởi tạo realtime service
  realtimeService.initialize();

  // Đợi một chút cho kết nối Firebase sẵn sàng
  await new Promise(resolve => setTimeout(resolve, 1000));

  console.log('🧪 Bắt đầu test saveChargingConfirmation...');

  const userId = 'test_user_123';
  const confirmationData = {
    userId,
    stationId: 'CP_TEST',
    connectorId: 1,
    timestamp: Date.now(),
    status: 'pending'
  };

  try {
    const result = await realtimeService.saveChargingConfirmation(userId, confirmationData);
    if (result) {
      console.log('✅ Đã ghi xác nhận lên Firebase!');
    } else {
      console.log('❌ Không ghi được xác nhận lên Firebase!');
    }
  } catch (error) {
    console.error('❌ Lỗi khi ghi xác nhận:', error);
  }
}

testSaveChargingConfirmation();