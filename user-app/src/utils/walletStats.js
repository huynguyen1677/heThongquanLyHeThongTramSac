/**
 * Tính tổng chi tiêu thực tế cho các phiên sạc từ lịch sử giao dịch payment
 * @param {Array} transactions - Mảng lịch sử giao dịch
 * @returns {number} - Tổng số tiền đã thanh toán cho sạc (làm tròn đến hàng đồng)
 */
export function totalChargingPayment(transactions) {
  if (!Array.isArray(transactions)) {
    console.log('totalChargingPayment: transactions is not an array');
    return 0;
  }

  console.log('Calculating total charging payment from', transactions.length, 'transactions');
  
  let total = 0;
  let processedCount = 0;

  transactions.forEach((item, index) => {
    if (item.type === 'payment' && item.status === 'completed') {
      const amount = getTransactionAmount(item);
      
      if (amount > 0) {
        total += amount;
        processedCount++;
        console.log(`Added transaction ${item.id || index}: ${Math.round(amount).toLocaleString('vi-VN')}₫`);
      }
    }
  });

  const roundedTotal = Math.round(total);
  console.log(`Total charging payment: ${roundedTotal.toLocaleString('vi-VN')}₫ from ${processedCount} transactions`);
  return roundedTotal;
}

/**
 * Tính tổng chi tiêu thanh toán cho các phiên sạc trong tháng hiện tại
 * @param {Array} transactions - Mảng lịch sử giao dịch
 * @returns {number} - Tổng số tiền đã thanh toán cho sạc trong tháng này (làm tròn đến hàng đồng)
 */
export function monthlyChargingPayment(transactions) {
  if (!Array.isArray(transactions)) {
    console.log('monthlyChargingPayment: transactions is not an array');
    return 0;
  }

  const now = new Date();
  const currentMonth = now.getMonth(); // 0-11
  const currentYear = now.getFullYear();
  
  console.log(`Calculating monthly payment for ${currentMonth + 1}/${currentYear}`);
  console.log('Total transactions:', transactions.length);

  let monthlyTotal = 0;
  let processedCount = 0;

  transactions.forEach((item, index) => {
    // Chỉ tính các giao dịch thanh toán đã hoàn thành
    if (item.type === 'payment' && item.status === 'completed') {
      // Xử lý ngày tháng an toàn
      let transactionDate;
      
      if (item.date) {
        // Nếu là Firestore Timestamp
        if (item.date.toDate && typeof item.date.toDate === 'function') {
          transactionDate = item.date.toDate();
        }
        // Nếu là string hoặc number
        else if (typeof item.date === 'string' || typeof item.date === 'number') {
          transactionDate = new Date(item.date);
        }
        // Nếu đã là Date object
        else if (item.date instanceof Date) {
          transactionDate = item.date;
        }
      }
      
      // Fallback cho createdAt nếu không có date
      if (!transactionDate && item.createdAt) {
        if (item.createdAt.toDate && typeof item.createdAt.toDate === 'function') {
          transactionDate = item.createdAt.toDate();
        } else {
          transactionDate = new Date(item.createdAt);
        }
      }

      // Kiểm tra nếu giao dịch trong tháng hiện tại
      if (transactionDate && !isNaN(transactionDate.getTime())) {
        const transactionMonth = transactionDate.getMonth();
        const transactionYear = transactionDate.getFullYear();
        
        console.log(`Transaction ${index}: ${transactionDate.toLocaleDateString('vi-VN')}, Month: ${transactionMonth + 1}, Year: ${transactionYear}`);
        
        if (transactionMonth === currentMonth && transactionYear === currentYear) {
          // Lấy số tiền từ các trường khác nhau
          const amount = getTransactionAmount(item);
          
          if (amount > 0) {
            monthlyTotal += amount;
            processedCount++;
            console.log(`Added transaction ${item.id || index}: ${Math.round(amount).toLocaleString('vi-VN')}₫`);
          }
        }
      } else {
        console.log(`Transaction ${index}: Invalid date`, item.date, item.createdAt);
      }
    }
  });

  const roundedMonthlyTotal = Math.round(monthlyTotal);
  console.log(`Monthly total: ${roundedMonthlyTotal.toLocaleString('vi-VN')}₫ from ${processedCount} transactions`);
  return roundedMonthlyTotal;
}

/**
 * Lấy số tiền từ giao dịch với nhiều trường khác nhau
 * @param {Object} transaction - Đối tượng giao dịch
 * @returns {number} - Số tiền của giao dịch (làm tròn đến hàng đồng)
 */
function getTransactionAmount(transaction) {
  // Ưu tiên các trường cost phổ biến
  if (typeof transaction.estimatedCost === 'number' && transaction.estimatedCost > 0) {
    return Math.round(transaction.estimatedCost);
  }
  
  if (typeof transaction.cost === 'number' && transaction.cost > 0) {
    return Math.round(transaction.cost);
  }
  
  if (typeof transaction.totalCost === 'number' && transaction.totalCost > 0) {
    return Math.round(transaction.totalCost);
  }
  
  // Fallback sang amount
  if (typeof transaction.amount === 'number') {
    return Math.round(Math.abs(transaction.amount));
  }
  
  // Thử parse từ string
  const costFields = [
    transaction.estimatedCost,
    transaction.cost,
    transaction.totalCost,
    transaction.amount
  ];
  
  for (const field of costFields) {
    if (field !== null && field !== undefined) {
      const parsed = parseFloat(field);
      if (!isNaN(parsed) && parsed > 0) {
        return Math.round(Math.abs(parsed));
      }
    }
  }
  
  return 0;
}

/**
 * Tính chi tiêu theo khoảng thời gian tùy chỉnh
 * @param {Array} transactions - Mảng lịch sử giao dịch
 * @param {Date} startDate - Ngày bắt đầu
 * @param {Date} endDate - Ngày kết thúc
 * @returns {number} - Tổng số tiền đã thanh toán trong khoảng thời gian (làm tròn đến hàng đồng)
 */
export function getSpendingByDateRange(transactions, startDate, endDate) {
  if (!Array.isArray(transactions)) {
    console.log('getSpendingByDateRange: transactions is not an array');
    return 0;
  }

  if (!startDate || !endDate) {
    console.log('getSpendingByDateRange: Invalid date range');
    return 0;
  }

  console.log(`Calculating spending from ${startDate.toLocaleDateString('vi-VN')} to ${endDate.toLocaleDateString('vi-VN')}`);
  
  let total = 0;
  let processedCount = 0;

  transactions.forEach((item, index) => {
    if (item.type === 'payment' && item.status === 'completed') {
      let transactionDate;
      
      if (item.date) {
        if (item.date.toDate && typeof item.date.toDate === 'function') {
          transactionDate = item.date.toDate();
        } else {
          transactionDate = new Date(item.date);
        }
      } else if (item.createdAt) {
        if (item.createdAt.toDate && typeof item.createdAt.toDate === 'function') {
          transactionDate = item.createdAt.toDate();
        } else {
          transactionDate = new Date(item.createdAt);
        }
      }

      if (transactionDate && !isNaN(transactionDate.getTime())) {
        if (transactionDate >= startDate && transactionDate <= endDate) {
          const amount = getTransactionAmount(item);
          
          if (amount > 0) {
            total += amount;
            processedCount++;
          }
        }
      }
    }
  });

  const roundedTotal = Math.round(total);
  console.log(`Date range spending: ${roundedTotal.toLocaleString('vi-VN')}₫ from ${processedCount} transactions`);
  return roundedTotal;
}

/**
 * Tính chi tiêu của tuần hiện tại
 * @param {Array} transactions - Mảng lịch sử giao dịch
 * @returns {number} - Tổng số tiền đã thanh toán trong tuần này
 */
export function weeklyChargingPayment(transactions) {
  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay()); // Chủ nhật đầu tuần
  startOfWeek.setHours(0, 0, 0, 0);
  
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  endOfWeek.setHours(23, 59, 59, 999);
  
  return getSpendingByDateRange(transactions, startOfWeek, endOfWeek);
}

/**
 * Lấy thống kê chi tiêu tổng quan
 * @param {Array} transactions - Mảng lịch sử giao dịch
 * @returns {Object} - Đối tượng chứa các thống kê chi tiêu (tất cả đều làm tròn đến hàng đồng)
 */
export function getSpendingStats(transactions) {
  const totalSpending = totalChargingPayment(transactions);
  const monthlySpending = monthlyChargingPayment(transactions);
  const weeklySpending = weeklyChargingPayment(transactions);
  
  // Tính trung bình chi tiêu mỗi giao dịch
  const completedPayments = transactions.filter(t => t.type === 'payment' && t.status === 'completed');
  const averagePerTransaction = completedPayments.length > 0 ? 
    Math.round(totalSpending / completedPayments.length) : 0;
  
  return {
    total: totalSpending,
    monthly: monthlySpending,
    weekly: weeklySpending,
    averagePerTransaction,
    transactionCount: completedPayments.length
  };
}