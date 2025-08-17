# Realtime Service - Cấu Trúc Mới

Đã cập nhật `realtime.js` theo cấu trúc mới cho phép theo dõi trạm sạc realtime cho cả User và Owner.

## Cấu Trúc Firebase Realtime Database

```
/live/
  stations/
    {stationId}/
      online: boolean                // true nếu WS còn sống
      lastHeartbeat: number          // epoch millis
      ownerId: string               // ID của chủ trạm
      stationName: string           // tên trạm (optional)
      vendor: string                // nhà sản xuất (optional)
      model: string                 // model trạm (optional)
      firmwareVersion: string       // version firmware (optional)
      connectors/
        {connectorId}/
          status: "Available"|"Preparing"|"Charging"|"Finishing"|"Unavailable"|"Faulted"
          errorCode: string         // "NoError" | ...
          txId: number|null         // ID transaction hiện tại
          Wh_total: number          // tổng Wh lũy kế (>=0)
          W_now: number             // công suất hiện tại (W)
          lastUpdate: number        // epoch millis (server time)
          // Tự động tính cho UI:
          kwh: number               // Wh_total/1000 (kWh)
          costEstimate: number      // kwh*price, làm tròn (VND)
```

## Các API Methods Mới

### Station Management
```javascript
// Cập nhật trạng thái online/offline của station
await realtimeService.updateStationOnline(stationId, isOnline, stationInfo);

// Cập nhật heartbeat
await realtimeService.updateStationHeartbeat(stationId);

// Cập nhật thông tin station
await realtimeService.updateStationInfo(stationId, {
  ownerId: "owner123",
  stationName: "Trạm sạc ABC",
  vendor: "ABB",
  model: "Terra AC",
  firmwareVersion: "1.2.3"
});
```

### Connector Management
```javascript
// Cập nhật trạng thái connector với energy data
await realtimeService.updateConnectorStatus(stationId, connectorId, {
  status: "Charging",
  errorCode: "NoError",
  txId: 12345,
  Wh_total: 5500,  // 5.5 kWh
  W_now: 7000      // 7 kW
});

// Chỉ cập nhật meter values
await realtimeService.updateConnectorMeterValues(stationId, connectorId, {
  Wh_total: 5500,
  W_now: 7000
});

// Cập nhật transaction ID
await realtimeService.updateConnectorTransaction(stationId, connectorId, transactionId);
```

### Listeners (Realtime Updates)

```javascript
// Admin: Theo dõi tất cả stations
realtimeService.listenToAllStationsLiveData((allData) => {
  console.log("All stations update:", allData);
});

// Owner: Theo dõi chỉ stations của mình
realtimeService.listenToOwnerStations(ownerId, (ownerData) => {
  console.log("Owner stations update:", ownerData);
});

// User: Theo dõi một station cụ thể
realtimeService.listenToStationLiveData(stationId, (stationData) => {
  console.log("Station update:", stationData);
});

// Theo dõi một connector trong transaction
realtimeService.listenToConnectorLiveData(stationId, connectorId, (connectorData) => {
  console.log("Connector update:", connectorData);
});
```

## Helper Functions

Sử dụng `RealtimeHelper` để xử lý data phức tạp:

```javascript
import { RealtimeHelper } from '../utils/realtimeHelper.js';

// Lấy snapshot tất cả live data
const allData = await RealtimeHelper.getAllLiveDataSnapshot();

// Lấy data của một owner
const ownerData = await RealtimeHelper.getOwnerStationsSnapshot(ownerId);

// Check availability của station
const availability = await RealtimeHelper.checkStationAvailability(stationId);

// Listen với processed data
RealtimeHelper.listenForAdminDashboard((summary) => {
  console.log("Processed admin data:", summary);
});

RealtimeHelper.listenForOwnerDashboard(ownerId, (summary) => {
  console.log("Processed owner data:", summary);
});
```

## Integration với OCPP Sessions

Code đã được cập nhật trong `sessions.js`:

```javascript
// Khi tạo station
const station = sessions.createStation(stationId, websocket, {
  ownerId: "owner123",
  stationName: "Trạm ABC",
  vendor: "ABB",
  model: "Terra AC"
});

// Khi cập nhật connector status
sessions.updateConnectorStatus(stationId, connectorId, {
  status: "Charging",
  errorCode: "NoError",
  Wh_total: 5500,
  W_now: 7000
});

// Khi có meter values mới
sessions.addMeterValues(stationId, connectorId, meterValues, transactionId);
```

## Demo API Endpoints

Xem file `realtimeDemo.js` để có ví dụ về:

1. **Admin Dashboard API** - Xem tất cả stations
2. **Owner Dashboard API** - Xem stations của owner
3. **User App APIs** - Tìm stations available, xem detail
4. **Charging Session API** - Theo dõi session realtime
5. **WebSocket Integration** - Realtime updates qua WebSocket

## Tính Năng Chính

### Cho Admin:
- Theo dõi tất cả stations trong hệ thống
- Thống kê tổng quan: online/offline, charging/available
- Theo dõi tổng công suất hiện tại
- Số lượng transactions đang active

### Cho Owner:
- Chỉ thấy stations thuộc sở hữu
- Theo dõi doanh thu realtime từ charging sessions
- Thống kê stations online/offline của mình
- Chi tiết từng connector

### Cho User:
- Tìm stations available gần đó
- Xem chi tiết station và connector availability
- Theo dõi charging session realtime (năng lượng, công suất, chi phí)
- Cập nhật live khi đang sạc

## Price Management

```javascript
// Set giá điện
realtimeService.setPricePerKwh(2500); // VND per kWh

// Get giá hiện tại
const currentPrice = realtimeService.getPricePerKwh();
```

Cost estimate sẽ được tự động tính toán: `kwh * pricePerKwh`

## Cleanup & Maintenance

```javascript
// Tự động cleanup data cũ
await realtimeService.cleanupExpiredData();

// Remove station khi offline lâu
await realtimeService.removeStationFromLive(stationId);

// Remove connector
await realtimeService.removeConnectorFromLive(stationId, connectorId);
```

## Migration từ Code Cũ

1. Cập nhật calls từ `updateStationStatus` → `updateStationOnline`
2. Cập nhật calls từ `updateConnectorStatus` với energy data
3. Sử dụng `RealtimeHelper` cho complex data processing
4. Cập nhật listeners để sử dụng cấu trúc `/live/stations`

Cấu trúc mới cho phép:
- **Scalability**: Dễ dàng filter theo owner
- **Performance**: Ít data redundancy  
- **User Experience**: Realtime updates với cost estimation
- **Admin Control**: Full visibility cho admin, restricted cho owner/user
