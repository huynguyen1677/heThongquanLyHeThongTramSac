# Owner Portal - Quản lý Trạm Sạc

Owner Portal là ứng dụng web giúp các chủ sở hữu trạm sạc quản lý và cấu hình thông tin trạm sạc của mình.

## 🚀 Tính năng chính

### 🔐 Firebase Authentication
- Đăng nhập bằng email và mật khẩu
- Tự động lưu phiên đăng nhập
- Quản lý profile owner trong Firestore
- Tài khoản demo: `owner1@example.com` / `123456`

### 📊 Quản lý trạm sạc
- **Xem danh sách** tất cả trạm sạc thuộc quyền sở hữu
- **Thêm trạm sạc mới** với thông tin đầy đủ
- **Chỉnh sửa thông tin** trạm sạc (tên, địa chỉ, tọa độ, v.v.)
- **Xóa trạm sạc** không cần thiết
- **Tìm kiếm** trạm sạc theo ID, tên hoặc địa chỉ

### 🔄 Đồng bộ dữ liệu
- **Tự động đồng bộ** từ Firebase Realtime Database sang Firestore
- **Lắng nghe realtime** trạng thái hoạt động của trạm sạc
- **Hiển thị trạng thái** connector theo thời gian thực

### 📍 Quản lý vị trí
- **Nhập địa chỉ** đầy đủ cho trạm sạc
- **Cấu hình tọa độ** GPS (latitude, longitude)
- **Hướng dẫn** lấy tọa độ từ Google Maps

## 🛠️ Cài đặt và chạy

1. **Cài đặt dependencies:**
```bash
cd owner-portal
npm install
```

2. **Cấu hình Firebase:**
- Cập nhật thông tin Firebase trong `src/services/firebase.js`
- Đảm bảo có quyền truy cập Firestore và Realtime Database
- **Tạo tài khoản demo trong Firebase Console:**
  - Vào Firebase Console > Authentication > Users
  - Click "Add user" 
  - Email: `owner1@example.com`, Password: `123456`
  - Tạo document trong Firestore collection `owners` với thông tin owner

3. **Chạy ứng dụng:**
```bash
npm run dev
```

4. **Truy cập:**
- Mở trình duyệt và vào: `http://localhost:3002`

## 📋 Cấu trúc dữ liệu

### Firestore Collection: `owners`
```json
{
  "uid_của_user": {
    "ownerId": "OWNER_001",
    "name": "Nguyễn Văn A", 
    "email": "owner1@example.com",
    "phone": "+84901234567",
    "address": "123 Đường Lê Lợi, Quận 1, TP.HCM",
    "role": "owner",
    "active": true,
    "createdAt": "2025-08-19T10:00:00Z"
  }
}
```

### Firestore Collection: `stations`
```json
{
  "stationId": {
    "id": "CP_HCM_001",
    "ownerId": "OWNER_001",
    "stationName": "Trạm sạc Vincom Center",
    "address": "72 Lê Thánh Tôn, Quận 1, TP.HCM",
    "latitude": 10.7769,
    "longitude": 106.7009,
    "vendor": "SIM",
    "model": "SIM-X",
    "firmwareVersion": "1.0.0",
    "status": "online",
    "connectors": {
      "1": {
        "status": "Available",
        "errorCode": "NoError",
        "lastUpdate": "2024-01-20T10:30:00Z"
      },
      "2": {
        "status": "Charging",
        "errorCode": "NoError",
        "lastUpdate": "2024-01-20T10:30:00Z"
      }
    },
    "createdAt": "2024-01-20T10:00:00Z",
    "updatedAt": "2024-01-20T10:30:00Z"
  }
}
```

### Firebase Realtime Database: `live/stations`
```json
{
  "live": {
    "stations": {
      "CP_HCM_001": {
        "online": true,
        "lastHeartbeat": "2024-01-20T10:30:00Z",
        "connectors": {
          "1": {
            "status": "Available",
            "errorCode": "NoError",
            "lastUpdate": "2024-01-20T10:30:00Z"
          },
          "2": {
            "status": "Charging",
            "errorCode": "NoError", 
            "lastUpdate": "2024-01-20T10:30:00Z"
          }
        }
      }
    }
  }
}
```

## 🔄 Quy trình đồng bộ dữ liệu

1. **OCPP Simulator** gửi dữ liệu qua WebSocket đến **CSMS**
2. **CSMS** cập nhật **Firebase Realtime Database**
3. **Owner Portal** lắng nghe thay đổi từ **Realtime Database**
4. **Owner Portal** có thể đồng bộ dữ liệu sang **Firestore** để lưu trữ lâu dài
5. **Driver App** sử dụng dữ liệu từ **Firestore** để hiển thị thông tin trạm sạc

## 📱 Tích hợp với Driver App

Dữ liệu được tạo trong Owner Portal sẽ có đầy đủ thông tin cần thiết cho Driver App:

- **Tên trạm sạc**: Hiển thị tên thân thiện
- **Địa chỉ**: Hiển thị vị trí cụ thể
- **Tọa độ GPS**: Để hiển thị trên bản đồ và điều hướng
- **Trạng thái realtime**: Connector có sẵn hay đang sạc
- **Thông tin thiết bị**: Vendor, model, firmware

## 🔒 Bảo mật

- Sử dụng **Firebase Authentication** để quản lý tài khoản
- Mỗi Owner chỉ có thể xem và quản lý trạm sạc của mình (filter theo `ownerId`)
- **Phân quyền dựa trên UID** của Firebase Authentication
- Profile owner được lưu trong Firestore collection `owners`
- Tự động tạo profile mặc định nếu chưa có khi đăng nhập lần đầu

## 🚀 Mở rộng tương lai

- **Dashboard analytics**: Thống kê doanh thu, lượt sử dụng
- **Quản lý giá cả**: Cấu hình giá sạc theo thời gian
- **Báo cáo**: Xuất báo cáo sử dụng, doanh thu
- **Thông báo**: Alert khi trạm lỗi hoặc cần bảo trì
- **Multi-tenant**: Hỗ trợ nhiều owner, phân quyền chi tiết

## 💡 Lưu ý sử dụng

1. **Đồng bộ dữ liệu**: Chỉ chạy một lần khi có dữ liệu mới từ Realtime Database
2. **Station ID**: Phải unique, không được trùng lặp
3. **Tọa độ GPS**: Không bắt buộc nhưng cần thiết cho Driver App
4. **Realtime monitoring**: Dữ liệu trạng thái được cập nhật tự động từ OCPP

Ứng dụng được thiết kế để dễ sử dụng và mở rộng, phù hợp cho việc quản lý hệ thống trạm sạc quy mô nhỏ đến trung bình.
