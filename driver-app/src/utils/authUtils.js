export const handleAuthError = (error, setError) => {
    switch (error.code) {
      case 'auth/user-not-found':
        setError('Không tìm thấy tài khoản với email này.');
        break;
      case 'auth/wrong-password':
        setError('Mật khẩu không chính xác.');
        break;
      case 'auth/invalid-credential':
        setError('Thông tin đăng nhập không hợp lệ.');
        break;
      case 'auth/email-already-in-use':
        setError('Email này đã được sử dụng.');
        break;
      case 'auth/weak-password':
        setError('Mật khẩu quá yếu. Vui lòng chọn mật khẩu mạnh hơn.');
        break;
      case 'auth/invalid-email':
        setError('Email không hợp lệ.');
        break;
      case 'auth/user-disabled':
        setError('Tài khoản này đã bị vô hiệu hóa.');
        break;
      case 'auth/too-many-requests':
        setError('Quá nhiều lần thử. Vui lòng thử lại sau.');
        break;
      case 'auth/network-request-failed':
        setError('Lỗi kết nối mạng. Vui lòng kiểm tra internet và thử lại.');
        break;
      case 'auth/popup-closed-by-user':
        setError('Popup đăng nhập đã bị đóng.');
        break;
      case 'auth/cancelled-popup-request':
        setError('Yêu cầu đăng nhập đã bị hủy.');
        break;
      default:
        setError(`Đã xảy ra lỗi: ${error.message || 'Vui lòng thử lại.'}`);
    }
  };
