// Tạo tài khoản demo trong Firebase Console
// Hoặc sử dụng script này nếu có Firebase Admin SDK

// Demo account để test:
// Email: owner1@example.com
// Password: 123456

// Để tạo tài khoản:
// 1. Vào Firebase Console > Authentication > Users
// 2. Click "Add user"
// 3. Nhập email: owner1@example.com
// 4. Nhập password: 123456
// 5. Click "Add user"

// Sau đó tạo document trong Firestore:
// Collection: owners
// Document ID: [uid của user vừa tạo]
// Data:
/*
{
  "ownerId": "OWNER_001",
  "name": "Nguyễn Văn A",
  "email": "owner1@example.com",
  "phone": "+84901234567",
  "address": "123 Đường Lê Lợi, Quận 1, TP.HCM",
  "role": "owner",
  "active": true,
  "createdAt": "2025-08-19T10:00:00.000Z"
}
*/

console.log('Vui lòng tạo tài khoản demo trong Firebase Console theo hướng dẫn trong file này');
