import React, { useState, useEffect } from 'react';
import { 
  Users, Plus, Search, MapPin, Phone, Mail, Building, Calendar, 
  Edit2, Trash2, ToggleLeft, ToggleRight, X, Grid, List,
  TrendingUp, TrendingDown, Zap, Activity, Lock, Unlock,
  Filter, SortAsc, MoreHorizontal, Eye
} from 'lucide-react';
import FirestoreService from '../services/FirestoreService';
import SuperAdminService from '../services/superAdminService';
import StationDetailModal from '../components/StationDetail/StationDetailModal';
import { 
  isValidEmail,
  isValidPhoneNumber,
  transformUserForDisplay 
} from '../utils/formatUtils';
import './Owners.css';

const Owners = () => {
  const [owners, setOwners] = useState([]);
  const [stations, setStations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [selectedOwner, setSelectedOwner] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState('cards'); // 'cards' or 'table'
  const [filterStatus, setFilterStatus] = useState('all'); // 'all', 'active', 'inactive'
  const [sortBy, setSortBy] = useState('name'); // 'name', 'role', 'createdAt', 'walletBalance'
  
  // Modal state for station details
  const [selectedStation, setSelectedStation] = useState(null);
  const [showStationModal, setShowStationModal] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [ownersData, stationsData] = await Promise.all([
        SuperAdminService.getAllOwners(),
        SuperAdminService.getAllStations()
      ]);
      
      // Debug: Log dữ liệu stations
      console.log('🔍 Stations data:', stationsData);
      console.log('🔍 Number of stations:', stationsData?.length || 0);
      if (stationsData && stationsData.length > 0) {
        console.log('🔍 Sample station structure:', stationsData[0]);
      }
      
      // Chỉ lấy những users có role là "owner" và transform data
      const filteredOwners = (ownersData || [])
        .filter(user => user.role === 'owner')
        .map(user => transformUserForDisplay(user));
      setOwners(filteredOwners);
      setStations(stationsData || []);
    } catch (error) {
      console.error('Error loading data:', error);
      setError('Không thể tải dữ liệu. Vui lòng thử lại sau.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateOwner = async (ownerData) => {
    try {
      const newOwner = await SuperAdminService.createOwner(ownerData);
      setOwners(prev => [...prev, newOwner]);
      setShowCreateForm(false);
      
      // Create audit log
      await SuperAdminService.createAuditLog({
        action: 'CREATE_OWNER',
        details: `Created owner: ${ownerData.name}`,
        timestamp: new Date(),
        adminId: 'current-admin' // Replace with actual admin ID
      });
    } catch (error) {
      console.error('Error creating owner:', error);
      setError('Không thể tạo owner mới. Vui lòng thử lại.');
    }
  };

  const handleUpdateOwner = async (ownerData) => {
    try {
      await SuperAdminService.updateOwner(selectedOwner.id, ownerData);
      setOwners(prev => 
        prev.map(owner => 
          owner.id === selectedOwner.id ? { ...owner, ...ownerData } : owner
        )
      );
      setShowEditForm(false);
      setSelectedOwner(null);
      
      // Create audit log
      await SuperAdminService.createAuditLog({
        action: 'UPDATE_OWNER',
        details: `Updated owner: ${ownerData.name}`,
        timestamp: new Date(),
        adminId: 'current-admin'
      });
    } catch (error) {
      console.error('Error updating owner:', error);
      setError('Không thể cập nhật owner. Vui lòng thử lại.');
    }
  };

  const handleDeleteOwner = async (owner) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa owner "${owner.name}"?`)) {
      return;
    }

    try {
      await SuperAdminService.deleteOwner(owner.id);
      setOwners(prev => prev.filter(o => o.id !== owner.id));
      
      // Create audit log
      await SuperAdminService.createAuditLog({
        action: 'DELETE_OWNER',
        details: `Deleted owner: ${owner.name}`,
        timestamp: new Date(),
        adminId: 'current-admin'
      });
    } catch (error) {
      console.error('Error deleting owner:', error);
      setError('Không thể xóa owner. Vui lòng thử lại.');
    }
  };

  const handleToggleOwnerStatus = async (owner) => {
    const newStatus = owner.status === 'active' ? 'inactive' : 'active';
    
    try {
      await SuperAdminService.toggleOwnerStatus(owner.id, newStatus);
      setOwners(prev => 
        prev.map(o => 
          o.id === owner.id ? { ...o, status: newStatus } : o
        )
      );
      
      // Create audit log
      await SuperAdminService.createAuditLog({
        action: 'TOGGLE_OWNER_STATUS',
        details: `Changed owner ${owner.name} status to ${newStatus}`,
        timestamp: new Date(),
        adminId: 'current-admin'
      });
    } catch (error) {
      console.error('Error toggling owner status:', error);
      setError('Không thể thay đổi trạng thái owner. Vui lòng thử lại.');
    }
  };

  const getOwnerStations = (ownerId) => {
    // Lấy email của owner
    const ownerObj = owners.find(o => o.id === ownerId);
    const ownerEmail = ownerObj?.email;
    if (!stations || stations.length === 0 || !ownerEmail) return [];
    // Chỉ match theo ownerId (UID) hoặc email
    return stations.filter(station =>
      station.ownerId === ownerId || station.ownerId === ownerEmail
    );
  };

  // Handler for station detail modal
  const handleStationClick = (station) => {
    setSelectedStation(station);
    setShowStationModal(true);
  };

  const handleCloseStationModal = () => {
    setShowStationModal(false);
    setSelectedStation(null);
  };

  // Calculate statistics
  const calculateStats = () => {
    const totalOwners = owners.length;
    const activeOwners = owners.filter(owner => owner.status === 'active').length;
    const inactiveOwners = owners.filter(owner => owner.status === 'inactive').length;
    const totalStations = stations.length;
    
    return {
      totalOwners,
      activeOwners,
      inactiveOwners,
      totalStations
    };
  };

  const stats = calculateStats();

  // Filter and sort owners
  const filteredOwners = owners
    .filter(owner => {
      // Search filter
      const matchesSearch = owner.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        owner.email?.toLowerCase().includes(searchTerm.toLowerCase());
      
      // Status filter
      const matchesStatus = filterStatus === 'all' || owner.status === filterStatus;
      
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return (a.name || '').localeCompare(b.name || '');
        case 'role':
          return (a.role || '').localeCompare(b.role || '');
        case 'createdAt':
          return new Date(b.createdAt) - new Date(a.createdAt);
        case 'walletBalance':
          return (b.walletBalance || 0) - (a.walletBalance || 0);
        default:
          return 0;
      }
    });

  if (isLoading) {
    return (
      <div className="owners-page">
        <div className="owners-container">
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <div className="loading-text">Đang tải dữ liệu...</div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="owners-page">
        <div className="owners-container">
          <div className="empty-state">
            <TrendingDown className="empty-icon" size={48} />
            <h3 className="empty-title">Có lỗi xảy ra</h3>
            <p className="empty-description">{error}</p>
            <button onClick={loadData} className="btn btn-primary">
              Thử lại
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="owners-page">
      <div className="owners-container">
        {/* Header Section */}
        <div className="owners-header">
          <h1 className="owners-title">
            <div className="owners-title-icon">
              <Users size={24} />
            </div>
            Quản Lý Chủ Trạm (Owners)
          </h1>
          <p className="owners-description">
            Quản lý những người dùng có quyền sở hữu và vận hành trạm sạc
          </p>
        </div>

        {/* Statistics Cards */}
        <div className="owners-stats">
          <div className="stat-card fade-in">
            <div className="stat-card-header">
              <div className="stat-icon total">
                <Users size={20} />
              </div>
              <h3 className="stat-title">Tổng số Owner</h3>
            </div>
            <div className="stat-value">{stats.totalOwners}</div>
          </div>
          
          <div className="stat-card fade-in">
            <div className="stat-card-header">
              <div className="stat-icon active">
                <Activity size={20} />
              </div>
              <h3 className="stat-title">Owner Hoạt động</h3>
            </div>
            <div className="stat-value">{stats.activeOwners}</div>
            <div className="stat-change positive">
              <TrendingUp size={14} />
              {stats.totalOwners > 0 ? Math.round((stats.activeOwners / stats.totalOwners) * 100) : 0}% tổng số
            </div>
          </div>
          
          <div className="stat-card fade-in">
            <div className="stat-card-header">
              <div className="stat-icon inactive">
                <Lock size={20} />
              </div>
              <h3 className="stat-title">Owner Tạm ngưng</h3>
            </div>
            <div className="stat-value">{stats.inactiveOwners}</div>
            <div className="stat-change negative">
              <TrendingDown size={14} />
              {stats.totalOwners > 0 ? Math.round((stats.inactiveOwners / stats.totalOwners) * 100) : 0}% tổng số
            </div>
          </div>
          
          <div className="stat-card fade-in">
            <div className="stat-card-header">
              <div className="stat-icon stations">
                <Zap size={20} />
              </div>
              <h3 className="stat-title">Tổng số Trạm</h3>
            </div>
            <div className="stat-value">{stats.totalStations}</div>
            <div className="stat-change">
              Trung bình {stats.totalOwners > 0 ? (stats.totalStations / stats.totalOwners).toFixed(0) : 0} trạm/owner
            </div>
          </div>
        </div>

        {/* Controls Section */}
        <div className="owners-controls">
          <div className="controls-row">
            <div className="search-container">
              <Search size={20} color="#6b7280" />
              <input
                type="text"
                placeholder="Tìm kiếm owner theo tên, email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
            </div>
            
            <div className="controls-actions">
              {/* View Toggle */}
              <div className="view-toggle">
                <button
                  className={`view-toggle-btn ${viewMode === 'cards' ? 'active' : ''}`}
                  onClick={() => setViewMode('cards')}
                >
                  <Grid size={16} />
                  Cards
                </button>
                <button
                  className={`view-toggle-btn ${viewMode === 'table' ? 'active' : ''}`}
                  onClick={() => setViewMode('table')}
                >
                  <List size={16} />
                  Table
                </button>
              </div>
              
              <button
                onClick={() => setShowCreateForm(true)}
                className="btn btn-primary"
              >
                <Plus size={16} />
                Thêm Owner Mới
              </button>
            </div>
          </div>
          
          {/* Filters */}
          <div className="owners-filters">
            <div className="filter-group">
              <Filter size={16} />
              <label>Trạng thái:</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="filter-select"
              >
                <option value="all">Tất cả</option>
                <option value="active">Hoạt động</option>
                <option value="inactive">Tạm ngưng</option>
              </select>
            </div>
            
            <div className="filter-group">
              <SortAsc size={16} />
              <label>Sắp xếp:</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="filter-select"
              >
                <option value="name">Tên</option>
                <option value="role">Role</option>
                <option value="createdAt">Ngày tạo</option>
                <option value="walletBalance">Số dư</option>
              </select>
            </div>
          </div>
        </div>

        {/* Owners List */}
        {filteredOwners.length === 0 ? (
          <div className="empty-state">
            <Users size={48} className="empty-icon" />
            <h3 className="empty-title">
              {searchTerm ? 'Không tìm thấy owner phù hợp' : 'Chưa có owner nào'}
            </h3>
            <p className="empty-description">
              {searchTerm 
                ? 'Thử thay đổi từ khóa tìm kiếm hoặc bộ lọc' 
                : 'Hãy tạo owner đầu tiên để quản lý trạm sạc'
              }
            </p>
            {!searchTerm && (
              <button
                onClick={() => setShowCreateForm(true)}
                className="btn btn-primary"
              >
                <Plus size={16} />
                Tạo Owner Đầu Tiên
              </button>
            )}
          </div>
        ) : (
          <div className={`owners-grid ${viewMode}`}>
            {viewMode === 'cards' ? (
              // Cards View
              filteredOwners.map((owner) => (
                <div key={owner.id} className="owner-card slide-in">
                  <div className="owner-card-header">
                    <div className="owner-info">
                      <h3 className="owner-name">{owner.formattedName}</h3>
                      <p className="owner-company">{owner.company || 'Chưa có công ty'}</p>
                    </div>
                    <span className={`owner-status ${owner.status}`}>
                      {owner.statusInfo.text}
                    </span>
                  </div>
                  
                  <div className="owner-details">
                    <div className="detail-item">
                      <Mail className="detail-icon" size={16} />
                      <span className="detail-text">{owner.formattedEmail}</span>
                    </div>
                    <div className="detail-item">
                      <Phone className="detail-icon" size={16} />
                      <span className="detail-text">{owner.formattedPhone || 'Chưa có số điện thoại'}</span>
                    </div>
                    <div className="detail-item">
                      <Building className="detail-icon" size={16} />
                      <span className="detail-text">Role: {owner.roleInfo.text}</span>
                    </div>
                    <div className="detail-item">
                      <Calendar className="detail-icon" size={16} />
                      <span className="detail-text">Tạo: {owner.formattedCreatedAt}</span>
                    </div>
                    {owner.walletBalance !== undefined && (
                      <div className="detail-item">
                        <TrendingUp className="detail-icon" size={16} />
                        <span className="detail-text">Số dư: {owner.formattedWalletBalance}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="owner-stations">
                    <div className="stations-header">
                      <Zap className="detail-icon" size={16} />
                      <h4 className="stations-title">Trạm sạc</h4>
                      <span className="stations-count">{getOwnerStations(owner.id).length}</span>
                    </div>
                    <div className="stations-list">
                      {getOwnerStations(owner.id).length > 0 ? (
                        <div className="stations-grid">
                          {getOwnerStations(owner.id).map((station, index) => (
                            <button
                              key={station.id || index}
                              onClick={() => handleStationClick(station)}
                              className="station-item"
                              title="Click để xem chi tiết trạm sạc"
                            >
                              <Zap size={12} />
                              {station.name || station.id}
                            </button>
                          ))}
                        </div>
                      ) : (
                        'Chưa có trạm sạc nào'
                      )}
                    </div>
                  </div>
                  
                  <div className="owner-actions">
                    <button
                      onClick={() => handleToggleOwnerStatus(owner)}
                      className={`btn btn-sm ${owner.status === 'active' ? 'btn-warning' : 'btn-success'}`}
                      title={owner.status === 'active' ? 'Tạm ngưng' : 'Kích hoạt'}
                    >
                      {owner.status === 'active' ? <Lock size={14} /> : <Unlock size={14} />}
                    </button>
                    <button
                      onClick={() => {
                        setSelectedOwner(owner);
                        setShowEditForm(true);
                      }}
                      className="btn btn-sm btn-secondary"
                      title="Chỉnh sửa"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      onClick={() => handleDeleteOwner(owner)}
                      className="btn btn-sm btn-danger"
                      title="Xóa"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              // Table View
              <div className="owners-table">
                <table className="table">
                  <thead>
                    <tr>
                      <th>User</th>
                      <th>Role</th>
                      <th>Liên hệ</th>
                      <th>Trạng thái</th>
                      <th>Số dư</th>
                      <th>Ngày tạo</th>
                      <th>Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredOwners.map((owner) => (
                      <tr key={owner.id}>
                        <td>
                          <div>
                            <div className="font-semibold">{owner.formattedName}</div>
                            <div className="text-sm">{owner.formattedEmail}</div>
                            {owner.userId && <div className="text-xs">ID: {owner.userId}</div>}
                          </div>
                        </td>
                        <td>
                          <span 
                            className={`role-badge ${owner.role}`}
                            style={{
                              backgroundColor: owner.roleInfo.bgColor,
                              color: owner.roleInfo.textColor
                            }}
                          >
                            {owner.roleInfo.text}
                          </span>
                        </td>
                        <td>
                          <div>
                            <div className="text-sm">{owner.formattedPhone || '-'}</div>
                            <div className="text-xs">{owner.address || '-'}</div>
                          </div>
                        </td>
                        <td>
                          <span 
                            className={`owner-status ${owner.status}`}
                            style={{
                              backgroundColor: owner.statusInfo.bgColor,
                              color: owner.statusInfo.textColor
                            }}
                          >
                            {owner.statusInfo.text}
                          </span>
                        </td>
                        <td>
                          <span className="font-semibold">
                            {owner.formattedWalletBalance || '-'}
                          </span>
                        </td>
                        <td>{owner.formattedCreatedAt}</td>
                        <td>
                          <div className="owner-actions">
                            <button
                              onClick={() => handleToggleOwnerStatus(owner)}
                              className={`btn btn-sm ${owner.status === 'active' ? 'btn-warning' : 'btn-success'}`}
                              title={owner.status === 'active' ? 'Tạm ngưng' : 'Kích hoạt'}
                            >
                              {owner.status === 'active' ? <Lock size={14} /> : <Unlock size={14} />}
                            </button>
                            <button
                              onClick={() => {
                                setSelectedOwner(owner);
                                setShowEditForm(true);
                              }}
                              className="btn btn-sm btn-secondary"
                              title="Chỉnh sửa"
                            >
                              <Edit2 size={14} />
                            </button>
                            <button
                              onClick={() => handleDeleteOwner(owner)}
                              className="btn btn-sm btn-danger"
                              title="Xóa"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Create Owner Form */}
        {showCreateForm && (
          <OwnerForm
            title="Tạo Owner Mới"
            onSubmit={handleCreateOwner}
            onClose={() => setShowCreateForm(false)}
          />
        )}

        {/* Edit Owner Form */}
        {showEditForm && selectedOwner && (
          <OwnerForm
            title="Chỉnh Sửa Owner"
            owner={selectedOwner}
            onSubmit={handleUpdateOwner}
            onClose={() => {
              setShowEditForm(false);
              setSelectedOwner(null);
            }}
          />
        )}
      </div>

      {/* Station Detail Modal */}
      {showStationModal && selectedStation && (
        <StationDetailModal
          station={selectedStation}
          isOpen={showStationModal}
          onClose={handleCloseStationModal}
        />
      )}
    </div>
  );
};

// Owner Form Component
const OwnerForm = ({ title, owner, onSubmit, onClose }) => {
  const [formData, setFormData] = useState({
    name: owner?.name || '',
    email: owner?.email || '',
    phone: owner?.phone || '',
    role: owner?.role || 'owner', // Mặc định là owner
    status: owner?.status || 'active',
    walletBalance: owner?.walletBalance || 0,
    userId: owner?.userId || ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Tên owner là bắt buộc';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email là bắt buộc';
    } else if (!isValidEmail(formData.email)) {
      newErrors.email = 'Email không hợp lệ';
    }
    
    if (formData.phone && !isValidPhoneNumber(formData.phone)) {
      newErrors.phone = 'Số điện thoại không hợp lệ';
    }

    if (formData.walletBalance && isNaN(parseFloat(formData.walletBalance))) {
      newErrors.walletBalance = 'Số dư phải là số';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    try {
      const submitData = {
        ...formData,
        walletBalance: parseFloat(formData.walletBalance) || 0
      };
      await onSubmit(submitData);
    } catch (error) {
      console.error('Error submitting form:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header">
          <h2 className="modal-title">{title}</h2>
          <button onClick={onClose} className="modal-close">
            <X size={20} />
          </button>
        </div>
        
        <div className="modal-body">
          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label required">Tên Owner</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className={`form-input ${errors.name ? 'error' : ''}`}
                  placeholder="Nhập tên owner"
                />
                {errors.name && <div className="form-error">{errors.name}</div>}
              </div>
              
              <div className="form-group">
                <label className="form-label required">Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={`form-input ${errors.email ? 'error' : ''}`}
                  placeholder="email@example.com"
                />
                {errors.email && <div className="form-error">{errors.email}</div>}
              </div>
              
              <div className="form-group">
                <label className="form-label">Số điện thoại</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className={`form-input ${errors.phone ? 'error' : ''}`}
                  placeholder="+84 123 456 789"
                />
                {errors.phone && <div className="form-error">{errors.phone}</div>}
              </div>
              
              <div className="form-group">
                <label className="form-label">Role</label>
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  className="form-input"
                  disabled={!!owner} // Disable khi đang edit owner
                >
                  <option value="user">User</option>
                  <option value="owner">Owner</option>
                  <option value="admin">Admin</option>
                </select>
                {owner && (
                  <div className="form-note">
                    Role không thể thay đổi khi chỉnh sửa
                  </div>
                )}
              </div>
              
              <div className="form-group">
                <label className="form-label">Trạng thái</label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="form-input"
                >
                  <option value="active">Hoạt động</option>
                  <option value="inactive">Tạm ngưng</option>
                </select>
              </div>
              
              <div className="form-group">
                <label className="form-label">Số dư ví (VND)</label>
                <input
                  type="number"
                  name="walletBalance"
                  value={formData.walletBalance}
                  onChange={handleChange}
                  className={`form-input ${errors.walletBalance ? 'error' : ''}`}
                  placeholder="0"
                  min="0"
                  step="0.01"
                />
                {errors.walletBalance && <div className="form-error">{errors.walletBalance}</div>}
              </div>
            </div>
            
            {!owner && (
              <div className="form-group">
                <label className="form-label">Owner ID</label>
                <input
                  type="text"
                  name="userId"
                  value={formData.userId}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="Để trống để tự động tạo"
                />
              </div>
            )}
            
            <div className="form-actions">
              <button type="button" onClick={onClose} className="btn btn-secondary">
                Hủy
              </button>
              <button type="submit" disabled={isSubmitting} className="btn btn-primary">
                {isSubmitting ? 'Đang xử lý...' : (owner ? 'Cập nhật' : 'Tạo mới')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Owners;