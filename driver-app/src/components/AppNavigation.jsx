import React from 'react';
import { Map, Zap, History, Menu, X } from 'lucide-react';
import { TAB_CONFIG } from '../config/constants';

/**
 * Component quản lý navigation tabs và mobile menu
 * Tách riêng để dễ customize và maintain
 */
const AppNavigation = ({ 
  activeTab, 
  onTabChange, 
  sidebarOpen, 
  onToggleSidebar 
}) => {
  // Icon mapping
  const iconMap = { Map, Zap, History };

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={onToggleSidebar}
        className="md:hidden fixed top-20 right-4 z-50 w-12 h-12 bg-white shadow-lg rounded-full flex items-center justify-center text-gray-600 hover:text-blue-600 hover:shadow-xl transition-all"
      >
        {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Tab Navigation */}
      <div className="flex border-b border-gray-200 bg-white relative z-50">
        {TAB_CONFIG.map((tab) => {
          const Icon = iconMap[tab.icon];
          const isActive = activeTab === tab.id;
          
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              title={tab.description}
              className={`
                flex-1 flex items-center justify-center px-4 py-3 text-sm font-medium transition-colors
                ${isActive 
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50' 
                  : 'text-gray-600 hover:text-blue-600 hover:bg-gray-50'
                }
              `}
            >
              <Icon size={18} className="mr-2" />
              {tab.label}
            </button>
          );
        })}
      </div>
    </>
  );
};

export default AppNavigation;
