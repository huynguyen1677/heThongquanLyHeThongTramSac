import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import AdminLayout from './layouts/AdminLayout';
import Login from './pages/Login';
import Setup from './pages/Setup';
import Overview from './pages/Overview';
import Owners from './pages/Owners';
import Users from './pages/Users';
import PricingTemplate from './pages/PricingTemplate';
import './App.css';

function App() {
  return (
    <div className="admin-portal">
      <AuthProvider>
        <Router>
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/setup" element={<Setup />} />
            
            {/* Protected Routes */}
            <Route path="/" element={
              <ProtectedRoute>
                <AdminLayout />
              </ProtectedRoute>
            }>
              <Route index element={<Navigate to="/overview" replace />} />
              <Route path="overview" element={<Overview />} />
              <Route path="owners" element={<Owners />} />
              <Route path="stations" element={<div>Trạm Sạc - Sắp Ra Mắt</div>} />
              <Route path="sessions" element={<div>Phiên Sạc - Sắp Ra Mắt</div>} />
              <Route path="pricing" element={<PricingTemplate />} />
              <Route path="users" element={<Users />} />
              <Route path="audits" element={<div>Nhật Ký Audit - Sắp Ra Mắt</div>} />
              <Route path="settings" element={<div>Cài Đặt - Sắp Ra Mắt</div>} />
            </Route>

            {/* Catch all - redirect to login */}
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </Router>
      </AuthProvider>
    </div>
  );
}

export default App;
