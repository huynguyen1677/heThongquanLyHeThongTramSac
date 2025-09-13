import React, { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  BarChart3, 
  Users, 
  Zap, 
  FileText, 
  DollarSign, 
  ClipboardList, 
  Settings,
  LogOut,
  Menu,
  User,
  Crown,
  Shield
} from 'lucide-react';
import './AdminLayout.css';

const AdminLayout = () => {
  const [sidebarOpen, setSidebarOpen] = React.useState(true);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const { logout, userProfile, currentUser } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
      // Redirect được xử lý bởi AuthContext
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setShowLogoutModal(false);
    }
  };

  const navigation = [
    {
      name: 'Tổng Quan',
      href: '/overview',
      icon: BarChart3,
      description: 'Tổng quan hệ thống và chỉ số'
    },
    {
      name: 'Chủ Trạm',
      href: '/owners',
      icon: Users,
      description: 'Quản lý chủ trạm sạc'
    },
    {
      name: 'Trạm Sạc',
      href: '/stations',
      icon: Zap,
      description: 'Giám sát và điều khiển trạm'
    },
    {
      name: 'Phiên Sạc',
      href: '/sessions',
      icon: FileText,
      description: 'Báo cáo phiên sạc'
    },
    {
      name: 'Mẫu Giá',
      href: '/pricing',
      icon: DollarSign,
      description: 'Chính sách giá mặc định'
    },
    {
      name: 'Người Dùng',
      href: '/users',
      icon: Users,
      description: 'Quản lý người dùng hệ thống'
    },
    {
      name: 'Nhật Ký Audit',
      href: '/audits',
      icon: ClipboardList,
      description: 'Nhật ký hoạt động hệ thống'
    },
    {
      name: 'Cài Đặt',
      href: '/settings',
      icon: Settings,
      description: 'Cấu hình hệ thống'
    }
  ];

  return (
    <div className="admin-layout">
      {/* Sidebar */}
      <div className={`sidebar ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
        <div className="sidebar-header">
          <div className="logo">
            <Zap className="logo-icon" />
            <span className="logo-text">Super Admin</span>
          </div>
          <button 
            className="sidebar-toggle"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            <Menu size={20} />
          </button>
        </div>

        <nav className="sidebar-nav">
          <ul className="nav-list">
            {navigation.map((item) => (
              <li key={item.name} className="nav-item">
                <NavLink
                  to={item.href}
                  className={({ isActive }) => 
                    `nav-link ${isActive ? 'nav-link-active' : ''}`
                  }
                >
                  <item.icon className="nav-icon" size={20} />
                  {sidebarOpen && (
                    <div className="nav-content">
                      <span className="nav-text">{item.name}</span>
                      <span className="nav-description">{item.description}</span>
                    </div>
                  )}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="sidebar-footer">
          {/* User Info */}
          <div className="user-info">
            <div className="user-avatar">
              {userProfile?.role === 'super-admin' ? (
                <Crown size={16} />
              ) : userProfile?.role === 'admin' ? (
                <Shield size={16} />
              ) : (
                <User size={16} />
              )}
            </div>
            {sidebarOpen && (
              <div className="user-details">
                <div className="user-name">
                  {userProfile?.name || currentUser?.displayName || 'Admin'}
                </div>
                <div className="user-role">
                  {userProfile?.role === 'super-admin' ? 'Super Admin' : 'Admin'}
                </div>
              </div>
            )}
          </div>

          {/* Logout Button */}
          <button 
            className="logout-btn"
            onClick={() => setShowLogoutModal(true)}
            title="Đăng xuất"
          >
            <LogOut size={20} />
            {sidebarOpen && <span>Đăng Xuất</span>}
          </button>
        </div>

        {/* Logout Confirmation Modal */}
        {showLogoutModal && (
          <div className="modal-overlay" onClick={() => setShowLogoutModal(false)}>
            <div className="logout-modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>Xác Nhận Đăng Xuất</h3>
              </div>
              <div className="modal-body">
                <p>Bạn có chắc chắn muốn đăng xuất khỏi hệ thống?</p>
              </div>
              <div className="modal-actions">
                <button 
                  className="btn btn-secondary"
                  onClick={() => setShowLogoutModal(false)}
                >
                  Hủy
                </button>
                <button 
                  className="btn btn-danger"
                  onClick={handleLogout}
                >
                  Đăng Xuất
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="main-content">
        <div className="content-wrapper">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default AdminLayout;