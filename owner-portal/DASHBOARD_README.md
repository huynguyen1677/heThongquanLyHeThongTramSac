# Dashboard & Thống kê - Owner Portal

## Tính năng mới: Dashboard & Thống kê

Đã thêm tab mới **"📊 Thống kê & Dashboard"** vào Owner Portal với các tính năng sau:

### 🎯 Tính năng chính

#### 1. **Tổng quan Metrics**
- **Tổng doanh thu**: Hiển thị tổng doanh thu với tỷ lệ tăng trưởng
- **Tổng phiên sạc**: Số lượng phiên sạc đã thực hiện
- **Tổng năng lượng**: Lượng điện đã cung cấp (kWh)
- **Trạm hoạt động**: Số trạm đang hoạt động / tổng số trạm

#### 2. **Biểu đồ và Phân tích**
- **📈 Biểu đồ cột doanh thu theo tháng**: Hiển thị xu hướng doanh thu 12 tháng
- **📅 Biểu đồ đường doanh thu hàng ngày**: Chi tiết doanh thu từng ngày trong tháng
- **🏢 Biểu đồ tròn phân bổ doanh thu theo trạm**: Tỷ lệ đóng góp của từng trạm

#### 3. **Bảng hiệu suất trạm sạc**
- Danh sách chi tiết các trạm với:
  - Tỷ lệ sử dụng (thanh progress bar màu sắc)
  - Doanh thu của từng trạm
  - Đánh giá hiệu suất (Xuất sắc/Tốt/Cần cải thiện)

### 🕐 Bộ lọc thời gian
- **7 ngày qua**: Dữ liệu tuần
- **Tháng hiện tại**: Dữ liệu tháng
- **Năm hiện tại**: Dữ liệu năm
- **Chọn tháng/năm cụ thể**: Linh hoạt xem dữ liệu bất kỳ

### 🎨 Giao diện
- **Responsive design**: Tự động điều chỉnh trên mọi thiết bị
- **Cards với gradient**: Hiển thị metrics đẹp mắt với icon và màu sắc
- **Biểu đồ tương tác**: Sử dụng Chart.js với tooltip và animation
- **Bảng hiện đại**: Styling đẹp với progress bar và status badge

### 📱 Responsive
- **Desktop**: Hiển thị đầy đủ tất cả biểu đồ và bảng
- **Tablet**: Grid layout điều chỉnh phù hợp
- **Mobile**: Single column, scroll dọc

## 🛠️ Cài đặt

### Dependencies đã thêm:
```bash
npm install chart.js react-chartjs-2
```

### File mới được tạo:
- `src/components/Dashboard.jsx`: Component chính chứa tất cả tính năng thống kê

### File đã cập nhật:
- `src/App.jsx`: Thêm tab Dashboard và routing
- `package.json`: Thêm dependencies Chart.js

## 📊 Dữ liệu hiển thị

Hiện tại Dashboard sử dụng **dữ liệu mock** để demo. Trong thực tế, cần kết nối với:

### API endpoints cần thiết:
```javascript
// Lấy tổng quan metrics
GET /api/owners/{ownerId}/dashboard/metrics?timeRange={range}

// Lấy doanh thu theo thời gian
GET /api/owners/{ownerId}/dashboard/revenue?timeRange={range}&month={month}&year={year}

// Lấy hiệu suất trạm
GET /api/owners/{ownerId}/dashboard/stations-performance

// Lấy phiên sạc theo thời gian
GET /api/owners/{ownerId}/dashboard/sessions?timeRange={range}
```

### Cấu trúc dữ liệu mong đợi:
```javascript
{
  totalRevenue: 25000000,     // VND
  totalSessions: 1250,        // số phiên
  totalEnergy: 15420,         // kWh
  totalStations: 4,           // số trạm
  activeStations: 3,          // trạm hoạt động
  averageSessionTime: 45,     // phút
  monthlyRevenue: [           // dữ liệu 12 tháng
    { month: "Tháng 1", revenue: 2000000, sessions: 120 },
    // ...
  ],
  dailyRevenue: [             // dữ liệu hàng ngày
    { date: "1/9", revenue: 150000, sessions: 8 },
    // ...
  ],
  stationUsage: [             // hiệu suất trạm
    {
      stationId: "STATION_001",
      name: "Trạm sạc Quận 1", 
      usage: 85,              // % sử dụng
      revenue: 2500000        // doanh thu
    },
    // ...
  ]
}
```

## 🎯 Tính năng tương lai có thể mở rộng

1. **Export báo cáo**: PDF, Excel
2. **So sánh thời gian**: So sánh với cùng kỳ năm trước
3. **Alerts**: Cảnh báo khi doanh thu giảm
4. **Forecasting**: Dự đoán doanh thu tương lai
5. **Real-time updates**: Cập nhật realtime qua WebSocket
6. **Filtering nâng cao**: Lọc theo nhiều tiêu chí
7. **Custom date range**: Chọn khoảng thời gian tùy ý

## 🚀 Cách sử dụng

1. Đăng nhập vào Owner Portal
2. Click vào tab **"📊 Thống kê & Dashboard"**
3. Chọn khoảng thời gian muốn xem
4. Xem các metrics, biểu đồ và bảng hiệu suất
5. Scroll xuống để xem chi tiết hiệu suất từng trạm

Dashboard sẽ giúp chủ sở hữu trạm sạc:
- 📈 Theo dõi doanh thu và xu hướng
- 🎯 Đánh giá hiệu suất từng trạm
- 📊 Ra quyết định kinh doanh dựa trên dữ liệu
- 🔍 Phát hiện cơ hội tối ưu hóa

---

**Lưu ý**: Để Dashboard hoạt động đầy đủ, cần kết nối với backend API thực để lấy dữ liệu thống kê thật.
