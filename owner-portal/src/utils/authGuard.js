/**
 * AuthGuard - Kiểm tra quyền truy cập cho Owner Portal
 */

export class AuthGuard {
  
  /**
   * Kiểm tra xem user có quyền truy cập Owner Portal không
   * @param {Object} user - User data
   * @returns {Object} - { allowed: boolean, reason: string }
   */
  static checkOwnerAccess(user) {
    if (!user) {
      return {
        allowed: false,
        reason: 'Vui lòng đăng nhập để tiếp tục'
      };
    }

    // Kiểm tra role
    if (user.role !== 'owner') {
      let redirectSuggestion = '';
      
      switch (user.role) {
        case 'admin':
        case 'super-admin':
          redirectSuggestion = 'Vui lòng sử dụng Super Admin Portal để quản trị hệ thống.';
          break;
        case 'user':
          redirectSuggestion = 'Vui lòng sử dụng User App để sạc xe.';
          break;
        default:
          redirectSuggestion = 'Liên hệ admin để được cấp quyền phù hợp.';
      }

      return {
        allowed: false,
        reason: `Bạn không có quyền truy cập Owner Portal. ${redirectSuggestion}`
      };
    }

    // Kiểm tra trạng thái active/inactive
    if (user.status === 'inactive') {
      return {
        allowed: false,
        reason: 'Tài khoản của bạn đã bị tạm khóa. Vui lòng liên hệ admin để biết thêm chi tiết.'
      };
    }

    // Tất cả điều kiện đều thỏa mãn
    return {
      allowed: true,
      reason: 'Truy cập được phép'
    };
  }

  /**
   * Middleware để bảo vệ các route
   * @param {Object} user - User data
   * @param {Function} onAccessDenied - Callback khi bị từ chối truy cập
   * @returns {boolean} - true nếu được phép truy cập
   */
  static validateAccess(user, onAccessDenied = null) {
    const { allowed, reason } = this.checkOwnerAccess(user);
    
    if (!allowed && onAccessDenied) {
      onAccessDenied(reason);
    }
    
    return allowed;
  }

  /**
   * Lấy thông tin về các portal khác
   * @param {string} userRole - Role của user
   * @returns {Object} - Thông tin portal phù hợp
   */
  static getRedirectInfo(userRole) {
    const portals = {
      'admin': {
        name: 'Super Admin Portal',
        url: '/super-admin',
        description: 'Quản trị toàn hệ thống'
      },
      'super-admin': {
        name: 'Super Admin Portal', 
        url: '/super-admin',
        description: 'Quản trị toàn hệ thống'
      },
      'user': {
        name: 'User App',
        url: '/user-app',
        description: 'Ứng dụng sạc xe cho người dùng'
      }
    };

    return portals[userRole] || {
      name: 'Trang chủ',
      url: '/',
      description: 'Quay về trang chủ'
    };
  }
}

export default AuthGuard;