import React from 'react';
import ChargingControl from './ChargingControl';
import UserChargingHistory from './UserChargingHistory';
import { MESSAGES } from '../config/constants';

/**
 * Component chứa nội dung các tab
 * Tách riêng để dễ thêm tab mới và quản lý
 */
const TabContent = ({ 
  activeTab, 
  selectedStation, 
  onSelectStation,
  userId,
  onSessionUpdate 
}) => {
  const renderMapTabContent = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">Tìm trạm sạc</h3>
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-blue-800 text-sm">
          💡 <strong>Hướng dẫn:</strong>
        </p>
        <ul className="text-blue-700 text-sm mt-2 space-y-1">
          {MESSAGES.guides.map.map((guide, index) => (
            <li key={index}>• {guide}</li>
          ))}
        </ul>
      </div>
      
      {selectedStation && (
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 mb-2">Trạm đã chọn</h4>
          <p className="text-gray-700">{selectedStation.name || `Trạm ${selectedStation.stationId}`}</p>
          <button
            onClick={() => onSelectStation('control')}
            className="mt-3 w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
          >
            Điều khiển sạc
          </button>
        </div>
      )}
    </div>
  );

  const renderControlTabContent = () => (
    <ChargingControl
      station={selectedStation}
      userId={userId}
      onSessionUpdate={onSessionUpdate}
    />
  );

  const renderHistoryTabContent = () => (
    <UserChargingHistory userId={userId} />
  );

  // Tab content mapping
  const tabContentMap = {
    map: renderMapTabContent,
    control: renderControlTabContent,
    history: renderHistoryTabContent
  };

  const renderContent = tabContentMap[activeTab];
  
  return renderContent ? renderContent() : null;
};

export default TabContent;
