import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { 
  BarChart3, 
  Users, 
  Zap, 
  FileText, 
  DollarSign, 
  Shield, 
  ClipboardList, 
  Settings,
  LogOut,
  Menu
} from 'lucide-react';
import './AdminLayout.css';

const AdminLayout = () => {
  const [sidebarOpen, setSidebarOpen] = React.useState(true);

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
      name: 'Người Dùng & Quyền',
      href: '/users',
      icon: Shield,
      description: 'Quản lý người dùng và quyền hạn'
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
          <button className="logout-btn">
            <LogOut size={20} />
            {sidebarOpen && <span>Đăng Xuất</span>}
          </button>
        </div>
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