/**
 * App constants - tập trung tất cả các config có thể thay đổi
 * Giúp dễ dàng maintain và customize
 */

export const APP_CONFIG = {
  name: 'EV Charging Driver App',
  version: '1.0',
  
  // UI Configuration
  sidebar: {
    width: {
      mobile: 320, // 80 * 4 = 320px (w-80)
      desktop: 384 // 96 * 4 = 384px (w-96)
    },
    breakpoint: 768 // md breakpoint
  },

  // Animation timings
  animation: {
    sidebarTransition: 300, // ms
    defaultTransition: 200 // ms
  },

  // Map configuration
  map: {
    defaultZoom: 13,
    maxZoom: 18,
    minZoom: 8
  }
};

export const TAB_CONFIG = [
  { 
    id: 'map', 
    label: 'Bản đồ', 
    icon: 'Map',
    description: 'Tìm và chọn trạm sạc gần bạn'
  },
  { 
    id: 'control', 
    label: 'Điều khiển', 
    icon: 'Zap',
    description: 'Kiểm soát quá trình sạc'
  },
  { 
    id: 'history', 
    label: 'Lịch sử', 
    icon: 'History',
    description: 'Xem lại các phiên sạc trước'
  }
];

export const MESSAGES = {
  loading: {
    app: 'Đang khởi tạo ứng dụng...',
    auth: 'Kiểm tra thông tin xác thực và kết nối Firebase',
    map: 'Đang tải bản đồ...',
    stations: 'Đang tải danh sách trạm sạc...'
  },
  
  guides: {
    map: [
      'Nhấn vào biểu tượng trạm trên bản đồ',
      'Xem thông tin chi tiết trong popup', 
      'Nhấn "Chọn trạm này" để bắt đầu'
    ]
  },

  status: {
    online: 'Kết nối thời gian thực',
    offline: 'Mất kết nối'
  },

  features: {
    comingSoon: 'Tính năng sẽ được cập nhật sớm.'
  }
};

export const STYLES = {
  colors: {
    primary: 'blue',
    success: 'green', 
    danger: 'red',
    warning: 'yellow',
    secondary: 'gray'
  },
  
  spacing: {
    section: 'space-y-4',
    small: 'space-y-2',
    large: 'space-y-6'
  }
};
