import 'dotenv/config';
import { UserModel } from './src/models/user.js';
import { firestoreService } from './src/services/firestore.js';
import { firebase } from './src/services/firebase.js';

async function checkUserBalance() {
  try {
    console.log('🔥 Initializing Firebase...');
    await firebase.initialize();
    
    if (firebase.isInitialized()) {
      firestoreService.initialize();
      console.log('✅ Firebase initialized');
    } else {
      console.error('❌ Firebase failed to initialize');
      return;
    }

    // Kiểm tra balance user 000005
    const balance = await UserModel.getBalance('000005');
    console.log(`💰 User 000005 current balance: ${balance} VND`);
    
    // Lấy thông tin user đầy đủ
    const user = await UserModel.getUserById('000005');
    console.log('👤 User info:', user);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkUserBalance();
