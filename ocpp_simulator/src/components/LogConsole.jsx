import { useState, useEffect, useRef } from 'react';
import './LogConsole.css';

const LogConsole = ({ logs, maxLogs = 100 }) => {
  const [filter, setFilter] = useState('all');
  const [isAutoScroll, setIsAutoScroll] = useState(true);
  const logContainerRef = useRef(null);

  // Auto scroll to bottom when new logs arrive
  useEffect(() => {
    if (isAutoScroll && logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs, isAutoScroll]);

  const filteredLogs = logs ? logs
    .slice(-maxLogs) // Keep only latest logs
    .filter(log => {
      if (filter === 'all') return true;
      if (filter === 'ocpp') return ['call', 'callresult', 'callerror'].includes(log.type);
      if (filter === 'system') return ['log'].includes(log.type);
      return log.type === filter;
    }) : [];

  const getLogIcon = (log) => {
    switch (log.type) {
      case 'call':
        return '➡️';
      case 'callresult':
        return '⬅️';
      case 'callerror':
        return '❌';
      case 'log':
        switch (log.level) {
          case 'error':
            return '🔴';
          case 'warn':
            return '⚠️';
          case 'info':
          default:
            return 'ℹ️';
        }
      default:
        return '📄';
    }
  };

  const getLogClass = (log) => {
    const baseClass = 'log-entry';
    
    if (log.type === 'call') return `${baseClass} call`;
    if (log.type === 'callresult') return `${baseClass} callresult`;
    if (log.type === 'callerror') return `${baseClass} callerror`;
    if (log.type === 'log') {
      return `${baseClass} system ${log.level || 'info'}`;
    }
    
    return baseClass;
  };

  const formatLogContent = (log) => {
    if (log.type === 'call') {
      return (
        <div className="log-call">
          <span className="log-action">{log.action}</span>
          <span className="log-message-id">ID: {log.messageId}</span>
          {/* Sửa lỗi ở đây - convert object thành string */}
          <pre className="log-payload">{JSON.stringify(log.payload, null, 2)}</pre>
        </div>
      );
    }

    if (log.type === 'callresult') {
      return (
        <div className="log-callresult">
          <span className="log-message-id">ID: {log.messageId}</span>
          {/* Sửa lỗi ở đây - convert object thành string */}
          <pre className="log-payload">{JSON.stringify(log.payload, null, 2)}</pre>
        </div>
      );
    }

    if (log.type === 'callerror') {
      return (
        <div className="log-callerror">
          <span className="log-error-code">{log.errorCode}</span>
          <span className="log-error-description">{log.errorDescription}</span>
          <span className="log-message-id">ID: {log.messageId}</span>
        </div>
      );
    }

    // Default log message
    return (
      <div className="log-message">
        {/* Đảm bảo log.message là string, không phải object */}
        {typeof log.message === 'object' ? JSON.stringify(log.message) : log.message}
        {log.data && (
          <pre className="log-data">{JSON.stringify(log.data, null, 2)}</pre>
        )}
      </div>
    );
  };

  const clearLogs = () => {
    if (window.confirm('Xóa tất cả logs?')) {
      // This would need to be handled by parent component
      console.log('Clear logs requested');
    }
  };

  const toggleAutoScroll = () => {
    setIsAutoScroll(!isAutoScroll);
  };

  const getFilterCount = (filterType) => {
    if (!logs) return 0;
    
    if (filterType === 'all') return logs.length;
    if (filterType === 'ocpp') {
      return logs.filter(log => ['call', 'callresult', 'callerror'].includes(log.type)).length;
    }
    if (filterType === 'system') {
      return logs.filter(log => log.type === 'log').length;
    }
    
    return logs.filter(log => log.type === filterType).length;
  };

  return (
    <div className="log-console">
      <div className="log-header">
        <h2>📋 Log Console</h2>
        <div className="log-controls">
          <div className="filter-buttons">
            <button
              className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
              onClick={() => setFilter('all')}
            >
              Tất cả ({getFilterCount('all')})
            </button>
            <button
              className={`filter-btn ${filter === 'ocpp' ? 'active' : ''}`}
              onClick={() => setFilter('ocpp')}
            >
              OCPP ({getFilterCount('ocpp')})
            </button>
            <button
              className={`filter-btn ${filter === 'system' ? 'active' : ''}`}
              onClick={() => setFilter('system')}
            >
              System ({getFilterCount('system')})
            </button>
          </div>
          
          <div className="action-buttons">
            <button
              className={`toggle-btn ${isAutoScroll ? 'active' : ''}`}
              onClick={toggleAutoScroll}
              title="Auto scroll to bottom"
            >
              {isAutoScroll ? '📌' : '📎'} Auto Scroll
            </button>
            <button
              className="clear-btn"
              onClick={clearLogs}
              title="Clear all logs"
            >
              🗑️ Clear
            </button>
          </div>
        </div>
      </div>

      <div 
        className="log-container" 
        ref={logContainerRef}
        onScroll={() => {
          // Disable auto-scroll if user scrolls up
          if (logContainerRef.current) {
            const { scrollTop, scrollHeight, clientHeight } = logContainerRef.current;
            const isAtBottom = scrollTop + clientHeight >= scrollHeight - 5;
            if (!isAtBottom && isAutoScroll) {
              setIsAutoScroll(false);
            }
          }
        }}
      >
        {filteredLogs.length === 0 ? (
          <div className="no-logs">
            {logs && logs.length > 0 
              ? `Không có logs ${filter === 'all' ? '' : `loại ${filter}`} để hiển thị`
              : 'Chưa có logs nào. Kết nối để bắt đầu xem logs.'
            }
          </div>
        ) : (
          filteredLogs.map((log, index) => (
            <div key={index} className={getLogClass(log)}>
              <div className="log-timestamp">
                {new Date(log.timestamp).toLocaleTimeString('vi-VN')}
              </div>
              <div className="log-icon">
                {getLogIcon(log)}
              </div>
              {formatLogContent(log)}
            </div>
          ))
        )}
      </div>

      <div className="log-footer">
        <div className="log-stats">
          Hiển thị {filteredLogs.length} / {logs ? logs.length : 0} logs
          {maxLogs < (logs ? logs.length : 0) && ` (giới hạn ${maxLogs} logs mới nhất)`}
        </div>
      </div>
    </div>
  );
};

export default LogConsole;
