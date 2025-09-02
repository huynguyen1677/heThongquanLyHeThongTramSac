import React, { useState, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';
import '../styles/wallet-page.css';

function Wallet() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview'); // overview, deposit, withdraw, history
  const [depositAmount, setDepositAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('momo');
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);

  // Mock data - trong thực tế sẽ lấy từ API
  const walletData = {
    balance: 1250000, // VND
    monthlySpent: 450000,
    totalDeposited: 2500000,
    totalWithdrawn: 800000,
    pendingAmount: 0,
    lastUpdated: new Date()
  };

  const quickAmounts = [50000, 100000, 200000, 500000, 1000000, 2000000];

  const paymentMethods = [
    {
      id: 'momo',
      name: 'Ví MoMo',
      icon: 'fas fa-mobile-alt',
      color: 'momo',
      fee: '0₫',
      description: 'Chuyển khoản qua ví MoMo'
    },
    {
      id: 'zalopay',
      name: 'ZaloPay',
      icon: 'fas fa-wallet',
      color: 'zalopay',
      fee: '0₫',
      description: 'Thanh toán qua ZaloPay'
    },
    {
      id: 'vnpay',
      name: 'VNPay',
      icon: 'fas fa-credit-card',
      color: 'vnpay',
      fee: '0₫',
      description: 'Thanh toán qua VNPay'
    },
    {
      id: 'bank',
      name: 'Chuyển khoản',
      icon: 'fas fa-university',
      color: 'bank',
      fee: '0₫',
      description: 'Chuyển khoản ngân hàng'
    }
  ];

  // Mock transaction history
  const transactions = [
    {
      id: 1,
      type: 'deposit',
      amount: 500000,
      method: 'Ví MoMo',
      status: 'completed',
      date: new Date(2024, 0, 15, 14, 30),
      description: 'Nạp tiền vào ví',
      reference: 'DP001234'
    },
    {
      id: 2,
      type: 'payment',
      amount: -75000,
      method: 'Thanh toán sạc',
      status: 'completed',
      date: new Date(2024, 0, 14, 9, 15),
      description: 'Thanh toán phiên sạc tại Vincom Landmark 81',
      reference: 'PAY5678'
    },
    {
      id: 3,
      type: 'deposit',
      amount: 200000,
      method: 'ZaloPay',
      status: 'completed',
      date: new Date(2024, 0, 12, 16, 45),
      description: 'Nạp tiền vào ví',
      reference: 'DP001235'
    },
    {
      id: 4,
      type: 'payment',
      amount: -120000,
      method: 'Thanh toán sạc',
      status: 'completed',
      date: new Date(2024, 0, 10, 11, 20),
      description: 'Thanh toán phiên sạc tại Diamond Plaza',
      reference: 'PAY5679'
    },
    {
      id: 5,
      type: 'withdraw',
      amount: -300000,
      method: 'Chuyển khoản',
      status: 'pending',
      date: new Date(2024, 0, 8, 13, 10),
      description: 'Rút tiền về tài khoản ngân hàng',
      reference: 'WD001236'
    }
  ];

  const filteredTransactions = useMemo(() => {
    return transactions.sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [transactions]);

  const handleDeposit = () => {
    if (!depositAmount || depositAmount < 10000) {
      alert('Số tiền nạp tối thiểu là 10,000₫');
      return;
    }
    
    // Simulate deposit process
    alert(`Đang chuyển hướng đến ${paymentMethods.find(m => m.id === selectedPaymentMethod)?.name} để thanh toán ${parseInt(depositAmount).toLocaleString()}₫`);
    setShowDepositModal(false);
    setDepositAmount('');
  };

  const handleWithdraw = () => {
    if (!withdrawAmount || withdrawAmount < 50000) {
      alert('Số tiền rút tối thiểu là 50,000₫');
      return;
    }
    
    if (withdrawAmount > walletData.balance) {
      alert('Số dư không đủ để thực hiện giao dịch này');
      return;
    }
    
    // Simulate withdraw process
    alert(`Yêu cầu rút ${parseInt(withdrawAmount).toLocaleString()}₫ đã được gửi. Tiền sẽ chuyển về tài khoản trong 1-3 ngày làm việc.`);
    setShowWithdrawModal(false);
    setWithdrawAmount('');
  };

  if (!user) {
    return (
      <div className="wallet-container">
        <div className="auth-required">
          <div className="auth-icon">
            <i className="fas fa-wallet"></i>
          </div>
          <h1 className="auth-title">Ví điện tử</h1>
          <p className="auth-message">Vui lòng đăng nhập để quản lý ví của bạn</p>
          <Link to="/login" className="btn btn-primary btn-lg">
            <i className="fas fa-sign-in-alt"></i>
            Đăng nhập
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="wallet-container">
      {/* Header */}
      <div className="wallet-header">
        <div className="header-content">
          <div className="header-left">
            <h1 className="page-title">Ví điện tử</h1>
            <p className="page-subtitle">Quản lý số dư và giao dịch của bạn</p>
          </div>
          <div className="header-actions">
            <div className="wallet-balance-mini">
              <span className="balance-label">Số dư hiện tại</span>
              <span className="balance-amount">{walletData.balance.toLocaleString()}₫</span>
            </div>
          </div>
        </div>
      </div>

      {/* Balance Card */}
      <div className="balance-card">
        <div className="balance-card-content">
          <div className="balance-main">
            <div className="balance-info">
              <h2 className="balance-title">Số dư ví</h2>
              <p className="balance-amount-large">{walletData.balance.toLocaleString()}₫</p>
              <p className="balance-updated">
                Cập nhật lúc {walletData.lastUpdated.toLocaleTimeString('vi-VN')} - {walletData.lastUpdated.toLocaleDateString('vi-VN')}
              </p>
            </div>
            <div className="balance-icon">
              <i className="fas fa-wallet"></i>
            </div>
          </div>
          
          <div className="balance-actions">
            <button 
              className="btn btn-primary btn-balance"
              onClick={() => setShowDepositModal(true)}
            >
              <i className="fas fa-plus"></i>
              Nạp tiền
            </button>
            <button 
              className="btn btn-outline btn-balance"
              onClick={() => setShowWithdrawModal(true)}
            >
              <i className="fas fa-minus"></i>
              Rút tiền
            </button>
          </div>
        </div>

        {walletData.pendingAmount > 0 && (
          <div className="pending-notice">
            <i className="fas fa-clock"></i>
            <span>Có {walletData.pendingAmount.toLocaleString()}₫ đang xử lý</span>
          </div>
        )}
      </div>

      {/* Stats Cards */}
      <div className="wallet-stats-grid">
        <div className="stat-card stat-info">
          <div className="stat-content">
            <div className="stat-info-content">
              <p className="stat-label">Chi tiêu tháng này</p>
              <p className="stat-value">{walletData.monthlySpent.toLocaleString()}₫</p>
            </div>
            <div className="stat-icon icon-bg-info">
              <i className="fas fa-chart-line"></i>
            </div>
          </div>
        </div>
        
        <div className="stat-card stat-success">
          <div className="stat-content">
            <div className="stat-info-content">
              <p className="stat-label">Tổng đã nạp</p>
              <p className="stat-value">{walletData.totalDeposited.toLocaleString()}₫</p>
            </div>
            <div className="stat-icon icon-bg-success">
              <i className="fas fa-arrow-down"></i>
            </div>
          </div>
        </div>
        
        <div className="stat-card stat-warning">
          <div className="stat-content">
            <div className="stat-info-content">
              <p className="stat-label">Tổng đã rút</p>
              <p className="stat-value">{walletData.totalWithdrawn.toLocaleString()}₫</p>
            </div>
            <div className="stat-icon icon-bg-warning">
              <i className="fas fa-arrow-up"></i>
            </div>
          </div>
        </div>
      </div>

      {/* Transaction History */}
      <div className="transaction-section">
        <div className="transaction-header">
          <h3 className="transaction-title">Lịch sử giao dịch</h3>
          <div className="transaction-filter">
            <select className="filter-select">
              <option value="all">Tất cả giao dịch</option>
              <option value="deposit">Nạp tiền</option>
              <option value="withdraw">Rút tiền</option>
              <option value="payment">Thanh toán</option>
            </select>
          </div>
        </div>
        
        <div className="transaction-list">
          {filteredTransactions.length === 0 ? (
            <div className="empty-transactions">
              <div className="empty-icon">
                <i className="fas fa-receipt"></i>
              </div>
              <h3 className="empty-title">Chưa có giao dịch</h3>
              <p className="empty-message">Bạn chưa thực hiện giao dịch nào.</p>
            </div>
          ) : (
            filteredTransactions.map(transaction => (
              <TransactionItem key={transaction.id} transaction={transaction} />
            ))
          )}
        </div>
      </div>

      {/* Deposit Modal */}
      {showDepositModal && (
        <div className="modal-overlay">
          <div className="modal-content deposit-modal">
            <div className="modal-header">
              <h3 className="modal-title">
                <i className="fas fa-plus-circle"></i>
                Nạp tiền vào ví
              </h3>
              <button 
                className="modal-close"
                onClick={() => setShowDepositModal(false)}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            
            <div className="modal-body">
              {/* Amount Input */}
              <div className="input-group">
                <label className="input-label">Số tiền muốn nạp</label>
                <div className="amount-input-wrapper">
                  <input
                    type="number"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    placeholder="Nhập số tiền..."
                    className="amount-input"
                    min="10000"
                    max="50000000"
                  />
                  <span className="currency-suffix">₫</span>
                </div>
                <p className="input-note">Số tiền tối thiểu: 10,000₫ - Tối đa: 50,000,000₫</p>
              </div>

              {/* Quick Amount Buttons */}
              <div className="quick-amounts">
                <p className="quick-amounts-label">Chọn nhanh:</p>
                <div className="quick-amounts-grid">
                  {quickAmounts.map(amount => (
                    <button
                      key={amount}
                      className={`quick-amount-btn ${depositAmount == amount ? 'active' : ''}`}
                      onClick={() => setDepositAmount(amount.toString())}
                    >
                      {amount.toLocaleString()}₫
                    </button>
                  ))}
                </div>
              </div>

              {/* Payment Methods */}
              <div className="payment-methods">
                <p className="payment-methods-label">Phương thức thanh toán:</p>
                <div className="payment-methods-grid">
                  {paymentMethods.map(method => (
                    <div
                      key={method.id}
                      className={`payment-method ${selectedPaymentMethod === method.id ? 'selected' : ''}`}
                      onClick={() => setSelectedPaymentMethod(method.id)}
                    >
                      <div className={`payment-icon ${method.color}`}>
                        <i className={method.icon}></i>
                      </div>
                      <div className="payment-info">
                        <h4 className="payment-name">{method.name}</h4>
                        <p className="payment-description">{method.description}</p>
                        <span className="payment-fee">Phí: {method.fee}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="modal-footer">
              <button 
                className="btn btn-outline"
                onClick={() => setShowDepositModal(false)}
              >
                Hủy
              </button>
              <button 
                className="btn btn-primary"
                onClick={handleDeposit}
                disabled={!depositAmount || depositAmount < 10000}
              >
                <i className="fas fa-credit-card"></i>
                Nạp {depositAmount ? parseInt(depositAmount).toLocaleString() : '0'}₫
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Withdraw Modal */}
      {showWithdrawModal && (
        <div className="modal-overlay">
          <div className="modal-content withdraw-modal">
            <div className="modal-header">
              <h3 className="modal-title">
                <i className="fas fa-minus-circle"></i>
                Rút tiền từ ví
              </h3>
              <button 
                className="modal-close"
                onClick={() => setShowWithdrawModal(false)}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            
            <div className="modal-body">
              <div className="withdraw-balance-info">
                <div className="balance-available">
                  <span className="balance-label">Số dư khả dụng:</span>
                  <span className="balance-amount">{walletData.balance.toLocaleString()}₫</span>
                </div>
              </div>

              {/* Amount Input */}
              <div className="input-group">
                <label className="input-label">Số tiền muốn rút</label>
                <div className="amount-input-wrapper">
                  <input
                    type="number"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    placeholder="Nhập số tiền..."
                    className="amount-input"
                    min="50000"
                    max={walletData.balance}
                  />
                  <span className="currency-suffix">₫</span>
                </div>
                <p className="input-note">Số tiền tối thiểu: 50,000₫ - Tối đa: {walletData.balance.toLocaleString()}₫</p>
              </div>

              {/* Bank Info */}
              <div className="bank-info">
                <div className="info-item">
                  <span className="info-label">Ngân hàng:</span>
                  <span className="info-value">Vietcombank</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Số tài khoản:</span>
                  <span className="info-value">**** **** **34 5678</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Chủ tài khoản:</span>
                  <span className="info-value">{user.fullName}</span>
                </div>
              </div>

              <div className="withdraw-note">
                <i className="fas fa-info-circle"></i>
                <p>Tiền sẽ được chuyển về tài khoản ngân hàng trong 1-3 ngày làm việc. Phí rút tiền: 0₫</p>
              </div>
            </div>
            
            <div className="modal-footer">
              <button 
                className="btn btn-outline"
                onClick={() => setShowWithdrawModal(false)}
              >
                Hủy
              </button>
              <button 
                className="btn btn-warning"
                onClick={handleWithdraw}
                disabled={!withdrawAmount || withdrawAmount < 50000 || withdrawAmount > walletData.balance}
              >
                <i className="fas fa-money-bill-wave"></i>
                Rút {withdrawAmount ? parseInt(withdrawAmount).toLocaleString() : '0'}₫
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Transaction Item Component
const TransactionItem = ({ transaction }) => {
  const getTransactionConfig = (type, status) => {
    const configs = {
      deposit: {
        icon: 'fa-arrow-down',
        iconClass: 'transaction-icon-deposit',
        amountClass: 'amount-positive'
      },
      withdraw: {
        icon: 'fa-arrow-up', 
        iconClass: 'transaction-icon-withdraw',
        amountClass: 'amount-negative'
      },
      payment: {
        icon: 'fa-bolt',
        iconClass: 'transaction-icon-payment',
        amountClass: 'amount-negative'
      }
    };

    const statusClasses = {
      completed: 'status-completed',
      pending: 'status-pending',
      failed: 'status-failed'
    };

    return {
      ...configs[type],
      statusClass: statusClasses[status]
    };
  };

  const config = getTransactionConfig(transaction.type, transaction.status);

  return (
    <div className="transaction-item">
      <div className="transaction-main">
        <div className={`transaction-icon ${config.iconClass}`}>
          <i className={`fas ${config.icon}`}></i>
        </div>
        
        <div className="transaction-info">
          <h4 className="transaction-description">{transaction.description}</h4>
          <div className="transaction-details">
            <span className="transaction-method">{transaction.method}</span>
            <span className="transaction-separator">•</span>
            <span className="transaction-reference">#{transaction.reference}</span>
          </div>
          <p className="transaction-date">
            {transaction.date.toLocaleDateString('vi-VN', { 
              weekday: 'short',
              year: 'numeric', 
              month: 'short', 
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </p>
        </div>
      </div>
      
      <div className="transaction-right">
        <p className={`transaction-amount ${config.amountClass}`}>
          {transaction.amount > 0 ? '+' : ''}{transaction.amount.toLocaleString()}₫
        </p>
        <span className={`transaction-status ${config.statusClass}`}>
          {transaction.status === 'completed' && 'Hoàn thành'}
          {transaction.status === 'pending' && 'Đang xử lý'}
          {transaction.status === 'failed' && 'Thất bại'}
        </span>
      </div>
    </div>
  );
};

export default Wallet;