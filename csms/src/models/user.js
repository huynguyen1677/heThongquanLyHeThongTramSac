import { firestoreService } from '../services/firestore.js';
import { logger } from '../utils/logger.js';

/**
 * User Model - Quản lý thông tin user và số dư
 */
export class UserModel {
  /**
   * Lấy thông tin user theo ID
   * @param {string} userId - ID của user
   * @returns {Object|null} Thông tin user hoặc null
   */
  static async getUserById(userId) {
    try {
      if (!firestoreService.isAvailable()) {
        logger.warn('Firestore not available for getUserById');
        return null;
      }

      // Tìm user theo userId field thay vì document ID
      const usersRef = firestoreService.db.collection('users');
      const query = usersRef.where('userId', '==', userId);
      const snapshot = await query.get();
      
      if (!snapshot.empty) {
        const doc = snapshot.docs[0]; // Lấy document đầu tiên
        const userData = doc.data();
        logger.debug(`User retrieved by userId: ${userId}`);
        return {
          id: doc.id,
          ...userData
        };
      }
      
      // Fallback: thử tìm theo document ID (để tương thích ngược)
      const userRef = firestoreService.db.collection('users').doc(userId);
      const doc = await userRef.get();
      
      if (doc.exists) {
        const userData = doc.data();
        logger.debug(`User retrieved by document ID: ${userId}`);
        return {
          id: doc.id,
          ...userData
        };
      }
      
      logger.warn(`User not found: ${userId}`);
      return null;
    } catch (error) {
      logger.error(`Error getting user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Cập nhật số dư của user
   * @param {string} userId - ID của user
   * @param {number} newBalance - Số dư mới
   * @returns {boolean} Thành công hay không
   */
  static async updateUserBalance(userId, newBalance) {
    try {
      if (!firestoreService.isAvailable()) {
        logger.warn('Firestore not available for updateUserBalance');
        return false;
      }

      if (newBalance < 0) {
        throw new Error('Balance cannot be negative');
      }

      // Tìm user để lấy document ID thực tế
      const user = await this.getUserById(userId);
      if (!user) {
        throw new Error(`User not found: ${userId}`);
      }

      const userRef = firestoreService.db.collection('users').doc(user.id);
      await userRef.update({
        walletBalance: newBalance, // Sử dụng walletBalance theo chuẩn Firebase của bạn
        lastUpdated: new Date().toISOString()
      });
      
      logger.info(`User balance updated: ${userId} (${user.id}) -> ${newBalance}`);
      return true;
    } catch (error) {
      logger.error(`Error updating user balance ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Trừ tiền từ tài khoản user
   * @param {string} userId - ID của user
   * @param {number} amount - Số tiền cần trừ
   * @returns {Object} Kết quả với số dư mới
   */
  static async deductBalance(userId, amount) {
    try {
      // Lấy thông tin user hiện tại
      const user = await this.getUserById(userId);
      if (!user) {
        throw new Error(`User not found: ${userId}`);
      }

      // Kiểm tra số dư (sử dụng walletBalance)
      const currentBalance = user.walletBalance || 0;
      if (currentBalance < amount) {
        throw new Error(`Insufficient balance. Current: ${currentBalance}, Required: ${amount}`);
      }

      // Tính số dư mới
      const newBalance = currentBalance - amount;

      // Cập nhật số dư
      await this.updateUserBalance(userId, newBalance);

      logger.info(`Balance deducted: ${userId}, Amount: ${amount}, New balance: ${newBalance}`);
      
      return {
        userId,
        previousBalance: currentBalance,
        deductedAmount: amount,
        newBalance,
        success: true
      };
    } catch (error) {
      logger.error(`Error deducting balance for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Kiểm tra số dư của user
   * @param {string} userId - ID của user
   * @returns {number} Số dư hiện tại
   */
  static async getBalance(userId) {
    try {
      const user = await this.getUserById(userId);
      return user ? (user.walletBalance || 0) : 0; // Sử dụng walletBalance
    } catch (error) {
      logger.error(`Error getting balance for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Thêm tiền vào tài khoản user (cho việc nạp tiền)
   * @param {string} userId - ID của user
   * @param {number} amount - Số tiền cần thêm
   * @returns {Object} Kết quả với số dư mới
   */
  static async addBalance(userId, amount) {
    try {
      const user = await this.getUserById(userId);
      if (!user) {
        throw new Error(`User not found: ${userId}`);
      }

      const currentBalance = user.walletBalance || 0; // Sử dụng walletBalance
      const newBalance = currentBalance + amount;

      await this.updateUserBalance(userId, newBalance);

      logger.info(`Balance added: ${userId}, Amount: ${amount}, New balance: ${newBalance}`);
      
      return {
        userId,
        previousBalance: currentBalance,
        addedAmount: amount,
        newBalance,
        success: true
      };
    } catch (error) {
      logger.error(`Error adding balance for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Tìm user theo role
   * @param {string} role - Role của user (vd: "owner", "super-admin", "user")
   * @returns {Array} Danh sách users có role đó
   */
  static async getUsersByRole(role) {
    try {
      if (!firestoreService.isAvailable()) {
        logger.warn('Firestore not available for getUsersByRole');
        return [];
      }

      const usersRef = firestoreService.db.collection('users');
      const query = usersRef.where('role', '==', role);
      const snapshot = await query.get();
      
      const users = [];
      snapshot.forEach(doc => {
        const userData = doc.data();
        users.push({
          id: doc.id,
          ...userData
        });
      });

      logger.debug(`Found ${users.length} users with role: ${role}`);
      return users;
    } catch (error) {
      logger.error(`Error getting users by role ${role}:`, error);
      throw error;
    }
  }

  /**
   * Tìm user đầu tiên có role cụ thể
   * @param {string} role - Role của user
   * @returns {Object|null} User object hoặc null
   */
  static async getFirstUserByRole(role) {
    try {
      if (!firestoreService.isAvailable()) {
        logger.warn('Firestore not available for getFirstUserByRole');
        return null;
      }

      const usersRef = firestoreService.db.collection('users');
      const query = usersRef.where('role', '==', role).limit(1);
      const snapshot = await query.get();
      
      if (snapshot.empty) {
        logger.warn(`No user found with role: ${role}`);
        return null;
      }

      const doc = snapshot.docs[0];
      const userData = doc.data();
      
      logger.debug(`Found user with role ${role}: ${userData.userId || doc.id}`);
      return {
        id: doc.id,
        ...userData
      };
    } catch (error) {
      logger.error(`Error getting first user by role ${role}:`, error);
      throw error;
    }
  }

  /**
   * Kiểm tra user có role cụ thể không
   * @param {string} userId - ID của user
   * @param {string} expectedRole - Role cần kiểm tra
   * @returns {boolean} True nếu user có role đó
   */
  static async hasRole(userId, expectedRole) {
    try {
      const user = await this.getUserById(userId);
      if (!user) {
        return false;
      }

      return user.role === expectedRole;
    } catch (error) {
      logger.error(`Error checking role for user ${userId}:`, error);
      return false;
    }
  }

  /**
   * Cập nhật role của user
   * @param {string} userId - ID của user
   * @param {string} newRole - Role mới
   * @returns {boolean} Thành công hay không
   */
  static async updateUserRole(userId, newRole) {
    try {
      if (!firestoreService.isAvailable()) {
        logger.warn('Firestore not available for updateUserRole');
        return false;
      }

      // Tìm user để lấy document ID thực tế
      const user = await this.getUserById(userId);
      if (!user) {
        throw new Error(`User not found: ${userId}`);
      }

      const userRef = firestoreService.db.collection('users').doc(user.id);
      await userRef.update({
        role: newRole,
        roleUpdatedAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString()
      });
      
      logger.info(`User role updated: ${userId} (${user.id}) -> ${newRole}`);
      return true;
    } catch (error) {
      logger.error(`Error updating user role ${userId}:`, error);
      throw error;
    }
  }
}

export default UserModel;
