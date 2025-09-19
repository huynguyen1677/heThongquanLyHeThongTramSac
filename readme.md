# Hướng dẫn chạy hệ thống OCPP 1.6-J CSMS & Simulator

## 1. Yêu cầu môi trường

- Node.js 18 trở lên
- npm

## 2. Cài đặt dependencies

### CSMS (Server)
```bash
cd csms
npm install
```

### OCPP Simulator (Client)
```bash
cd ../ocpp_simulator
npm install
```

## 3. Cấu hình môi trường

### CSMS
- Tạo file `.env` 
- Chỉnh sửa các biến môi trường trong `.env` cho phù hợp (PORT, OCPP_WS_PORT, Firebase nếu dùng).

### OCPP Simulator
- Có thể cấu hình endpoint WebSocket qua biến môi trường `VITE_OCPP_WS` trong `.env` nếu cần.

## 4. Chạy hệ thống

### Chạy CSMS server
```bash
cd csms
npm run dev      # Chạy chế độ phát triển (auto reload)
# hoặc
npm start        # Chạy chế độ production
```
- API docs: http://localhost:3000
- Health check: http://localhost:3000/health
- OCPP WebSocket: ws://localhost:3001/ocpp/{stationId}

### Chạy OCPP Simulator
```bash
cd ../ocpp_simulator
npm run dev
```
- Truy cập giao diện simulator tại: http://localhost:5173 (hoặc port do Vite chỉ định)

## 5. Kết nối Simulator với CSMS

- Nhập Station ID và Owner ID trên giao diện Simulator.
- Đảm bảo WebSocket URL đúng: `ws://localhost:3001/ocpp/{stationId}`.
- Nhấn "Kết nối" để bắt đầu mô phỏng trạm sạc.
