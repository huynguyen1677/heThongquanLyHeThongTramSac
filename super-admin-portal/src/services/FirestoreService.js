/**
 * FirestoreService - Service chuyên xử lý các operations với Firestore Database
 * Kế thừa từ BaseService để sử dụng các utilities chung
 */

import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc,
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where,
  orderBy,
  limit,
  Timestamp 
} from 'firebase/firestore';
import { db } from './firebase';
import BaseService from './BaseService';

export class FirestoreService extends BaseService {

  // ===== GENERIC CRUD OPERATIONS =====

  /**
   * Lấy tất cả documents từ một collection
   * @param {string} collectionName - Tên collection
   * @param {Object} options - Options: orderField, orderDirection, limitCount
   */
  static async getAll(collectionName, options = {}) {
    try {
      const { orderField, orderDirection = 'desc', limitCount } = options;
      
      let q = collection(db, collectionName);
      
      if (orderField) {
        q = query(q, orderBy(orderField, orderDirection));
      }
      
      if (limitCount) {
        q = query(q, limit(limitCount));
      }
      
      const querySnapshot = await getDocs(q);
      const documents = [];
      
      querySnapshot.forEach((doc) => {
        documents.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      return documents;
    } catch (error) {
      return this.handleError(error, `Getting all documents from ${collectionName}`);
    }
  }

  /**
   * Lấy document theo ID
   * @param {string} collectionName - Tên collection
   * @param {string} documentId - ID của document
   */
  static async getById(collectionName, documentId) {
    try {
      const docRef = doc(db, collectionName, documentId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return {
          id: docSnap.id,
          ...docSnap.data()
        };
      }
      
      return null;
    } catch (error) {
      return this.handleError(error, `Getting document ${documentId} from ${collectionName}`);
    }
  }

  /**
   * Tạo document mới
   * @param {string} collectionName - Tên collection
   * @param {Object} data - Dữ liệu document
   * @param {string} customId - ID tùy chỉnh (optional)
   */
  static async create(collectionName, data, customId = null) {
    try {
      const now = Timestamp.now();
      const documentData = {
        ...data,
        createdAt: now,
        updatedAt: now
      };

      if (customId) {
        const docRef = doc(db, collectionName, customId);
        await setDoc(docRef, documentData);
        return { id: customId, ...documentData };
      } else {
        const collectionRef = collection(db, collectionName);
        const docRef = await addDoc(collectionRef, documentData);
        return { id: docRef.id, ...documentData };
      }
    } catch (error) {
      return this.handleError(error, `Creating document in ${collectionName}`);
    }
  }

  /**
   * Cập nhật document
   * @param {string} collectionName - Tên collection
   * @param {string} documentId - ID của document
   * @param {Object} data - Dữ liệu cập nhật
   */
  static async update(collectionName, documentId, data) {
    try {
      const docRef = doc(db, collectionName, documentId);
      const updateData = {
        ...data,
        updatedAt: Timestamp.now()
      };
      
      await updateDoc(docRef, updateData);
      return updateData;
    } catch (error) {
      return this.handleError(error, `Updating document ${documentId} in ${collectionName}`);
    }
  }

  /**
   * Xóa document
   * @param {string} collectionName - Tên collection
   * @param {string} documentId - ID của document
   */
  static async delete(collectionName, documentId) {
    try {
      const docRef = doc(db, collectionName, documentId);
      await deleteDoc(docRef);
      return true;
    } catch (error) {
      return this.handleError(error, `Deleting document ${documentId} from ${collectionName}`);
    }
  }

  /**
   * Query documents với điều kiện
   * @param {string} collectionName - Tên collection
   * @param {Array} conditions - Mảng điều kiện: [{field, operator, value}]
   * @param {Object} options - Options: orderField, orderDirection, limitCount
   */
  static async queryDocuments(collectionName, conditions = [], options = {}) {
    try {
      const { orderField, orderDirection = 'desc', limitCount } = options;
      
      let q = collection(db, collectionName);
      
      // Apply where conditions
      conditions.forEach(condition => {
        q = query(q, where(condition.field, condition.operator, condition.value));
      });
      
      // Apply ordering
      if (orderField) {
        q = query(q, orderBy(orderField, orderDirection));
      }
      
      // Apply limit
      if (limitCount) {
        q = query(q, limit(limitCount));
      }
      
      const querySnapshot = await getDocs(q);
      const documents = [];
      
      querySnapshot.forEach((doc) => {
        documents.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      return documents;
    } catch (error) {
      return this.handleError(error, `Querying documents from ${collectionName}`);
    }
  }

  // ===== STATIONS OPERATIONS =====

  /**
   * Lấy tất cả stations
   */
  static async getAllStations() {
    return this.getAll('stations', { 
      orderField: 'createdAt', 
      orderDirection: 'desc' 
    });
  }

  /**
   * Lấy stations theo owner ID
   * @param {string} ownerId - ID của owner
   */
  static async getStationsByOwner(ownerId) {
    return this.queryDocuments('stations', [
      { field: 'ownerId', operator: '==', value: ownerId }
    ], { orderField: 'createdAt', orderDirection: 'desc' });
  }

  /**
   * Lấy station theo ID
   * @param {string} stationId - ID của station
   */
  static async getStation(stationId) {
    return this.getById('stations', stationId);
  }

  /**
   * Tạo station mới
   * @param {Object} stationData - Dữ liệu station
   */
  static async createStation(stationData) {
    // Validate required fields
    this.validateRequiredFields(stationData, ['stationId', 'ownerId']);
    
    // Additional station-specific validations
    if (!this.isValidStationId(stationData.stationId)) {
      throw new Error('Invalid station ID format');
    }

    const enhancedData = {
      ...stationData,
      status: stationData.status || 'offline',
      lastHeartbeat: null,
      connectors: stationData.connectors || {
        1: {
          status: 'Available',
          errorCode: 'NoError',
          info: null,
          vendorId: null,
          vendorErrorCode: null,
          lastUpdate: new Date().toISOString()
        },
        2: {
          status: 'Available',
          errorCode: 'NoError',
          info: null,
          vendorId: null,
          vendorErrorCode: null,
          lastUpdate: new Date().toISOString()
        }
      }
    };

    return this.create('stations', enhancedData, stationData.stationId);
  }

  /**
   * Cập nhật station
   * @param {string} stationId - ID của station
   * @param {Object} updateData - Dữ liệu cập nhật
   */
  static async updateStation(stationId, updateData) {
    return this.update('stations', stationId, updateData);
  }

  /**
   * Xóa station
   * @param {string} stationId - ID của station
   */
  static async deleteStation(stationId) {
    return this.delete('stations', stationId);
  }

  /**
   * Kiểm tra station có tồn tại không
   * @param {string} stationId - ID của station
   */
  static async checkStationExists(stationId) {
    try {
      const station = await this.getStation(stationId);
      return station !== null;
    } catch (error) {
      this.handleError(error, `Checking station existence ${stationId}`, false);
      return false;
    }
  }

  // ===== OWNERS OPERATIONS =====

  /**
   * Lấy tất cả owners
   */
  static async getAllOwners() {
    return this.getAll('owners', { 
      orderField: 'createdAt', 
      orderDirection: 'desc' 
    });
  }

  /**
   * Lấy owner theo ID
   * @param {string} ownerId - ID của owner
   */
  static async getOwner(ownerId) {
    return this.getById('owners', ownerId);
  }

  /**
   * Tạo owner mới
   * @param {Object} ownerData - Dữ liệu owner
   */
  static async createOwner(ownerData) {
    // Validate required fields
    this.validateRequiredFields(ownerData, ['name', 'email']);
    
    // Validate email format
    if (!this.isValidEmail(ownerData.email)) {
      throw new Error('Invalid email format');
    }

    // Validate phone if provided
    if (ownerData.phone && !this.isValidPhone(ownerData.phone)) {
      throw new Error('Invalid phone number format');
    }

    const enhancedData = {
      ...ownerData,
      status: ownerData.status || 'active'
    };

    return this.create('owners', enhancedData);
  }

  /**
   * Cập nhật owner
   * @param {string} ownerId - ID của owner
   * @param {Object} updateData - Dữ liệu cập nhật
   */
  static async updateOwner(ownerId, updateData) {
    // Validate email if being updated
    if (updateData.email && !this.isValidEmail(updateData.email)) {
      throw new Error('Invalid email format');
    }

    // Validate phone if being updated
    if (updateData.phone && !this.isValidPhone(updateData.phone)) {
      throw new Error('Invalid phone number format');
    }

    return this.update('owners', ownerId, updateData);
  }

  /**
   * Xóa owner
   * @param {string} ownerId - ID của owner
   */
  static async deleteOwner(ownerId) {
    return this.delete('owners', ownerId);
  }

  /**
   * Toggle owner status
   * @param {string} ownerId - ID của owner
   * @param {string} status - Status mới ('active' hoặc 'inactive')
   */
  static async toggleOwnerStatus(ownerId, status) {
    return this.updateOwner(ownerId, { status });
  }

  // ===== SESSIONS OPERATIONS =====

  /**
   * Lấy sessions trong khoảng thời gian
   * @param {Date} startDate - Ngày bắt đầu
   * @param {Date} endDate - Ngày kết thúc
   * @param {string} ownerId - ID của owner (optional)
   */
  static async getSessionsInRange(startDate, endDate, ownerId = null) {
    const conditions = [
      { field: 'startTime', operator: '>=', value: Timestamp.fromDate(startDate) },
      { field: 'startTime', operator: '<=', value: Timestamp.fromDate(endDate) }
    ];

    if (ownerId) {
      conditions.push({ field: 'ownerId', operator: '==', value: ownerId });
    }

    return this.queryDocuments('chargingSessions', conditions, {
      orderField: 'startTime',
      orderDirection: 'desc'
    });
  }

  /**
   * Lấy sessions hôm nay
   */
  static async getTodaySessions() {
    const { startDate, endDate } = this.getDateRange('today');
    return this.getSessionsInRange(startDate, endDate);
  }

  /**
   * Lấy sessions theo owner
   * @param {string} ownerId - ID của owner
   * @param {string} timeRange - Khoảng thời gian
   * @param {number} selectedMonth - Tháng được chọn
   * @param {number} selectedYear - Năm được chọn
   */
  static async getSessionsByOwner(ownerId, timeRange = 'month', selectedMonth = null, selectedYear = null) {
    const { startDate, endDate } = this.getDateRange(timeRange, selectedMonth, selectedYear);
    return this.getSessionsInRange(startDate, endDate, ownerId);
  }

  // ===== PAYMENTS OPERATIONS =====

  /**
   * Lấy payments trong khoảng thời gian
   * @param {Date} startDate - Ngày bắt đầu
   * @param {Date} endDate - Ngày kết thúc
   * @param {string} status - Status của payment (optional)
   */
  static async getPaymentsInRange(startDate, endDate, status = 'completed') {
    try {
      // Temporary fix: Use simpler query to avoid index requirement
      // Only filter by createdAt to avoid composite index requirement
      const conditions = [
        { field: 'createdAt', operator: '>=', value: Timestamp.fromDate(startDate) },
        { field: 'createdAt', operator: '<=', value: Timestamp.fromDate(endDate) }
      ];

      const results = await this.queryDocuments('payment_history', conditions, {
        orderField: 'createdAt',
        orderDirection: 'desc'
      });

      // Filter in memory to avoid index requirement
      return results.filter(payment => {
        const isPaymentType = payment.type === 'payment';
        const isCorrectStatus = status ? payment.status === status : true;
        return isPaymentType && isCorrectStatus;
      });
    } catch (error) {
      console.warn('⚠️ Payment query failed, returning empty array:', error.message);
      return [];
    }
  }

  /**
   * Lấy payments hôm nay
   */
  static async getTodayPayments() {
    const { startDate, endDate } = this.getDateRange('today');
    return this.getPaymentsInRange(startDate, endDate);
  }

  /**
   * Lấy payments theo khoảng thời gian
   * @param {string} timeRange - Khoảng thời gian
   * @param {number} selectedMonth - Tháng được chọn
   * @param {number} selectedYear - Năm được chọn
   */
  static async getPaymentsByTimeRange(timeRange = 'month', selectedMonth = null, selectedYear = null) {
    const { startDate, endDate } = this.getDateRange(timeRange, selectedMonth, selectedYear);
    return this.getPaymentsInRange(startDate, endDate);
  }

  // ===== ERROR LOGS OPERATIONS =====

  /**
   * Lấy system errors
   * @param {number} limitCount - Số lượng error tối đa
   */
  static async getSystemErrors(limitCount = 50) {
    return this.getAll('system_errors', {
      orderField: 'timestamp',
      orderDirection: 'desc',
      limitCount
    });
  }

  /**
   * Tạo log error mới
   * @param {Object} errorData - Dữ liệu error
   */
  static async createErrorLog(errorData) {
    const enhancedData = {
      ...errorData,
      timestamp: Timestamp.now()
    };

    return this.create('system_errors', enhancedData);
  }

  // ===== AUDIT LOGS OPERATIONS =====

  /**
   * Lấy audit logs
   * @param {number} limitCount - Số lượng log tối đa
   */
  static async getAuditLogs(limitCount = 100) {
    return this.getAll('audit_logs', {
      orderField: 'timestamp',
      orderDirection: 'desc',
      limitCount
    });
  }

  /**
   * Tạo audit log mới
   * @param {Object} logData - Dữ liệu log
   */
  static async createAuditLog(logData) {
    const enhancedData = {
      ...logData,
      timestamp: Timestamp.now()
    };

    return this.create('audit_logs', enhancedData);
  }

  // ===== PRICING TEMPLATES OPERATIONS =====

  /**
   * Lấy tất cả pricing templates
   */
  static async getPricingTemplates() {
    return this.getAll('pricing_templates', {
      orderField: 'createdAt',
      orderDirection: 'desc'
    });
  }

  /**
   * Tạo pricing template mới
   * @param {Object} templateData - Dữ liệu template
   */
  static async createPricingTemplate(templateData) {
    this.validateRequiredFields(templateData, ['name', 'pricePerKwh']);
    
    return this.create('pricing_templates', templateData);
  }

  /**
   * Cập nhật pricing template
   * @param {string} templateId - ID của template
   * @param {Object} updateData - Dữ liệu cập nhật
   */
  static async updatePricingTemplate(templateId, updateData) {
    return this.update('pricing_templates', templateId, updateData);
  }

  // ===== TRANSACTIONS OPERATIONS =====

  /**
   * Lấy transactions theo owner
   * @param {string} ownerId - ID của owner
   */
  static async getTransactionsByOwner(ownerId) {
    return this.queryDocuments('transactions', [
      { field: 'ownerId', operator: '==', value: ownerId }
    ], { orderField: 'startTime', orderDirection: 'desc' });
  }

  // ===== BATCH OPERATIONS =====

  /**
   * Thực hiện nhiều operations cùng lúc
   * @param {Array} operations - Mảng các operations
   */
  static async batchOperations(operations) {
    try {
      const results = await Promise.all(
        operations.map(async (operation) => {
          const { type, collectionName, documentId, data } = operation;
          
          switch (type) {
            case 'create':
              return this.create(collectionName, data, documentId);
            case 'update':
              return this.update(collectionName, documentId, data);
            case 'delete':
              return this.delete(collectionName, documentId);
            default:
              throw new Error(`Unsupported batch operation type: ${type}`);
          }
        })
      );

      return results;
    } catch (error) {
      return this.handleError(error, 'Batch operations');
    }
  }
}

export default FirestoreService;