import router from '../router';

export const handleAuthError = (shouldRedirect = true) => {
  // 清除所有认证信息
  localStorage.removeItem('authToken');
  localStorage.removeItem('userRole');
  localStorage.removeItem('username');
  localStorage.removeItem('userId');
  localStorage.removeItem('email');
  
  if (shouldRedirect) {
    // 跳转到登录页面
    router.push('/login');
  }
};

export const handleApiError = (error, options = {}) => {
  const {
    customErrorHandler = null,
    suppressAuthError = false,
    showAlert = true
  } = options;

  console.error('API请求失败:', error);
  
  if (error.response) {
    const status = error.response.status;
    const message = error.response.data?.message || '操作失败，请重试。';
    const userRole = localStorage.getItem('userRole');

    // 如果是admin用户且是权限相关错误，显示提示而不是登出
    if ((status === 401 || status === 403) && userRole === 'admin') {
      if (showAlert) {
        alert(status === 403 ? '您没有权限执行此操作' : '您的操作未被授权，请联系超级管理员');
      }
      return Promise.reject(error);
    }

    switch (status) {
      case 403:
      case 401:
        if (!suppressAuthError) {
          handleAuthError();
        } else if (showAlert) {
          alert('您的登录已过期，请重新登录');
          router.push('/login');
        }
        break;
      default:
        if (customErrorHandler) {
          customErrorHandler(error);
        } else if (showAlert) {
          alert(message);
        }
    }
  } else if (error.request) {
    if (showAlert) {
      alert('网络错误，请检查您的网络连接。');
    }
  } else {
    if (showAlert) {
      alert('请求错误，请重试。');
    }
  }
  
  return Promise.reject(error);
};
