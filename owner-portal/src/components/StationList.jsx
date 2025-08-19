import { useState, useEffect } from 'react';
import { Plus, Search, Eye, Trash2, MapPin, Zap } from 'lucide-react';
import FirestoreService from '../services/firestore';
import RealtimeService from '../services/realtime';
import StationForm from './StationForm';
import StationDetail from './StationDetail';

const StationList = ({ ownerId }) => {
  const [stations, setStations] = useState([]);
  const [filteredStations, setFilteredStations] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedStation, setSelectedStation] = useState(null);
  const [realtimeData, setRealtimeData] = useState({});

  // Load stations on mount
  useEffect(() => {
    loadStations();
  }, [ownerId]);

  // Subscribe to realtime data for all stations
  useEffect(() => {
    const unsubscribe = RealtimeService.subscribeToAllStations((data) => {
      setRealtimeData(data || {});
    });

    return unsubscribe;
  }, []);


  // Filter stations based on search term
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredStations(stations);
    } else {
      const filtered = stations.filter(station => 
        station.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        station.stationName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        station.address.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredStations(filtered);
    }
  }, [stations, searchTerm]);

  const loadStations = async () => {
    setIsLoading(true);
    try {
      const stationsData = await FirestoreService.getStationsByOwner(ownerId);
      setStations(stationsData);
    } catch (error) {
      console.error('Error loading stations:', error);
      alert(`Lỗi khi tải danh sách trạm sạc: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStationCreated = (newStation) => {
    setStations(prev => [newStation, ...prev]);
  };

  const handleStationUpdated = (updatedStation) => {
    setStations(prev => prev.map(station => 
      station.id === updatedStation.id ? updatedStation : station
    ));
  };

  const handleDeleteStation = async (stationId) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa trạm sạc ${stationId}?`)) {
      return;
    }

    try {
      await FirestoreService.deleteStation(stationId);
      setStations(prev => prev.filter(station => station.id !== stationId));
      alert('Xóa trạm sạc thành công!');
    } catch (error) {
      console.error('Error deleting station:', error);
      alert(`Lỗi khi xóa trạm sạc: ${error.message}`);
    }
  };

  const handleSyncStations = async () => {
    if (!confirm('Đồng bộ tất cả trạm sạc từ CSMS? Thao tác này sẽ cập nhật thông tin từ hệ thống realtime.')) {
      return;
    }

    setIsLoading(true);
    try {
      // Gọi API sync stations từ CSMS
      const response = await fetch('http://localhost:3000/api/stations/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ownerId })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      alert(`Đồng bộ thành công! ${result.synced} trạm được cập nhật, ${result.skipped} trạm bỏ qua.`);
      
      // Reload stations after sync
      await loadStations();
    } catch (error) {
      console.error('Error syncing stations:', error);
      alert(`Lỗi khi đồng bộ: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const getStationStatus = (stationId) => {
    const realtime = realtimeData[stationId];
    if (!realtime) return { status: 'offline', text: '🔴 Offline' };
    
    return realtime.online ? 
      { status: 'online', text: '🟢 Online' } : 
      { status: 'offline', text: '🔴 Offline' };
  };

  const getConnectorsSummary = (stationId) => {
    const realtime = realtimeData[stationId];
    if (!realtime?.connectors) return 'Không có dữ liệu';

    const connectors = Object.values(realtime.connectors);
    const available = connectors.filter(c => c.status === 'Available').length;
    const charging = connectors.filter(c => c.status === 'Charging').length;
    const preparing = connectors.filter(c => c.status === 'Preparing').length;
    const faulted = connectors.filter(c => c.status === 'Faulted').length;

    const parts = [];
    if (available > 0) parts.push(`${available} sẵn sàng`);
    if (charging > 0) parts.push(`${charging} đang sạc`);
    if (preparing > 0) parts.push(`${preparing} chuẩn bị`);
    if (faulted > 0) parts.push(`${faulted} lỗi`);

    return parts.length > 0 ? parts.join(', ') : 'Không hoạt động';
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return 'Chưa có';
    return new Date(dateString).toLocaleString('vi-VN');
  };

  if (isLoading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <div className="loading" style={{ width: '40px', height: '40px' }}></div>
        <p style={{ marginTop: '1rem', color: '#6b7280' }}>Đang tải danh sách trạm sạc...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '600', color: '#1f2937', marginBottom: '0.5rem' }}>
            ⚡ Quản lý trạm sạc
          </h2>
          <p style={{ color: '#6b7280' }}>
            Owner: <strong>{ownerId}</strong> • Tổng cộng: <strong>{stations.length}</strong> trạm
          </p>
        </div>
        
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button 
            onClick={handleSyncStations}
            className="btn btn-outline"
            title="Đồng bộ trạm sạc từ CSMS"
          >
            🔄 Sync
          </button>
          <button 
            onClick={() => setShowCreateForm(true)}
            className="btn btn-primary"
          >
            <Plus size={16} />
            Thêm trạm sạc
          </button>
        </div>
      </div>

      {/* Search */}
      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ position: 'relative', maxWidth: '400px' }}>
          <Search 
            size={16} 
            style={{ 
              position: 'absolute', 
              left: '0.75rem', 
              top: '50%', 
              transform: 'translateY(-50%)',
              color: '#6b7280'
            }} 
          />
          <input
            type="text"
            placeholder="Tìm kiếm theo ID, tên hoặc địa chỉ..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ paddingLeft: '2.5rem' }}
          />
        </div>
      </div>

      {/* Stations Grid */}
      {filteredStations.length === 0 ? (
        <div className="card">
          <div className="card-body text-center" style={{ padding: '3rem' }}>
            <Zap size={48} style={{ color: '#d1d5db', margin: '0 auto 1rem' }} />
            <h3 style={{ color: '#374151', marginBottom: '0.5rem' }}>
              {searchTerm ? 'Không tìm thấy kết quả' : 'Chưa có trạm sạc nào'}
            </h3>
            <p style={{ color: '#6b7280', marginBottom: '1.5rem' }}>
              {searchTerm ? 
                'Thử tìm kiếm với từ khóa khác' : 
                'Hãy thêm trạm sạc đầu tiên để bắt đầu quản lý'
              }
            </p>
            {!searchTerm && (
              <button 
                onClick={() => setShowCreateForm(true)}
                className="btn btn-primary"
              >
                <Plus size={16} />
                Thêm trạm sạc đầu tiên
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-3">
          {filteredStations.map((station) => {
            const status = getStationStatus(station.id);
            const connectorsSummary = getConnectorsSummary(station.id);

            return (
              <div key={station.id} className="card">
                <div className="card-body">
                  {/* Station Header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                    <div>
                      <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#1f2937', marginBottom: '0.25rem' }}>
                        {station.stationName || station.id}
                      </h3>
                      <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                        ID: {station.id}
                      </p>
                    </div>
                    <span className={`status-badge ${status.status === 'online' ? 'status-available' : 'status-offline'}`}>
                      {status.text}
                    </span>
                  </div>

                  {/* Station Info */}
                  <div style={{ marginBottom: '1rem' }}>
                    {station.address && (
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', marginBottom: '0.5rem' }}>
                        <MapPin size={14} style={{ color: '#6b7280', marginTop: '0.125rem', flexShrink: 0 }} />
                        <span style={{ fontSize: '0.875rem', color: '#374151', lineHeight: '1.4' }}>
                          {station.address}
                        </span>
                      </div>
                    )}
                    
                    <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                      Vendor: {station.vendor} • Model: {station.model}
                    </div>
                    
                    <div style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.25rem' }}>
                      Owner: {station.ownerId}
                    </div>
                    
                    <div style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.25rem' }}>
                      Connectors: {connectorsSummary}
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button 
                      onClick={() => setSelectedStation(station)}
                      className="btn btn-outline"
                      style={{ flex: 1 }}
                    >
                      <Eye size={14} />
                      Chi tiết
                    </button>
                    <button 
                      onClick={() => handleDeleteStation(station.id)}
                      className="btn btn-danger"
                      style={{ padding: '0.5rem' }}
                      title="Xóa trạm sạc"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>

                  {/* Last Update */}
                  <div style={{ marginTop: '0.75rem', fontSize: '0.75rem', color: '#9ca3af', textAlign: 'center' }}>
                    Cập nhật: {formatDateTime(station.updatedAt)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modals */}
      {showCreateForm && (
        <StationForm
          onClose={() => setShowCreateForm(false)}
          onStationCreated={handleStationCreated}
          ownerId={ownerId}
        />
      )}

      {selectedStation && (
        <StationDetail
          station={selectedStation}
          onClose={() => setSelectedStation(null)}
          onStationUpdated={handleStationUpdated}
        />
      )}
    </div>
  );
};

export default StationList;
