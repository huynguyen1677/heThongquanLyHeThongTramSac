# Payment System - Hệ thống Thanh toán CSMS

Hệ thống xử lý thanh toán tự động khi kết thúc phiên sạc, tính toán chi phí và trừ tiền từ tài khoản user.

## Cấu trúc File

```
src/
├── payments/
│   ├── paymentProcessor.js    # Xử lý thanh toán chính
│   ├── costCalculator.js      # Tính toán chi phí
│   ├── balanceUpdater.js      # Cập nhật số dư user
│   └── index.js               # Export tổng hợp
├── models/
│   ├── user.js                # Model user (số dư)
│   └── transaction.js         # Model transaction
└── services/
    └── realtime.js            # Tích hợp thanh toán (đã update)
```

## Luồng Xử Lý Thanh toán

### 1. Khi Kết thúc Phiên Sạc
```javascript
// Trong realtime.js - method stopTransaction
await this.processSessionPayment({
  userId: connectorData.userId,
  transactionId,
  stationId,
  connectorId,
  sessionCost: connectorData.session_cost,
  energyConsumed: connectorData.session_kwh,
  finalWhTotal: connectorData.Wh_total
});
```

### 2. Xử lý Thanh toán
```javascript
// PaymentProcessor.processSessionPayment() thực hiện:
// - Lấy dữ liệu phiên sạc từ Firestore
// - Tính toán chi phí chi tiết
// - Kiểm tra số dư user
// - Trừ tiền và cập nhật số dư
// - Lưu lịch sử thanh toán
// - Cập nhật trạng thái transaction
```

## Cách Sử Dụng

### Import và Sử dụng
```javascript
import { PaymentProcessor, processChargingSessionPayment } from '../payments/index.js';

// Xử lý thanh toán khi kết thúc session
const result = await processChargingSessionPayment({
  userId: 'user123',
  transactionId: 'tx456',
  sessionCost: 15000, // VND
  stationId: 'station1',
  connectorId: 1,
  energyConsumed: 5.5 // kWh
});

if (result.success) {
  console.log('Payment success:', result.payment.newBalance);
} else {
  console.log('Payment failed:', result.error);
}
```

### Kiểm tra Số dư Trước Khi Sạc
```javascript
import { checkUserBalance } from '../payments/index.js';

const balanceCheck = await checkUserBalance('user123', 20000);
if (!balanceCheck.sufficient) {
  console.log('Insufficient balance');
}
```

### Xử lý Hoàn tiền
```javascript
import { processRefund } from '../payments/index.js';

const refundResult = await processRefund({
  userId: 'user123',
  transactionId: 'tx456',
  reason: 'Service error',
  amount: 15000
});
```

## Tính toán Chi phí

### CostCalculator
- **Năng lượng**: `energyConsumed * pricePerKwh`
- **Phí dịch vụ**: `5%` của chi phí năng lượng
- **Thuế VAT**: `10%` của subtotal
- **Tổng**: `energyCost + serviceFee + tax`

### Ví dụ tính toán:
```
Năng lượng: 5.5 kWh × 3000 VND/kWh = 16,500 VND
Phí dịch vụ: 16,500 × 5% = 825 VND
Subtotal: 16,500 + 825 = 17,325 VND
Thuế VAT: 17,325 × 10% = 1,732.5 VND
Tổng cộng: 17,325 + 1,732.5 = 19,057.5 VND
```

## Tích hợp với Realtime Service

### Tự động thanh toán khi kết thúc phiên sạc:
```javascript
// Khi gọi stopTransaction với shouldProcessPayment = true
await realtimeService.stopTransaction(stationId, connectorId, transactionId, true);
```

### Kiểm tra số dư trước khi bắt đầu:
```javascript
const balanceCheck = await realtimeService.checkUserBalanceForCharging(userId, estimatedCost);
```

### Lấy lịch sử thanh toán:
```javascript
const history = await realtimeService.getPaymentHistory(userId, 20);
```

## Dữ liệu Firestore

### Collection `users`
```javascript
{
  id: "user123",
  balance: 50000, // VND
  lastUpdated: "2025-09-08T10:30:00Z"
}
```

### Collection `transactions`
```javascript
{
  id: "tx456",
  userId: "user123",
  stationId: "station1",
  connectorId: 1,
  energyConsumed: 5.5,
  cost: 19057.5,
  paymentStatus: "paid",
  paymentTime: "2025-09-08T10:30:00Z"
}
```

### Collection `payment_history`
```javascript
{
  id: "payment789",
  userId: "user123",
  type: "payment", // hoặc "refund"
  amount: 19057.5,
  previousBalance: 50000,
  newBalance: 30942.5,
  transactionId: "tx456",
  status: "completed",
  createdAt: "2025-09-08T10:30:00Z"
}
```

## Error Handling

### Các lỗi thường gặp:
- `User not found`: User không tồn tại
- `Insufficient balance`: Số dư không đủ
- `Transaction not found`: Không tìm thấy transaction
- `Cost validation failed`: Lỗi validation chi phí
- `Payment system error`: Lỗi hệ thống

### Xử lý lỗi:
```javascript
try {
  const result = await processChargingSessionPayment(paymentData);
  if (!result.success) {
    // Xử lý lỗi business logic
    console.error('Payment failed:', result.error);
  }
} catch (error) {
  // Xử lý lỗi hệ thống
  console.error('System error:', error.message);
}
```

## Configuration

### Cấu hình giá điện trong Firestore:
```javascript
// Collection: configuration, Document: pricePerKwh
{
  value: 3000, // VND per kWh
  lastUpdated: "2025-09-08T10:30:00Z"
}
```

### Cấu hình phí dịch vụ:
```javascript
// Collection: configuration, Document: serviceFeeRate
{
  value: 0.05, // 5%
  lastUpdated: "2025-09-08T10:30:00Z"
}
```

### Cấu hình thuế:
```javascript
// Collection: configuration, Document: taxRate
{
  value: 0.1, // 10% VAT
  lastUpdated: "2025-09-08T10:30:00Z"
}
```

## Logs và Monitoring

### Logs quan trọng:
- `Payment processed successfully`
- `Insufficient balance detected`
- `Cost validation failed`
- `Transaction payment updated`

### Realtime notifications:
- `payment_success`: Thanh toán thành công
- `payment_failed`: Thanh toán thất bại
- `payment_error`: Lỗi hệ thống thanh toán

## Testing

### Test case cơ bản:
1. User có đủ số dư → Thanh toán thành công
2. User không đủ số dư → Trả về lỗi insufficient balance
3. Transaction không tồn tại → Trả về lỗi transaction not found
4. Chi phí = 0 → Bỏ qua thanh toán
5. User không tồn tại → Trả về lỗi user not found

### Mock data cho test:
```javascript
const mockPaymentData = {
  userId: 'test_user',
  transactionId: 'test_tx',
  sessionCost: 15000,
  stationId: 'test_station',
  connectorId: 1,
  energyConsumed: 5.0
};
```
