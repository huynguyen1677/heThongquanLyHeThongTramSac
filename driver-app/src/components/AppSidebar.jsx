import React from 'react';
import { Map, Zap, History } from 'lucide-react';
import { TAB_CONFIG } from '../config/constants';

/**
 * Component Sidebar có thể đóng/mở, hoạt động trên cả mobile và desktop.
 */
const AppSidebar = ({ 
  isOpen,
  onClose,
  activeTab, 
  onTabChange
}) => {
  // Icon mapping
  const iconMap = { Map, Zap, History };

  return (
    <>
      {/* Lớp phủ (overlay) cho mobile, click để đóng sidebar */}
      <div
        className={`fixed inset-0 bg-black bg-opacity-40 z-30 transition-opacity md:hidden ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      ></div>

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 h-full bg-white border-r border-gray-200 z-40
          transform transition-transform duration-300 ease-in-out
          w-64
          md:top-16 md:h-[calc(100vh-4rem)] /* Canh chỉnh dưới header trên desktop */
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <div className="h-full flex flex-col">
          <nav className="flex-1 p-4 space-y-2">
            {TAB_CONFIG.map((tab) => {
              const Icon = iconMap[tab.icon];
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => onTabChange(tab.id)}
                  title={tab.description}
                  className={`w-full flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all
                    ${isActive 
                      ? 'bg-blue-600 text-white shadow-sm' 
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-800'
                    }`}
                >
                  <Icon size={20} className="mr-3 flex-shrink-0" />
                  <span className="truncate">{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </aside>
    </>
  );
};

export default AppSidebar;
