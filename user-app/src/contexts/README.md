# Hướng dẫn tổ chức ChargingContext

## Mục tiêu

Tách nhỏ logic của ChargingContext thành các custom hook riêng biệt, mỗi hook chỉ quản lý một mảng chức năng.  
Việc này giúp code dễ bảo trì, dễ mở rộng, dễ test và dễ tái sử dụng.

---

## Cấu trúc đề xuất

- **ChargingContext.jsx**  
  Gom tất cả các hook lại, cung cấp context cho toàn app.

- **useStations.js**  
  Quản lý danh sách trạm, realtime cập nhật trạng thái trạm và connector.

- **useChargingSession.js**  
  Quản lý phiên sạc hiện tại, realtime cập nhật phiên sạc.

- **useChargingHistory.js**  
  Lịch sử sạc của user.

- **usePrice.js**  
  Giá điện và lắng nghe thay đổi giá.

- **useConfirmationRequest.js**  
  Lắng nghe và phản hồi xác nhận sạc.

---

## Lợi ích

- **Dễ bảo trì:** Mỗi file chỉ lo một nhiệm vụ.
- **Dễ mở rộng:** Thêm tính năng mới chỉ cần thêm hook mới.
- **Dễ test:** Có thể test từng hook riêng biệt.
- **Dễ tái sử dụng:** Có thể dùng lại logic ở các component khác nếu cần.

---

## Cách sử dụng

- Trong `ChargingContext.jsx`, import các hook này và gom lại thành một context duy nhất.
- Khi cần truy cập dữ liệu hoặc hàm xử lý, chỉ cần dùng `useCharging()` như cũ.

---

## Ví dụ cấu trúc thư mục

```
contexts/
  ChargingContext.jsx
  useStations.js
  useChargingSession.js
  useChargingHistory.js
  usePrice.js
  useConfirmationRequest.js
  README.md
```

---

## Khi cần giải thích hoặc hướng dẫn về tổ chức context, chỉ cần mở file