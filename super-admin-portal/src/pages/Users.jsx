import React, { useState, useEffect } from 'react';
import { 
  Users as UsersIcon, 
  Search, 
  UserPlus, 
  MoreVertical, 
  Edit2, 
  Trash2,
  Eye,
  EyeOff,
  AlertTriangle,
  CheckCircle,
  Clock,
  Filter,
  Download,
  Grid,
  List,
  Shield,
  User,
  UserCheck,
  UserX
} from 'lucide-react';
import SuperAdminService from '../services/superAdminService';
import * as formatUtils from '../utils/formatUtils';
import './Users.css';

// Định nghĩa trạng thái người dùng
const USER_STATUS = {
  'active': { name: 'Hoạt động', color: 'success', icon: CheckCircle },
  'inactive': { name: 'Tạm khóa', color: 'warning', icon: Clock },
  'banned': { name: 'Cấm vĩnh viễn', color: 'danger', icon: UserX }
};

const Users = () => {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState('cards'); // 'cards' or 'table'
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState('createdAt');

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Lấy tất cả users từ Firebase và chỉ lấy những user có role là 'user'
      const allUsers = await SuperAdminService.getAllUsers();
      const regularUsers = allUsers.filter(user => !user.role || user.role === 'user');
      setUsers(regularUsers);
    } catch (err) {
      console.error('Error loading users:', err);
      setError('Không thể tải danh sách người dùng. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateUser = async (userData) => {
    try {
      await SuperAdminService.createUser(userData);
      await loadUsers();
      setShowCreateForm(false);
    } catch (err) {
      console.error('Error creating user:', err);
      setError('Không thể tạo người dùng. Vui lòng thử lại.');
    }
  };

  const handleUpdateUser = async (userData) => {
    try {
      await SuperAdminService.updateUser(selectedUser.id, userData);
      await loadUsers();
      setShowEditForm(false);
      setSelectedUser(null);
    } catch (err) {
      console.error('Error updating user:', err);
      setError('Không thể cập nhật người dùng. Vui lòng thử lại.');
    }
  };

  const handleDeleteUser = async (user) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa người dùng "${user.email}"?`)) {
      return;
    }

    try {
      await SuperAdminService.deleteUser(user.id);
      await loadUsers();
    } catch (err) {
      console.error('Error deleting user:', err);
      setError('Không thể xóa người dùng. Vui lòng thử lại.');
    }
  };

  const handleToggleUserStatus = async (user) => {
    try {
      const newStatus = user.status === 'active' ? 'inactive' : 'active';
      await SuperAdminService.toggleUserStatus(user.id, newStatus);
      await loadUsers();
    } catch (err) {
      console.error('Error toggling user status:', err);
      setError('Không thể thay đổi trạng thái người dùng. Vui lòng thử lại.');
    }
  };

  // Calculate statistics
  const calculateStats = () => {
    const totalUsers = users.length;
    const activeUsers = users.filter(user => user.status === 'active').length;
    const inactiveUsers = users.filter(user => user.status === 'inactive').length;
    const bannedUsers = users.filter(user => user.status === 'banned').length;

    return {
      total: totalUsers,
      active: activeUsers,
      inactive: inactiveUsers,
      banned: bannedUsers
    };
  };

  const stats = calculateStats();

  // Filter and sort users
  const filteredUsers = users
    .filter(user => {
      const matchesSearch = user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           user.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           user.phoneNumber?.includes(searchTerm);
      const matchesStatus = filterStatus === 'all' || user.status === filterStatus;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'email':
          return (a.email || '').localeCompare(b.email || '');
        case 'status':
          return (a.status || '').localeCompare(b.status || '');
        case 'createdAt':
        default:
          return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
      }
    });

  if (isLoading) {
    return (
      <div className="users-page">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Đang tải danh sách người dùng...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="users-page">
        <div className="error-state">
          <AlertTriangle size={48} />
          <h3>Có lỗi xảy ra</h3>
          <p>{error}</p>
          <button onClick={loadUsers} className="btn btn-primary">
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="users-page">
      <div className="users-container">
        {/* Header */}
        <div className="users-header">
          <div className="header-content">
            <div className="title-section">
              <UsersIcon className="users-title-icon" size={32} />
              <div>
                <h1 className="users-title">Quản Lý Người Dùng</h1>
                <p className="users-description">
                  Quản lý tài khoản người dùng với các quyền hạn được định nghĩa sẵn
                </p>
              </div>
            </div>
            <button 
              onClick={() => setShowCreateForm(true)}
              className="btn btn-primary"
            >
              <UserPlus size={20} />
              Thêm Người Dùng
            </button>
          </div>
        </div>

        {/* Statistics */}
        <div className="users-stats">
          <div className="stat-card">
            <div className="stat-card-header">
              <UsersIcon className="stat-icon total" size={24} />
              <span className="stat-title">Tổng số</span>
            </div>
            <div className="stat-value">{stats.total}</div>
            <div className="stat-change">Người dùng</div>
          </div>

          <div className="stat-card">
            <div className="stat-card-header">
              <CheckCircle className="stat-icon active" size={24} />
              <span className="stat-title">Hoạt động</span>
            </div>
            <div className="stat-value">{stats.active}</div>
            <div className="stat-change">
              {stats.total > 0 ? Math.round((stats.active / stats.total) * 100) : 0}% tổng số
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-card-header">
              <Clock className="stat-icon inactive" size={24} />
              <span className="stat-title">Tạm khóa</span>
            </div>
            <div className="stat-value">{stats.inactive}</div>
            <div className="stat-change">
              {stats.total > 0 ? Math.round((stats.inactive / stats.total) * 100) : 0}% tổng số
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-card-header">
              <UserX className="stat-icon banned" size={24} />
              <span className="stat-title">Cấm vĩnh viễn</span>
            </div>
            <div className="stat-value">{stats.banned}</div>
            <div className="stat-change">
              {stats.total > 0 ? Math.round((stats.banned / stats.total) * 100) : 0}% tổng số
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="users-controls">
          <div className="controls-row">
            <div className="search-container">
              <Search className="search-icon" size={20} />
              <input
                type="text"
                className="search-input"
                placeholder="Tìm kiếm theo email, tên, số điện thoại..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="controls-actions">
              <div className="view-toggle">
                <button
                  className={`view-toggle-btn ${viewMode === 'cards' ? 'active' : ''}`}
                  onClick={() => setViewMode('cards')}
                >
                  <Grid size={18} />
                </button>
                <button
                  className={`view-toggle-btn ${viewMode === 'table' ? 'active' : ''}`}
                  onClick={() => setViewMode('table')}
                >
                  <List size={18} />
                </button>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="users-filters">
            <div className="filter-group">
              <label>Trạng thái:</label>
              <select 
                className="filter-select"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="all">Tất cả</option>
                {Object.entries(USER_STATUS).map(([key, status]) => (
                  <option key={key} value={key}>{status.name}</option>
                ))}
              </select>
            </div>

            <div className="filter-group">
              <label>Sắp xếp:</label>
              <select 
                className="filter-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="createdAt">Mới nhất</option>
                <option value="email">Email</option>
                <option value="status">Trạng thái</option>
              </select>
            </div>
          </div>
        </div>

        {/* Users Grid/Table */}
        <div className={`users-grid ${viewMode}`}>
          {viewMode === 'cards' ? (
            filteredUsers.map(user => (
              <UserCard 
                key={user.id} 
                user={user}
                onEdit={(user) => {
                  setSelectedUser(user);
                  setShowEditForm(true);
                }}
                onDelete={handleDeleteUser}
                onToggleStatus={handleToggleUserStatus}
              />
            ))
          ) : (
            <UsersTable 
              users={filteredUsers}
              onEdit={(user) => {
                setSelectedUser(user);
                setShowEditForm(true);
              }}
              onDelete={handleDeleteUser}
              onToggleStatus={handleToggleUserStatus}
            />
          )}
        </div>

        {filteredUsers.length === 0 && (
          <div className="empty-state">
            <UsersIcon size={64} />
            <h3>Không tìm thấy người dùng</h3>
            <p>Thử thay đổi bộ lọc hoặc tìm kiếm với từ khóa khác</p>
          </div>
        )}
      </div>

      {/* Create User Modal */}
      {showCreateForm && (
        <UserForm
          title="Thêm Người Dùng Mới"
          onSubmit={handleCreateUser}
          onClose={() => setShowCreateForm(false)}
        />
      )}

      {/* Edit User Modal */}
      {showEditForm && selectedUser && (
        <UserForm
          title="Chỉnh Sửa Người Dùng"
          user={selectedUser}
          onSubmit={handleUpdateUser}
          onClose={() => {
            setShowEditForm(false);
            setSelectedUser(null);
          }}
        />
      )}
    </div>
  );
};

// User Card Component
const UserCard = ({ user, onEdit, onDelete, onToggleStatus }) => {
  const status = USER_STATUS[user.status] || USER_STATUS['active'];
  const StatusIcon = status.icon;

  return (
    <div className="user-card">
      <div className="user-card-header">
        <div className="user-avatar">
          <User size={24} />
        </div>
        <div className="user-actions">
          <button 
            className="action-btn"
            onClick={() => onEdit(user)}
            title="Chỉnh sửa"
          >
            <Edit2 size={16} />
          </button>
          <button 
            className="action-btn"
            onClick={() => onToggleStatus(user)}
            title={user.status === 'active' ? 'Khóa tài khoản' : 'Kích hoạt tài khoản'}
          >
            {user.status === 'active' ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
          <button 
            className="action-btn delete"
            onClick={() => onDelete(user)}
            title="Xóa"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      <div className="user-info">
        <h3 className="user-email">{user.email}</h3>
        {user.displayName && (
          <p className="user-name">{user.displayName}</p>
        )}
        {user.phoneNumber && (
          <p className="user-phone">{formatUtils.formatPhoneNumber(user.phoneNumber)}</p>
        )}
      </div>

      <div className="user-meta">
        <div className={`status-badge ${status.color}`}>
          <StatusIcon size={14} />
          {status.name}
        </div>
      </div>

      <div className="user-footer">
        <span className="created-date">
          Tạo: {formatUtils.formatDate(user.createdAt)}
        </span>
        {user.lastLoginAt && (
          <span className="last-login">
            Đăng nhập: {formatUtils.formatRelativeTime(user.lastLoginAt)}
          </span>
        )}
      </div>
    </div>
  );
};

// Users Table Component  
const UsersTable = ({ users, onEdit, onDelete, onToggleStatus }) => {
  return (
    <div className="users-table-container">
      <table className="users-table">
        <thead>
          <tr>
            <th>Người dùng</th>
            <th>Trạng thái</th>
            <th>Ngày tạo</th>
            <th>Đăng nhập cuối</th>
            <th>Thao tác</th>
          </tr>
        </thead>
        <tbody>
          {users.map(user => {
            const status = USER_STATUS[user.status] || USER_STATUS['active'];
            const StatusIcon = status.icon;

            return (
              <tr key={user.id}>
                <td>
                  <div className="table-user-info">
                    <div className="table-user-avatar">
                      <User size={20} />
                    </div>
                    <div>
                      <div className="table-user-email">{user.email}</div>
                      {user.displayName && (
                        <div className="table-user-name">{user.displayName}</div>
                      )}
                      {user.phoneNumber && (
                        <div className="table-user-phone">{formatUtils.formatPhoneNumber(user.phoneNumber)}</div>
                      )}
                    </div>
                  </div>
                </td>
                <td>
                  <div className={`table-status-badge ${status.color}`}>
                    <StatusIcon size={14} />
                    {status.name}
                  </div>
                </td>
                <td>{formatUtils.formatDate(user.createdAt)}</td>
                <td>
                  {user.lastLoginAt ? formatUtils.formatRelativeTime(user.lastLoginAt) : 'Chưa đăng nhập'}
                </td>
                <td>
                  <div className="table-actions">
                    <button 
                      className="table-action-btn"
                      onClick={() => onEdit(user)}
                      title="Chỉnh sửa"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button 
                      className="table-action-btn"
                      onClick={() => onToggleStatus(user)}
                      title={user.status === 'active' ? 'Khóa tài khoản' : 'Kích hoạt tài khoản'}
                    >
                      {user.status === 'active' ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                    <button 
                      className="table-action-btn delete"
                      onClick={() => onDelete(user)}
                      title="Xóa"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

// User Form Component
const UserForm = ({ title, user, onSubmit, onClose }) => {
  const [formData, setFormData] = useState({
    email: user?.email || '',
    displayName: user?.displayName || '',
    phoneNumber: user?.phoneNumber || '',
    status: user?.status || 'active',
    password: '', // Only for new users
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.email) {
      alert('Vui lòng nhập email');
      return;
    }

    if (!user && !formData.password) {
      alert('Vui lòng nhập mật khẩu cho người dùng mới');
      return;
    }

    setIsSubmitting(true);
    try {
      // Ensure role is always 'user' for this form
      const userData = {
        ...formData,
        role: 'user'
      };
      await onSubmit(userData);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content user-form-modal">
        <div className="modal-header">
          <h2>{title}</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit} className="user-form">
          <div className="form-group">
            <label>Email *</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              required
              disabled={!!user} // Cannot change email for existing users
            />
          </div>

          <div className="form-group">
            <label>Tên hiển thị</label>
            <input
              type="text"
              value={formData.displayName}
              onChange={(e) => setFormData({...formData, displayName: e.target.value})}
            />
          </div>

          <div className="form-group">
            <label>Số điện thoại</label>
            <input
              type="tel"
              value={formData.phoneNumber}
              onChange={(e) => setFormData({...formData, phoneNumber: e.target.value})}
            />
          </div>

          {!user && (
            <div className="form-group">
              <label>Mật khẩu *</label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                required
                minLength={6}
              />
            </div>
          )}

          <div className="form-group">
            <label>Trạng thái</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({...formData, status: e.target.value})}
            >
              {Object.entries(USER_STATUS).map(([key, status]) => (
                <option key={key} value={key}>{status.name}</option>
              ))}
            </select>
          </div>

          <div className="form-actions">
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Hủy
            </button>
            <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
              {isSubmitting ? 'Đang xử lý...' : (user ? 'Cập nhật' : 'Tạo mới')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Users;