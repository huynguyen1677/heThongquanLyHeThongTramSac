/**
 * Script to create test payment data in Firestore
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, Timestamp } from 'firebase/firestore';

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyDF_nhW4eX8yZIMxJH0CIWBxz5JlrCQaVk",
  authDomain: "hethongquanlytramsacxe.firebaseapp.com",
  databaseURL: "https://hethongquanlytramsacxe-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "hethongquanlytramsacxe",
  storageBucket: "hethongquanlytramsacxe.firebasestorage.app",
  messagingSenderId: "307955847766",
  appId: "1:307955847766:web:280433eaec4ebb51ed21f7"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function createTestPaymentData() {
  try {
    console.log('🏗️ Creating test payment data...');
    
    const testPayments = [];
    const now = new Date();
    
    // Create 10 test payments over the last 7 days
    for (let i = 0; i < 10; i++) {
      const daysAgo = Math.floor(Math.random() * 7);
      const paymentDate = new Date(now);
      paymentDate.setDate(paymentDate.getDate() - daysAgo);
      
      const payment = {
        sessionId: `TEST_SESSION_${1000 + i}`,
        userId: `user_${Math.floor(Math.random() * 100)}`,
        stationId: `ST_${Math.floor(Math.random() * 5) + 1}`,
        connectorId: Math.floor(Math.random() * 2) + 1,
        amount: Math.round((Math.random() * 50 + 10) * 100) / 100, // 10-60k VND
        energyConsumed: Math.round((Math.random() * 30 + 5) * 100) / 100, // 5-35 kWh
        duration: Math.floor(Math.random() * 120 + 30), // 30-150 minutes
        pricePerKwh: 3500 + Math.floor(Math.random() * 1000), // 3500-4500 VND/kWh
        status: 'completed',
        transactionId: `TXN_${Date.now()}_${i}`,
        createdAt: Timestamp.fromDate(paymentDate),
        updatedAt: Timestamp.fromDate(paymentDate)
      };
      
      testPayments.push(payment);
    }
    
    // Add test payments to Firestore
    console.log('💾 Adding test payments to payment_history collection...');
    for (const payment of testPayments) {
      await addDoc(collection(db, 'payment_history'), payment);
      console.log(`✅ Added payment: ${payment.sessionId} - ${payment.amount} VND`);
    }
    
    console.log('🎉 Test payment data created successfully!');
    console.log(`📊 Total payments added: ${testPayments.length}`);
    
    // Summary
    const totalAmount = testPayments.reduce((sum, p) => sum + p.amount, 0);
    const totalEnergy = testPayments.reduce((sum, p) => sum + p.energyConsumed, 0);
    
    console.log('\n📈 Test Data Summary:');
    console.log(`💰 Total Revenue: ${totalAmount.toLocaleString('vi-VN')} VND`);
    console.log(`⚡ Total Energy: ${totalEnergy.toFixed(2)} kWh`);
    console.log(`📅 Date Range: ${Math.min(...testPayments.map(p => p.createdAt.toDate()))} to ${Math.max(...testPayments.map(p => p.createdAt.toDate()))}`);
    
  } catch (error) {
    console.error('❌ Error creating test data:', error);
  }
}

createTestPaymentData();