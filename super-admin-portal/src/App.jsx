import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import AdminLayout from './layouts/AdminLayout';
import Overview from './pages/Overview';
import Owners from './pages/Owners';
import './App.css';

function App() {
  return (
    <div className="admin-portal">
      <Router>
        <Routes>
          <Route path="/" element={<AdminLayout />}>
            <Route index element={<Navigate to="/overview" replace />} />
            <Route path="overview" element={<Overview />} />
            <Route path="owners" element={<Owners />} />
            <Route path="stations" element={<div>Trạm Sạc - Sắp Ra Mắt</div>} />
            <Route path="sessions" element={<div>Phiên Sạc - Sắp Ra Mắt</div>} />
            <Route path="pricing" element={<div>Mẫu Giá - Sắp Ra Mắt</div>} />
            <Route path="users" element={<div>Người Dùng & Quyền - Sắp Ra Mắt</div>} />
            <Route path="audits" element={<div>Nhật Ký Audit - Sắp Ra Mắt</div>} />
            <Route path="settings" element={<div>Cài Đặt - Sắp Ra Mắt</div>} />
          </Route>
        </Routes>
      </Router>
    </div>
  );
}

export default App;
