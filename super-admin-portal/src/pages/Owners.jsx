import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Plus, 
  Edit, 
  Trash2, 
  Lock, 
  Unlock, 
  Search,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Zap
} from 'lucide-react';
import SuperAdminService from '../services/superAdminService';

const Owners = () => {
  const [owners, setOwners] = useState([]);
  const [stations, setStations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [selectedOwner, setSelectedOwner] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState(null);

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
      setOwners(ownersData);
      setStations(stationsData);
    } catch (error) {
      console.error('Error loading data:', error);
      setError('Không thể tải dữ liệu. Vui lòng thử lại sau.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateOwner = async (ownerData) => {
    try {
      await SuperAdminService.createOwner(ownerData);
      await loadData();
      setShowCreateForm(false);
      // Log audit
      await SuperAdminService.createAuditLog({
        action: 'CREATE_OWNER',
        userId: 'super-admin',
        details: `Created owner: ${ownerData.name}`,
        entityType: 'Owner',
        entityId: ownerData.email
      });
    } catch (error) {
      console.error('Error creating owner:', error);
      alert('Lỗi khi tạo owner: ' + error.message);
    }
  };

  const handleUpdateOwner = async (ownerData) => {
    try {
      await SuperAdminService.updateOwner(selectedOwner.id, ownerData);
      await loadData();
      setShowEditForm(false);
      setSelectedOwner(null);
      // Log audit
      await SuperAdminService.createAuditLog({
        action: 'UPDATE_OWNER',
        userId: 'super-admin',
        details: `Updated owner: ${ownerData.name}`,
        entityType: 'Owner',
        entityId: selectedOwner.id
      });
    } catch (error) {
      console.error('Error updating owner:', error);
      alert('Lỗi khi cập nhật owner: ' + error.message);
    }
  };

  const handleDeleteOwner = async (owner) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa owner "${owner.name}"?`)) {
      return;
    }

    try {
      await SuperAdminService.deleteOwner(owner.id);
      await loadData();
      // Log audit
      await SuperAdminService.createAuditLog({
        action: 'DELETE_OWNER',
        userId: 'super-admin',
        details: `Deleted owner: ${owner.name}`,
        entityType: 'Owner',
        entityId: owner.id
      });
    } catch (error) {
      console.error('Error deleting owner:', error);
      alert('Lỗi khi xóa owner: ' + error.message);
    }
  };

  const handleToggleOwnerStatus = async (owner) => {
    const newStatus = owner.status === 'active' ? 'locked' : 'active';
    const action = newStatus === 'locked' ? 'khóa' : 'mở khóa';
    
    if (!confirm(`Bạn có chắc chắn muốn ${action} owner "${owner.name}"?`)) {
      return;
    }

    try {
      await SuperAdminService.toggleOwnerStatus(owner.id, newStatus);
      await loadData();
      // Log audit
      await SuperAdminService.createAuditLog({
        action: newStatus === 'locked' ? 'LOCK_OWNER' : 'UNLOCK_OWNER',
        userId: 'super-admin',
        details: `${action} owner: ${owner.name}`,
        entityType: 'Owner',
        entityId: owner.id
      });
    } catch (error) {
      console.error('Error toggling owner status:', error);
      alert(`Lỗi khi ${action} owner: ` + error.message);
    }
  };

  const getOwnerStations = (ownerId) => {
    return stations.filter(station => station.ownerId === ownerId);
  };

  const filteredOwners = owners.filter(owner =>
    owner.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    owner.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    owner.company?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('vi-VN');
  };

  if (isLoading) {
    return (
      <div className="page-header">
        <h1 className="page-title">Quản Lý Chủ Trạm</h1>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
          <div className="loading" style={{ width: '40px', height: '40px' }}></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-header">
        <h1 className="page-title">Quản Lý Chủ Trạm</h1>
        <div className="card" style={{ textAlign: 'center', padding: '2rem' }}>
          <p style={{ color: '#ef4444', fontWeight: '500' }}>{error}</p>
          <button onClick={loadData} className="btn btn-primary" style={{ marginTop: '1rem' }}>
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Quản Lý Chủ Trạm</h1>
        <p className="page-description">
          Quản lý chủ trạm sạc và quyền truy cập của họ
        </p>
      </div>

      {/* Controls */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1, maxWidth: '400px' }}>
            <Search size={20} color="#6b7280" />
            <input
              type="text"
              placeholder="Tìm kiếm owner..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                padding: '0.5rem',
                border: '1px solid #d1d5db',
                borderRadius: '0.375rem',
                flex: 1
              }}
            />
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

      {/* Owners List */}
      <div className="grid grid-1">
        {filteredOwners.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
            <Users size={48} color="#6b7280" style={{ marginBottom: '1rem' }} />
            <h3 style={{ marginBottom: '0.5rem' }}>Chưa có owner nào</h3>
            <p style={{ color: '#6b7280', marginBottom: '1.5rem' }}>
              {searchTerm ? 'Không tìm thấy owner phù hợp' : 'Hãy tạo owner đầu tiên'}
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
          filteredOwners.map((owner) => {
            const ownerStations = getOwnerStations(owner.id);
            return (
              <div key={owner.id} className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                      <div>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#1f2937', margin: 0 }}>
                          {owner.name}
                        </h3>
                        <p style={{ color: '#6b7280', margin: '0.25rem 0 0 0' }}>
                          {owner.company || 'Không có công ty'}
                        </p>
                      </div>
                      <div className={`status-badge ${owner.status === 'active' ? 'status-online' : 'status-offline'}`}>
                        {owner.status === 'active' ? '🟢 Hoạt Động' : '🔴 Bị Khóa'}
                      </div>
                    </div>

                    <div className="grid grid-2" style={{ marginBottom: '1rem' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                          <Mail size={14} color="#6b7280" />
                          <span style={{ fontSize: '0.875rem', color: '#374151' }}>
                            {owner.email}
                          </span>
                        </div>
                        {owner.phone && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                            <Phone size={14} color="#6b7280" />
                            <span style={{ fontSize: '0.875rem', color: '#374151' }}>
                              {owner.phone}
                            </span>
                          </div>
                        )}
                        {owner.address && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <MapPin size={14} color="#6b7280" />
                            <span style={{ fontSize: '0.875rem', color: '#374151' }}>
                              {owner.address}
                            </span>
                          </div>
                        )}
                      </div>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                          <Zap size={14} color="#6b7280" />
                          <span style={{ fontSize: '0.875rem', color: '#374151' }}>
                            {ownerStations.length} trạm sạc
                          </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <Calendar size={14} color="#6b7280" />
                          <span style={{ fontSize: '0.875rem', color: '#374151' }}>
                            Tạo: {formatDate(owner.createdAt)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Station List Preview */}
                    {ownerStations.length > 0 && (
                      <div style={{ 
                        backgroundColor: '#f8fafc', 
                        padding: '0.75rem', 
                        borderRadius: '0.375rem',
                        marginBottom: '1rem'
                      }}>
                        <p style={{ fontSize: '0.875rem', fontWeight: '500', margin: '0 0 0.5rem 0' }}>
                          Trạm sạc:
                        </p>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                          {ownerStations.slice(0, 3).map((station) => (
                            <span
                              key={station.id}
                              className="status-badge status-active"
                              style={{ fontSize: '0.75rem' }}
                            >
                              {station.id}
                            </span>
                          ))}
                          {ownerStations.length > 3 && (
                            <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                              +{ownerStations.length - 3} khác
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: '0.5rem', marginLeft: '1rem' }}>
                    <button
                      onClick={() => {
                        setSelectedOwner(owner);
                        setShowEditForm(true);
                      }}
                      className="btn btn-outline"
                      title="Chỉnh sửa"
                    >
                      <Edit size={14} />
                    </button>
                    <button
                      onClick={() => handleToggleOwnerStatus(owner)}
                      className={`btn ${owner.status === 'active' ? 'btn-secondary' : 'btn-success'}`}
                      title={owner.status === 'active' ? 'Khóa owner' : 'Mở khóa owner'}
                    >
                      {owner.status === 'active' ? <Lock size={14} /> : <Unlock size={14} />}
                    </button>
                    <button
                      onClick={() => handleDeleteOwner(owner)}
                      className="btn btn-danger"
                      title="Xóa owner"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Create Owner Modal */}
      {showCreateForm && (
        <OwnerForm
          title="Tạo Owner Mới"
          onSubmit={handleCreateOwner}
          onClose={() => setShowCreateForm(false)}
        />
      )}

      {/* Edit Owner Modal */}
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
  );
};

// Owner Form Component
const OwnerForm = ({ title, owner, onSubmit, onClose }) => {
  const [formData, setFormData] = useState({
    name: owner?.name || '',
    email: owner?.email || '',
    phone: owner?.phone || '',
    company: owner?.company || '',
    address: owner?.address || '',
    taxId: owner?.taxId || '',
    contactPerson: owner?.contactPerson || ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await onSubmit(formData);
    } catch (error) {
      console.error('Error submitting form:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '1rem'
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '0.75rem',
        width: '100%',
        maxWidth: '600px',
        maxHeight: '90vh',
        overflow: 'auto'
      }}>
        <div style={{
          padding: '1.5rem',
          borderBottom: '1px solid #e5e7eb',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: '600', margin: 0 }}>
            {title}
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '1.5rem',
              cursor: 'pointer',
              color: '#6b7280'
            }}
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '1.5rem' }}>
          <div className="grid grid-2" style={{ gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem' }}>
                Tên Owner *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.375rem'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem' }}>
                Email *
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.375rem'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem' }}>
                Số điện thoại
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.375rem'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem' }}>
                Công ty
              </label>
              <input
                type="text"
                name="company"
                value={formData.company}
                onChange={handleChange}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.375rem'
                }}
              />
            </div>

            <div style={{ gridColumn: 'span 2' }}>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem' }}>
                Địa chỉ
              </label>
              <textarea
                name="address"
                value={formData.address}
                onChange={handleChange}
                rows={3}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.375rem',
                  resize: 'vertical'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem' }}>
                Mã số thuế
              </label>
              <input
                type="text"
                name="taxId"
                value={formData.taxId}
                onChange={handleChange}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.375rem'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem' }}>
                Người liên hệ
              </label>
              <input
                type="text"
                name="contactPerson"
                value={formData.contactPerson}
                onChange={handleChange}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.375rem'
                }}
              />
            </div>
          </div>

          <div style={{ marginTop: '1.5rem', display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={onClose}
              className="btn btn-outline"
              disabled={isSubmitting}
            >
              Hủy
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <div className="loading" style={{ width: '16px', height: '16px' }} />
                  Đang xử lý...
                </>
              ) : (
                owner ? 'Cập nhật' : 'Tạo mới'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Owners;