import React, { useState } from 'react';
import { Calendar } from 'lucide-react';
import SystemDashboard from '../components/Dashboard/SystemDashboard';

const Overview = () => {
  const [timeRange, setTimeRange] = useState('today');

  const handleDashboardDataLoad = (dashboardData) => {
    console.log(' Dashboard data loaded:', dashboardData);
  };

  return (
    <div className="overview-container">
      <div className="dashboard-controls" style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '24px',
        padding: '16px 24px',
        background: 'white',
        borderRadius: '12px',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
      }}>
        <h1 style={{ margin: 0, fontSize: '24px', fontWeight: '700', color: '#1f2937' }}>
          Tổng Quan Hệ Thống
        </h1>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Calendar size={16} style={{ color: '#6b7280' }} />
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            style={{
              padding: '8px 12px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '14px',
              backgroundColor: 'white',
              color: '#374151'
            }}
          >
            <option value="today">Hôm Nay</option>
            <option value="week">Tuần Này</option>
            <option value="month">Tháng Này</option>
            <option value="year">Năm Này</option>
          </select>
        </div>
      </div>

      <SystemDashboard 
        timeRange={timeRange} 
        onDataLoad={handleDashboardDataLoad}
      />
    </div>
  );
};

export default Overview;
