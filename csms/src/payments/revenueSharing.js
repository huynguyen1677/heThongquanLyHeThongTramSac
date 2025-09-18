import { UserModel } from '../models/user.js';
import { firestoreService } from '../services/firestore.js';
import { logger } from '../utils/logger.js';

/**
 * Revenue Sharing Service - Quản lý chia sẻ doanh thu giữa Owner và Super Admin
 * 
 * Mô hình chia sẻ:
 * - Owner nhận 90% doanh thu từ trạm sạc của họ
 * - Super Admin (nền tảng) nhận 10% hoa hồng từ mọi giao dịch
 */
export class RevenueSharing {
  
  /**
   * Tỷ lệ chia sẻ doanh thu (có thể config từ database sau này)
   */
  static COMMISSION_RATE = {
    SUPER_ADMIN: 0.10,  // 10% cho super admin
    OWNER: 0.90         // 90% cho owner
  };

  /**
   * Xử lý chia sẻ doanh thu sau khi user thanh toán thành công
   * @param {Object} revenueData - Dữ liệu doanh thu
   * @returns {Object} Kết quả chia sẻ doanh thu
   */
  static async processRevenueSharing(revenueData) {
    try {
      const {
        totalAmount,
        stationId,
        transactionId,
        userId: payerUserId,
        sessionDetails = {}
      } = revenueData;

      logger.info(`🔄 Processing revenue sharing for amount: ${totalAmount} VND`);

      // Bước 1: Lấy thông tin owner từ stationId
      const ownerId = await this.getStationOwnerId(stationId);
      if (!ownerId) {
        logger.warn(`⚠️ Cannot find owner for station: ${stationId}. Skipping revenue sharing.`);
        return {
          success: false,
          error: `Owner not found for station: ${stationId}`,
          totalAmount,
          message: 'Revenue sharing skipped - owner not found'
        };
      }

      logger.debug(`Found owner for station ${stationId}: ${ownerId}`);

      // Bước 2: Tính toán chia sẻ doanh thu
      const revenueCalculation = this.calculateRevenueSharing(totalAmount);

      // Bước 3: Lấy super admin user ID
      const superAdminId = await this.getSuperAdminUserId();
      logger.debug(`Super admin ID: ${superAdminId}`);

      // Bước 4: Validate owner có role "owner" không
      const ownerUser = await UserModel.getUserById(ownerId);
      if (!ownerUser) {
        logger.warn(`⚠️ Owner user not found: ${ownerId}. Skipping revenue sharing.`);
        return {
          success: false,
          error: `Owner user not found: ${ownerId}`,
          totalAmount,
          message: 'Revenue sharing skipped - owner user not found'
        };
      }

      if (ownerUser.role !== 'owner') {
        logger.warn(`⚠️ User ${ownerId} does not have 'owner' role (current role: ${ownerUser.role}). Skipping revenue sharing.`);
        return {
          success: false,
          error: `User ${ownerId} is not an owner (role: ${ownerUser.role})`,
          totalAmount,
          message: 'Revenue sharing skipped - user is not an owner'
        };
      }

      // Bước 5: Cập nhật số dư cho owner
      const ownerResult = await UserModel.addBalance(ownerId, revenueCalculation.ownerAmount);
      
      // Bước 6: Cập nhật số dư cho super admin
      let adminResult = null;
      try {
        adminResult = await UserModel.addBalance(superAdminId, revenueCalculation.commissionAmount);
        logger.info(`✅ Commission added to super admin ${superAdminId}: ${revenueCalculation.commissionAmount} VND`);
      } catch (adminError) {
        logger.warn(`⚠️ Failed to add commission to super admin ${superAdminId}:`, adminError.message);
        // Tạo mock result để tiếp tục quy trình
        adminResult = {
          userId: superAdminId,
          previousBalance: 0,
          addedAmount: revenueCalculation.commissionAmount,
          newBalance: revenueCalculation.commissionAmount,
          success: false,
          error: adminError.message
        };
      }

      // Bước 7: Lưu lịch sử chia sẻ doanh thu
      const sharingRecord = await this.saveRevenueSharingRecord({
        totalAmount,
        revenueCalculation,
        ownerId,
        superAdminId,
        stationId,
        transactionId,
        payerUserId,
        ownerResult,
        adminResult,
        sessionDetails
      });

      const result = {
        success: true,
        totalAmount,
        revenueSharing: {
          owner: {
            userId: ownerId,
            amount: revenueCalculation.ownerAmount,
            percentage: this.COMMISSION_RATE.OWNER * 100,
            newBalance: ownerResult.newBalance,
            success: ownerResult.success
          },
          superAdmin: {
            userId: superAdminId,
            amount: revenueCalculation.commissionAmount,
            percentage: this.COMMISSION_RATE.SUPER_ADMIN * 100,
            newBalance: adminResult.newBalance,
            success: adminResult.success,
            error: adminResult.error || null
          }
        },
        sharingRecord,
        processedAt: new Date().toISOString(),
        warnings: adminResult.success ? [] : [`Failed to update super admin balance: ${adminResult.error}`]
      };

      logger.info(`✅ Revenue sharing completed successfully:`, {
        totalAmount,
        ownerAmount: revenueCalculation.ownerAmount,
        commissionAmount: revenueCalculation.commissionAmount,
        ownerId,
        superAdminId
      });

      return result;

    } catch (error) {
      logger.error('❌ Error processing revenue sharing:', error);
      throw error;
    }
  }

  /**
   * Tính toán chia sẻ doanh thu
   * @param {number} totalAmount - Tổng số tiền
   * @returns {Object} Kết quả tính toán
   */
  static calculateRevenueSharing(totalAmount) {
    if (totalAmount <= 0) {
      throw new Error('Total amount must be greater than 0');
    }

    const commissionAmount = Math.round(totalAmount * this.COMMISSION_RATE.SUPER_ADMIN);
    const ownerAmount = totalAmount - commissionAmount;

    return {
      totalAmount,
      commissionAmount,
      ownerAmount,
      commissionRate: this.COMMISSION_RATE.SUPER_ADMIN,
      ownerRate: this.COMMISSION_RATE.OWNER
    };
  }

  /**
   * Lấy Owner ID từ Station ID
   * @param {string} stationId - ID của trạm sạc
   * @returns {string|null} Owner ID (userId)
   */
  static async getStationOwnerId(stationId) {
    try {
      if (!firestoreService.isAvailable()) {
        logger.warn('Firestore not available for getStationOwnerId');
        return null;
      }

      // Tìm station để lấy ownerId
      const stationRef = firestoreService.db.collection('stations').doc(stationId);
      const stationDoc = await stationRef.get();

      if (!stationDoc.exists) {
        throw new Error(`Station not found: ${stationId}`);
      }

      const stationData = stationDoc.data();
      let ownerId = stationData.ownerId || stationData.owner_id || null;

      if (!ownerId) {
        logger.warn(`Station ${stationId} has no ownerId field`);
        return null;
      }

      // Nếu ownerId là email, cần tìm userId tương ứng
      if (ownerId.includes('@')) {
        logger.info(`Owner ID is email: ${ownerId}, finding corresponding userId...`);
        
        // Tìm user có email này
        const usersRef = firestoreService.db.collection('users');
        const emailQuery = usersRef.where('email', '==', ownerId);
        const emailSnapshot = await emailQuery.get();
        
        if (!emailSnapshot.empty) {
          const userDoc = emailSnapshot.docs[0];
          const userData = userDoc.data();
          const userId = userData.userId || userDoc.id;
          logger.info(`Found userId for email ${ownerId}: ${userId}`);
          return userId;
        } else {
          logger.warn(`No user found with email: ${ownerId}`);
          return null;
        }
      }

      // Nếu ownerId không phải email, trả về luôn
      logger.debug(`Station ${stationId} owner ID: ${ownerId}`);
      return ownerId;

    } catch (error) {
      logger.error(`Error getting station owner ID for ${stationId}:`, error);
      throw error;
    }
  }

  /**
   * Lấy Super Admin User ID (cố định userId = "100006")
   * @returns {string} Super Admin User ID
   */
  static async getSuperAdminUserId() {
    // Cố định super admin userId theo yêu cầu
    const SUPER_ADMIN_USER_ID = "100006";
    
    try {
      // Kiểm tra user có tồn tại không
      const superAdminUser = await UserModel.getUserById(SUPER_ADMIN_USER_ID);
      if (!superAdminUser) {
        logger.warn(`Super admin user ${SUPER_ADMIN_USER_ID} not found. Trying to find any super-admin...`);
        
        // Fallback: tìm bất kỳ user nào có role super-admin
        if (firestoreService.isAvailable()) {
          const usersRef = firestoreService.db.collection('users');
          const query = usersRef.where('role', '==', 'super-admin').limit(1);
          const snapshot = await query.get();
          
          if (!snapshot.empty) {
            const doc = snapshot.docs[0];
            const userData = doc.data();
            const fallbackId = userData.userId || doc.id;
            logger.info(`Found fallback super-admin: ${fallbackId}`);
            return fallbackId;
          }
        }
        
        // Nếu không tìm thấy gì, log warning và trả về ID cố định để tiếp tục
        logger.warn(`No super-admin found. Using fixed ID: ${SUPER_ADMIN_USER_ID}`);
        return SUPER_ADMIN_USER_ID;
      }

      // Kiểm tra role có đúng không (optional, không bắt buộc)
      if (superAdminUser.role && superAdminUser.role !== 'super-admin') {
        logger.warn(`User ${SUPER_ADMIN_USER_ID} does not have super-admin role (current role: ${superAdminUser.role})`);
      }

      logger.debug(`Found super-admin user: ${SUPER_ADMIN_USER_ID}`);
      return SUPER_ADMIN_USER_ID;

    } catch (error) {
      logger.error('Error getting super admin user ID:', error);
      // Trong trường hợp lỗi, vẫn trả về ID cố định để hệ thống tiếp tục hoạt động
      logger.warn(`Fallback to fixed super admin ID: ${SUPER_ADMIN_USER_ID}`);
      return SUPER_ADMIN_USER_ID;
    }
  }

  /**
   * Lưu lịch sử chia sẻ doanh thu
   * @param {Object} recordData - Dữ liệu record
   * @returns {Object} Record đã lưu
   */
  static async saveRevenueSharingRecord(recordData) {
    try {
      if (!firestoreService.isAvailable()) {
        logger.warn('Firestore not available for saveRevenueSharingRecord');
        return null;
      }

      const {
        totalAmount,
        revenueCalculation,
        ownerId,
        superAdminId,
        stationId,
        transactionId,
        payerUserId,
        ownerResult,
        adminResult,
        sessionDetails
      } = recordData;

      const sharingRecord = {
        type: 'revenue_sharing',
        totalAmount,
        commission: {
          amount: revenueCalculation.commissionAmount,
          rate: revenueCalculation.commissionRate,
          recipientId: superAdminId,
          recipientRole: 'super-admin',
          previousBalance: adminResult.previousBalance,
          newBalance: adminResult.newBalance
        },
        ownerRevenue: {
          amount: revenueCalculation.ownerAmount,
          rate: revenueCalculation.ownerRate,
          recipientId: ownerId,
          recipientRole: 'owner',
          previousBalance: ownerResult.previousBalance,
          newBalance: ownerResult.newBalance
        },
        transaction: {
          transactionId,
          stationId,
          payerUserId,
          sessionDetails
        },
        status: 'completed',
        createdAt: new Date().toISOString()
      };

      // Lưu vào collection revenue_sharing_history
      const recordRef = firestoreService.db.collection('revenue_sharing_history').doc();
      await recordRef.set(sharingRecord);

      sharingRecord.id = recordRef.id;
      logger.debug(`Revenue sharing record saved: ${recordRef.id}`);

      return sharingRecord;

    } catch (error) {
      logger.error('Error saving revenue sharing record:', error);
      return null;
    }
  }

  /**
   * Lấy lịch sử chia sẻ doanh thu
   * @param {Object} options - Tùy chọn filter
   * @returns {Array} Danh sách lịch sử
   */
  static async getRevenueSharingHistory(options = {}) {
    try {
      if (!firestoreService.isAvailable()) {
        logger.warn('Firestore not available for getRevenueSharingHistory');
        return [];
      }

      const {
        userId,
        stationId,
        limit = 50,
        startDate,
        endDate
      } = options;

      let query = firestoreService.db.collection('revenue_sharing_history')
        .orderBy('createdAt', 'desc');

      // Filter theo userId (có thể là owner hoặc super admin)
      if (userId) {
        query = query.where('ownerRevenue.recipientId', '==', userId)
          .or(query.where('commission.recipientId', '==', userId));
      }

      // Filter theo stationId
      if (stationId) {
        query = query.where('transaction.stationId', '==', stationId);
      }

      // Filter theo thời gian
      if (startDate) {
        query = query.where('createdAt', '>=', startDate);
      }
      if (endDate) {
        query = query.where('createdAt', '<=', endDate);
      }

      query = query.limit(limit);

      const snapshot = await query.get();
      const history = [];

      snapshot.forEach(doc => {
        history.push({
          id: doc.id,
          ...doc.data()
        });
      });

      logger.debug(`Retrieved ${history.length} revenue sharing records`);
      return history;

    } catch (error) {
      logger.error('Error getting revenue sharing history:', error);
      return [];
    }
  }

  /**
   * Lấy thống kê doanh thu cho owner
   * @param {string} ownerId - ID của owner
   * @param {Object} options - Tùy chọn thống kê
   * @returns {Object} Thống kê doanh thu
   */
  static async getOwnerRevenueStats(ownerId, options = {}) {
    try {
      const {
        startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 ngày trước
        endDate = new Date().toISOString()
      } = options;

      const history = await this.getRevenueSharingHistory({
        userId: ownerId,
        startDate,
        endDate,
        limit: 1000
      });

      const stats = {
        totalRevenue: 0,
        totalTransactions: 0,
        averageRevenue: 0,
        period: { startDate, endDate }
      };

      // Chỉ tính các record mà user này là owner
      const ownerRecords = history.filter(record => 
        record.ownerRevenue.recipientId === ownerId
      );

      stats.totalTransactions = ownerRecords.length;
      stats.totalRevenue = ownerRecords.reduce((sum, record) => 
        sum + record.ownerRevenue.amount, 0
      );
      stats.averageRevenue = stats.totalTransactions > 0 
        ? Math.round(stats.totalRevenue / stats.totalTransactions) 
        : 0;

      return stats;

    } catch (error) {
      logger.error(`Error getting owner revenue stats for ${ownerId}:`, error);
      throw error;
    }
  }

  /**
   * Lấy thống kê hoa hồng cho super admin
   * @param {Object} options - Tùy chọn thống kê
   * @returns {Object} Thống kê hoa hồng
   */
  static async getSuperAdminCommissionStats(options = {}) {
    try {
      const {
        startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        endDate = new Date().toISOString()
      } = options;

      const superAdminId = await this.getSuperAdminUserId();
      if (!superAdminId) {
        throw new Error('Super admin not found');
      }

      const history = await this.getRevenueSharingHistory({
        startDate,
        endDate,
        limit: 1000
      });

      const stats = {
        totalCommission: 0,
        totalTransactions: 0,
        averageCommission: 0,
        totalRevenue: 0,
        period: { startDate, endDate }
      };

      stats.totalTransactions = history.length;
      stats.totalCommission = history.reduce((sum, record) => 
        sum + record.commission.amount, 0
      );
      stats.totalRevenue = history.reduce((sum, record) => 
        sum + record.totalAmount, 0
      );
      stats.averageCommission = stats.totalTransactions > 0 
        ? Math.round(stats.totalCommission / stats.totalTransactions) 
        : 0;

      return stats;

    } catch (error) {
      logger.error('Error getting super admin commission stats:', error);
      throw error;
    }
  }
}

export default RevenueSharing;