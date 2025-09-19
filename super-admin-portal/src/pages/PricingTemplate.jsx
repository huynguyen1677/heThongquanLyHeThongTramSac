import React, { useState, useEffect } from 'react';
import { DollarSign, Save, RefreshCw, AlertCircle, Check, Edit3, History } from 'lucide-react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import './PricingTemplate.css';

const PricingTemplate = () => {
  const [currentPrice, setCurrentPrice] = useState(null);
  const [newPrice, setNewPrice] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [error, setError] = useState(null);

  // Lấy giá hiện tại từ Firestore
  const fetchCurrentPrice = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const priceDoc = await getDoc(doc(db, 'setting', 'pricePerKwh'));
      
      if (priceDoc.exists()) {
        const data = priceDoc.data();
        setCurrentPrice(data.value || 0);
        setNewPrice(data.value?.toString() || '');
        setLastUpdated(data.lastUpdated);
      } else {
        // Nếu document chưa tồn tại, tạo giá trị mặc định
        setCurrentPrice(3500);
        setNewPrice('3500');
        setLastUpdated(null);
      }
    } catch (err) {
      console.error('Error fetching price:', err);
      setError('Không thể lấy thông tin giá hiện tại. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  };

  // Cập nhật giá mới
  const handleUpdatePrice = async () => {
    if (!newPrice || isNaN(newPrice) || Number(newPrice) <= 0) {
      setError('Vui lòng nhập giá hợp lệ (số dương)');
      return;
    }

    try {
      setIsUpdating(true);
      setError(null);

      const priceValue = Number(newPrice);
      const updateData = {
        value: priceValue,
        lastUpdated: new Date().toISOString()
      };

      await updateDoc(doc(db, 'setting', 'pricePerKwh'), updateData);
      
      setCurrentPrice(priceValue);
      setLastUpdated(updateData.lastUpdated);
      setShowSuccessMessage(true);
      
      // Ẩn thông báo thành công sau 3 giây
      setTimeout(() => {
        setShowSuccessMessage(false);
      }, 3000);
      
    } catch (err) {
      console.error('Error updating price:', err);
      setError('Không thể cập nhật giá. Vui lòng thử lại.');
    } finally {
      setIsUpdating(false);
    }
  };

  // Hủy chỉnh sửa
  const handleCancelEdit = () => {
    setNewPrice(currentPrice?.toString() || '');
    setError(null);
  };

  // Định dạng ngày giờ
  const formatDateTime = (dateString) => {
    if (!dateString) return 'Chưa cập nhật';
    
    try {
      const date = new Date(dateString);
      return date.toLocaleString('vi-VN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    } catch {
      return 'Không xác định';
    }
  };

  // Định dạng tiền tệ
  const formatCurrency = (amount) => {
    if (!amount && amount !== 0) return '0';
    return Number(amount).toLocaleString('vi-VN');
  };

  useEffect(() => {
    fetchCurrentPrice();
  }, []);

  if (isLoading) {
    return (
      <div className="pricing-template">
        <div className="loading-container">
          <RefreshCw className="loading-spinner" size={32} />
          <p>Đang tải thông tin giá...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="pricing-template">
      <div className="page-header">
        <div className="header-content">
          <div className="header-title">
            <h1>Quản Lý Mẫu Giá</h1>
          </div>
          <p className="header-subtitle">
            Cấu hình giá điện mặc định cho toàn hệ thống trạm sạc
          </p>
        </div>
      </div>

      <div className="pricing-content">
        {/* Thông báo thành công */}
        {showSuccessMessage && (
          <div className="success-message">
            <Check size={20} />
            <span>Cập nhật giá thành công!</span>
          </div>
        )}

        {/* Thông báo lỗi */}
        {error && (
          <div className="error-message">
            <AlertCircle size={20} />
            <span>{error}</span>
          </div>
        )}

        {/* Card hiển thị giá hiện tại */}
        <div className="pricing-card">
          <div className="card-header">
            <h2>Giá Điện Hiện Tại</h2>
            <div className="card-actions">
              <button
                className="btn btn-refresh"
                onClick={fetchCurrentPrice}
                disabled={isLoading}
                title="Làm mới"
              >
                <RefreshCw size={16} />
              </button>
            </div>
          </div>

          <div className="card-body">
            <div className="current-price-display">
              <div className="price-value">
                <span className="price-number">{formatCurrency(currentPrice)}</span>
                <span className="price-unit">₫/kWh</span>
              </div>
              <div className="price-info">
                <div className="info-item">
                  <History size={16} />
                  <span>Cập nhật lần cuối: {formatDateTime(lastUpdated)}</span>
                </div>
              </div>
            </div>

            {/* Form chỉnh sửa giá */}
            <div className="price-editor">
              <h3>
                <Edit3 size={20} />
                Điều Chỉnh Giá
              </h3>
              
              <div className="editor-form">
                <div className="input-group">
                  <label htmlFor="newPrice">Giá mới (₫/kWh)</label>
                  <div className="input-with-unit">
                    <input
                      id="newPrice"
                      type="number"
                      value={newPrice}
                      onChange={(e) => setNewPrice(e.target.value)}
                      placeholder="Nhập giá mới..."
                      min="0"
                      step="100"
                      disabled={isUpdating}
                    />
                    <span className="input-unit">₫/kWh</span>
                  </div>
                </div>

                <div className="form-actions">
                  <button
                    className="btn btn-primary"
                    onClick={handleUpdatePrice}
                    disabled={isUpdating || !newPrice || newPrice === currentPrice?.toString()}
                  >
                    {isUpdating ? (
                      <>
                        <RefreshCw className="btn-spinner" size={16} />
                        Đang cập nhật...
                      </>
                    ) : (
                      <>
                        <Save size={16} />
                        Cập nhật giá
                      </>
                    )}
                  </button>
                  
                  <button
                    className="btn btn-secondary"
                    onClick={handleCancelEdit}
                    disabled={isUpdating}
                  >
                    Đặt lại
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Thông tin bổ sung */}
        <div className="info-card">
          <h3>Lưu ý quan trọng</h3>
          <ul>
            <li>Giá điện này sẽ áp dụng cho tất cả trạm sạc trong hệ thống</li>
            <li>Thay đổi giá sẽ có hiệu lực ngay lập tức cho các phiên sạc mới</li>
            <li>Các phiên sạc đang diễn ra sẽ không bị ảnh hưởng</li>
            <li>Hãy cân nhắc kỹ trước khi thay đổi giá để tránh ảnh hưởng đến người dùng</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default PricingTemplate;