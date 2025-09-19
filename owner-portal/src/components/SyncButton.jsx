import React, { useState } from 'react';
import RealtimeService from '../services/realtime';

const SyncButton = ({ ownerId, onSyncComplete }) => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState(null);
  const [syncResult, setSyncResult] = useState(null);

  const handleManualSync = async () => {
    if (!ownerId || isSyncing) return;

    setIsSyncing(true);
    setSyncResult(null);

    try {
      console.log(`🔄 Starting manual sync for owner: ${ownerId}...`);
      const result = await RealtimeService.syncRealtimeToFirestore(ownerId);
      
      const syncTime = new Date();
      setLastSyncTime(syncTime);
      setSyncResult(result);
      
      // Show success notification
      const message = `Đồng bộ hoàn tất!\n✅ Đã đồng bộ: ${result.synced} trạm\n⏭️ Đã bỏ qua: ${result.skipped} trạm (đã tồn tại)`;
      alert(message);
      
      // Call parent callback
      if (onSyncComplete) {
        onSyncComplete(result);
      }
      
    } catch (error) {
      console.error('Manual sync error:', error);
      setSyncResult({ error: error.message });
      alert(`Lỗi khi đồng bộ dữ liệu: ${error.message}`);
    } finally {
      setIsSyncing(false);
    }
  };

  const formatLastSyncTime = () => {
    if (!lastSyncTime) return 'Chưa đồng bộ';
    return lastSyncTime.toLocaleString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const getSyncStatusIcon = () => {
    if (isSyncing) return '🔄';
    if (syncResult?.error) return '❌';
    if (syncResult) return '✅';
    return '📥';
  };

  const getSyncStatusText = () => {
    if (isSyncing) return 'Đang đồng bộ...';
    if (syncResult?.error) return 'Đồng bộ thất bại';
    if (syncResult) return `Đã đồng bộ ${syncResult.synced} trạm`;
    return 'Đồng bộ dữ liệu';
  };

  return (
    <div style={{ 
      background: '#f8fafc', 
      border: '1px solid #e2e8f0',
      borderRadius: '8px',
      padding: '1rem',
      margin: '1rem 0'
    }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '0.5rem'
      }}>
        <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: '600', color: '#374151' }}>
          🔄 Đồng bộ dữ liệu
        </h3>
        <button
          onClick={handleManualSync}
          disabled={isSyncing || !ownerId}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.75rem 1rem',
            background: isSyncing ? '#9ca3af' : '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            fontSize: '0.875rem',
            fontWeight: '500',
            cursor: isSyncing ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s',
            ...(isSyncing ? {} : {
              ':hover': {
                background: '#2563eb'
              }
            })
          }}
          onMouseEnter={(e) => {
            if (!isSyncing) {
              e.target.style.background = '#2563eb';
            }
          }}
          onMouseLeave={(e) => {
            if (!isSyncing) {
              e.target.style.background = '#3b82f6';
            }
          }}
        >
          <span style={{ 
            fontSize: '1rem',
            animation: isSyncing ? 'spin 1s linear infinite' : 'none',
            display: 'inline-block'
          }}>
            {getSyncStatusIcon()}
          </span>
          {getSyncStatusText()}
        </button>
      </div>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '1rem',
        fontSize: '0.875rem',
        color: '#6b7280'
      }}>
        <div>
          <strong>Lần đồng bộ cuối:</strong><br />
          {formatLastSyncTime()}
        </div>
        
        {syncResult && !syncResult.error && (
          <div>
            <strong>Kết quả:</strong><br />
            {syncResult.synced} trạm đã đồng bộ, {syncResult.skipped} bỏ qua
          </div>
        )}
        
        {syncResult?.error && (
          <div style={{ color: '#dc2626' }}>
            <strong>Lỗi:</strong><br />
            {syncResult.error}
          </div>
        )}
      </div>
    </div>
  );
};

export default SyncButton;
