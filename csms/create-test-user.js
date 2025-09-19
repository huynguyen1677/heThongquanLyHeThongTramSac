const admin = require('firebase-admin');

// Initialize Firebase Admin
const serviceAccount = require('./firebase-service-account.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://hethongquanlytramsacxe-default-rtdb.asia-southeast1.firebasedatabase.app/'
});

const db = admin.firestore();

async function createTestUser() {
  try {
    const userData = {
      email: 'test@example.com',
      name: 'Test User',
      phone: '0123456789',
      role: 'user',
      userId: 100001, // 6 số test
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await db.collection('users').doc('test-user-uid').set(userData);
    console.log('✅ Created test user with userId: 100001');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating test user:', error);
    process.exit(1);
  }
}

createTestUser();
