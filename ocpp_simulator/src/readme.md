OCPP Simulator - Documentation
📋 Tổng quan dự án
Đây là một ứng dụng mô phỏng trạm sạc xe điện sử dụng giao thức OCPP 1.6-J (Open Charge Point Protocol). Ứng dụng được xây dựng bằng React và cho phép mô phỏng các hoạt động của trạm sạc thực tế.

🏗️ Kiến trúc hệ thống
Nguyên tắc phân tách:
Services: Xử lý logic nghiệp vụ thuần túy
Hooks: Quản lý React state và kết nối với services
Components: Chỉ hiển thị UI và xử lý user interactions
📁 Services Layer
🔌 OcppClient.js
Chức năng: Core WebSocket client để kết nối với OCPP server

Quản lý kết nối WebSocket
Xử lý tin nhắn OCPP (CALL, CALLRESULT, CALLERROR)
Tự động reconnect khi mất kết nối
Event handlers cho connection status và messages
Methods chính:

⚡ MeterService.js
Chức năng: Quản lý việc đo lường năng lượng và gửi meter values

Tính toán năng lượng tiêu thụ theo thời gian thực
Gửi MeterValues và DataTransfer messages
Quản lý trạng thái sạc (start/stop/pause/resume)
Kiểm tra điều kiện sạc đầy
Dependencies:

EnergyCalculator: Tính toán năng lượng
ChargingTimer: Quản lý thời gian sạc
PricingService: Tính toán giá tiền
ChargingStateManager: Quản lý trạng thái sạc
Methods chính:

🔧 EnergyCalculator.js
Chức năng: Các phép tính liên quan đến năng lượng

Tính toán công suất hiện tại theo thời gian
Chuyển đổi đơn vị (Wh ↔ kWh)
Tính năng lượng tiêu thụ theo công suất và thời gian
⏱️ ChargingTimer.js
Chức năng: Quản lý thời gian sạc

Start/stop/pause/resume timer
Theo dõi thời gian sạc đã trôi qua
Thực thi callback theo interval
💰 PricingService.js
Chức năng: Quản lý giá điện và tính toán chi phí

Lấy giá điện từ API
Tính toán chi phí dựa trên năng lượng tiêu thụ
Cập nhật giá điện động
🔋 ChargingStateManager.js
Chức năng: Quản lý trạng thái sạc

Kiểm tra điều kiện sạc đầy
Tính phần trăm sạc
Quản lý ngưỡng sạc đầy
🎣 Hooks Layer
🔌 useOcppClient.js
Chức năng: Quản lý kết nối OCPP và WebSocket state

Wrapper cho OcppClient service
Quản lý connection status trong React state
Provide các functions để gửi OCPP messages
Returns:

📡 useStatusNotification.js
Chức năng: Gửi StatusNotification và cập nhật connector state

Tạo payload StatusNotification
Gửi qua sendCall function
Cập nhật React state
Ghi log
Usage:

🔌 useConnectors.js (Cần tạo)
Chức năng: Quản lý danh sách connectors và MeterServices

Khởi tạo connectors
Tạo MeterService cho mỗi connector
Provide functions để cập nhật connector state
🔄 useTransactionManager.js (Cần tạo)
Chức năng: Quản lý transactions (start/stop charging)

Wrapper cho TransactionService
Quản lý MeterService lifecycle
Xử lý transaction state trong React
📝 useLogs.js
Chức năng: Quản lý system logs

Lưu trữ logs trong React state
Provide function để thêm log mới
Giới hạn số lượng logs tối đa
🔒 useSafetyCheck.js
Chức năng: Xử lý safety checks trước khi sạc

Validate các điều kiện an toàn
Gửi StatusNotification với safety check data
📊 useChargingSession.js
Chức năng: Quản lý session data sau khi hoàn thành sạc

Lưu lịch sử sạc
Xuất dữ liệu session
Cập nhật UI sau khi sạc xong
🎨 Components Layer
📱 App.jsx
Chức năng: Component chính, orchestrator của toàn bộ ứng dụng

Quản lý global state
Kết nối các hooks
Xử lý events từ child components
Key responsibilities:

Kết nối/ngắt kết nối OCPP server
Khởi tạo connectors
Quản lý station configuration
Export logs
🔌 ConnectorCard.jsx
Chức năng: UI cho từng connector

Hiển thị trạng thái connector
Safety checks UI
Controls để start/stop charging
Hiển thị charging statistics
Key features:

Safety check buttons (xe đỗ, cáp cắm, xác nhận)
User ID input
Power control
Charging progress display
Status control buttons
🏠 LeftPanel.jsx
Chức năng: Panel cấu hình và kết nối

Form cấu hình station
Connect/disconnect controls
Logs export
🏢 MiddlePanel.jsx
Chức năng: Hiển thị danh sách connectors

Render ConnectorCard components
Pass props từ App xuống ConnectorCard
📊 LogConsole.jsx
Chức năng: Hiển thị system logs

Real-time log display
Log filtering
Auto-scroll
📋 Schemas Layer
🔍 ocpp.js
Chức năng: Validation schemas cho OCPP messages

Zod schemas cho từng loại OCPP message
Validate data trước khi gửi/sau khi nhận
Ensure đúng chuẩn OCPP 1.6-J
🔄 Luồng hoạt động chính
1. Kết nối OCPP Server
2. Khởi tạo Connectors
3. Safety Check Process
4. Start Charging
5. Meter Values Process
6. Stop Charging
🐛 Debugging & Common Issues
❌ "this.ocppClient.sendCall is not a function"
Nguyên nhân: Services đang cố gọi method trên instance không tồn tại Giải pháp: Sử dụng sendCall function từ hooks thay vì ocppClient instance

❌ "WebSocket connection failed"
Nguyên nhân: OCPP server không khả dụng hoặc URL sai Giải pháp: Kiểm tra server đang chạy và URL đúng

❌ Stats không cập nhật
Nguyên nhân: MeterService chưa được start hoặc useEffect dependencies sai Giải pháp: Đảm bảo transaction đã start và dependencies đúng

🔧 Maintenance & Extension
Thêm OCPP Action mới
Thêm schema vào ocpp.js
Thêm method vào service tương ứng
Tạo hook wrapper nếu cần
Update UI components
Thêm Connector Feature mới
Update MeterService với logic mới
Update ConnectorCard UI
Update useConnectors nếu cần state mới
Debug Performance
Kiểm tra timer intervals
Kiểm tra memory leaks trong useEffect
Optimize re-renders với useMemo/useCallback
📚 Dependencies chính
React: UI framework
WebSocket: OCPP communication
Zod: Schema validation
JavaScript ES6+: Core language features
🚀 Future Improvements
Unit Tests: Thêm tests cho services và hooks
Error Boundaries: Better error handling trong React
Persistent Storage: Lưu session data vào localStorage
Real-time Dashboard: WebSocket cho real-time updates
Multi-language: Internationalization support