// Format tiền VND
export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
};

// Format số với phân cách hàng nghìn
export const formatNumber = (number) => {
  return new Intl.NumberFormat('vi-VN').format(number);
};

// Format năng lượng (kWh)
export const formatEnergy = (kWh) => {
  return `${kWh.toFixed(3)} kWh`;
};

// Format công suất (kW)
export const formatPower = (kW) => {
  return `${kW.toFixed(1)} kW`;
};

// Format thời gian từ timestamp
export const formatDateTime = (timestamp) => {
  if (!timestamp) return 'N/A';
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  return date.toLocaleString('vi-VN');
};

// Format thời gian (alias cho formatDateTime)
export const formatTime = (timestamp) => {
  return formatDateTime(timestamp);
};

// Format khoảng thời gian (ví dụ: "2 giờ trước")
export const formatRelativeTime = (timestamp) => {
  if (!timestamp) return 'N/A';
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  const now = new Date();
  const diffMs = now - date;
  const diffMinutes = Math.floor(diffMs / 60000);
  
  if (diffMinutes < 1) return 'Vừa xong';
  if (diffMinutes < 60) return `${diffMinutes} phút trước`;
  
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours} giờ trước`;
  
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} ngày trước`;
};

// Format thời lượng sạc (milliseconds -> HH:mm:ss)
export const formatDuration = (ms) => {
  const seconds = Math.floor(ms / 1000);
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  if (hours > 0) {
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

// Format trạng thái connector
export const formatConnectorStatus = (status) => {
  const statusMap = {
    'Available': { text: 'Sẵn sàng', color: 'green', emoji: '🟢' },
    'Preparing': { text: 'Chuẩn bị', color: 'yellow', emoji: '🟡' },
    'Charging': { text: 'Đang sạc', color: 'blue', emoji: '🔵' },
    'SuspendedEVSE': { text: 'Tạm dừng', color: 'orange', emoji: '🟠' },
    'SuspendedEV': { text: 'Tạm dừng (xe)', color: 'orange', emoji: '🟠' },
    'Finishing': { text: 'Kết thúc', color: 'purple', emoji: '🟣' },
    'Reserved': { text: 'Đã đặt', color: 'cyan', emoji: '🔷' },
    'Unavailable': { text: 'Không khả dụng', color: 'gray', emoji: '⚫' },
    'Faulted': { text: 'Lỗi', color: 'red', emoji: '🔴' }
  };
  
  return statusMap[status] || { text: status, color: 'gray', emoji: '⚪' };
};
