import React from 'react';
import { Wifi, WifiOff } from 'lucide-react';
import { APP_CONFIG, MESSAGES } from '../config/constants';

/**
 * Component hiển thị status bar dưới cùng
 * Có thể mở rộng thêm nhiều thông tin khác
 */
const AppFooter = ({ isOnline }) => {
  return (
    <div className="bg-white border-t border-gray-200 px-4 py-2">
      <div className="flex items-center justify-between text-xs text-gray-500">
        <span>{APP_CONFIG.name} v{APP_CONFIG.version}</span>
        <div className="flex items-center gap-2">
          {isOnline ? (
            <>
              <Wifi size={12} className="text-green-500" />
              <span className="text-green-600">{MESSAGES.status.online}</span>
            </>
          ) : (
            <>
              <WifiOff size={12} className="text-red-500" />
              <span className="text-red-600">{MESSAGES.status.offline}</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AppFooter;
