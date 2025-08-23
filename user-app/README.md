# EV Charging User App

Ứng dụng web dành cho người dùng cuối để sạc xe điện và quản lý phiên sạc.

## 🚀 Tính năng chính

### Cho người dùng cuối:
- **Tìm trạm sạc**: Xem danh sách trạm sạc có sẵn với thông tin chi tiết
- **Chọn cổng sạc**: Xem trạng thái từng cổng sạc (có sẵn, đang sạc, không khả dụng)
- **Bắt đầu sạc**: Khởi tạo phiên sạc với tùy chọn mục tiêu năng lượng
- **Theo dõi real-time**: Xem tiến trình sạc, năng lượng tiêu thụ, chi phí
- **Dừng sạc**: Kết thúc phiên sạc khi cần
- **Lịch sử sạc**: Xem lại các phiên sạc đã thực hiện
- **Quản lý tài khoản**: Cập nhật thông tin cá nhân

### Tích hợp:
- **Firebase Authentication**: Đăng nhập/đăng ký an toàn
- **Firestore**: Lưu trữ dữ liệu phiên sạc và thông tin user
- **Firebase Realtime Database**: Cập nhật trạng thái real-time
- **CSMS API**: Kết nối với hệ thống quản lý trạm sạc

## 🛠️ Công nghệ sử dụng

- **Frontend**: React 18 với Vite
- **Routing**: React Router DOM
- **State Management**: React Context API
- **Styling**: CSS thuần túy (không dùng thư viện CSS)
- **Database**: Firebase Firestore & Realtime Database
- **Authentication**: Firebase Auth
- **HTTP Client**: Axios
- **Date Handling**: date-fns

## 📦 Cài đặt và chạy

### 1. Cài đặt dependencies
```bash
cd user-app
npm install
```

### 2. Cấu hình Firebase
Tạo file `.env` từ `.env.example` và cập nhật thông tin Firebase:

```env
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_DATABASE_URL=https://your_project_id-default-rtdb.asia-southeast1.firebasedatabase.app
VITE_API_BASE_URL=http://localhost:3001/api
```

### 3. Khởi chạy ứng dụng
```bash
npm run dev
```

Ứng dụng sẽ chạy tại `http://localhost:3003`

## 🏗️ Cấu trúc dự án

```
user-app/
├── src/
│   ├── components/          # Shared components
│   │   └── Header.jsx      # Navigation header
│   ├── contexts/           # React contexts
│   │   ├── AuthContext.jsx # Authentication state
│   │   └── ChargingContext.jsx # Charging state
│   ├── pages/              # Page components
│   │   ├── Home.jsx        # Trang chủ
│   │   ├── Stations.jsx    # Danh sách trạm sạc
│   │   ├── ChargingSession.jsx # Chi tiết phiên sạc
│   │   ├── History.jsx     # Lịch sử sạc
│   │   ├── Profile.jsx     # Thông tin tài khoản
│   │   └── Login.jsx       # Đăng nhập/đăng ký
│   ├── services/           # External services
│   │   ├── firebase.js     # Firebase configuration
│   │   └── api.js          # API service
│   ├── App.jsx             # Main App component
│   ├── main.jsx            # Entry point
│   └── index.css           # Global styles
├── index.html              # HTML template
├── package.json            # Dependencies
├── vite.config.js          # Vite configuration
└── .env.example            # Environment variables template
```

## 🎯 Luồng hoạt động

### 1. Đăng nhập/Đăng ký
- User đăng ký/đăng nhập qua Firebase Auth
- Thông tin user được lưu trong Firestore
- Context cập nhật global state

### 2. Tìm trạm sạc
- Load danh sách trạm từ CSMS API
- Real-time updates từ Firebase Realtime Database
- Filter theo trạng thái, loại sạc, vị trí

### 3. Bắt đầu sạc
- Chọn trạm và cổng sạc
- Tạo phiên sạc trong Firestore
- Gửi lệnh start charging đến CSMS
- Real-time tracking qua Firebase

### 4. Theo dõi phiên sạc
- Hiển thị năng lượng, thời gian, chi phí real-time
- Progress bar dựa trên mục tiêu năng lượng
- Cập nhật từ CSMS qua Realtime Database

### 5. Kết thúc sạc
- Gửi lệnh stop charging đến CSMS
- Cập nhật trạng thái phiên sạc trong Firestore
- Chuyển hướng đến lịch sử

## 🔥 Firebase Collections

### users
```javascript
{
  email: string,
  name: string,
  phone: string,
  createdAt: timestamp,
  updatedAt: timestamp
}
```

### chargingSessions
```javascript
{
  userId: string,
  userEmail: string,
  userName: string,
  stationId: string,
  stationName: string,
  stationAddress: string,
  connectorId: number,
  connectorType: string,
  power: number,
  pricePerKwh: number,
  startTime: timestamp,
  endTime: timestamp,
  status: string, // 'Charging', 'Completed', 'Cancelled', 'Failed'
  energyConsumed: number,
  estimatedCost: number,
  duration: number,
  targetEnergy: number,
  paymentMethod: string,
  transactionId: string
}
```

## 📱 Responsive Design

- Mobile-first approach
- Breakpoints: 640px (sm), 768px (md), 1024px (lg)
- Touch-friendly interface
- Accessible navigation

## 🔒 Bảo mật

- Firebase Authentication
- API requests với authentication headers
- Input validation
- XSS protection
- HTTPS only in production

## 🚦 API Integration

Kết nối với CSMS API endpoints:
- `GET /api/stations` - Lấy danh sách trạm
- `POST /api/stations/:id/start` - Bắt đầu sạc
- `POST /api/stations/:id/stop` - Dừng sạc
- `GET /api/chargingSessions/user/:id` - Lịch sử sạc

## 🔄 Real-time Updates

Sử dụng Firebase Realtime Database để:
- Cập nhật trạng thái trạm sạc
- Theo dõi phiên sạc real-time
- Đồng bộ dữ liệu giữa các thiết bị

## 📈 Performance

- Code splitting với React.lazy
- Optimized re-renders với useMemo/useCallback
- Efficient Firebase queries
- Image optimization
- Minimal bundle size với Vite

## 🧪 Testing

```bash
# Run linting
npm run lint

# Build for production
npm run build

# Preview production build
npm run preview
```

## 🚀 Deployment

1. Build ứng dụng:
```bash
npm run build
```

2. Deploy `dist/` folder lên hosting service (Netlify, Vercel, Firebase Hosting)

3. Cấu hình environment variables trên hosting platform

## 🤝 Contributing

1. Fork repository
2. Create feature branch
3. Make changes
4. Test thoroughly
5. Submit pull request

## 📄 License

MIT License - xem file LICENSE để biết chi tiết.
