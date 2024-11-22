import router from '../router';

export const handleAuthError = () => {
  // 清除所有认证信息
  localStorage.removeItem('authToken');
  localStorage.removeItem('userRole');
  localStorage.removeItem('username');
  localStorage.removeItem('userId');
  localStorage.removeItem('email');
  
  // 跳转到登录页面
  router.push('/login');
};

export const handleApiError = (error, customErrorHandler) => {
  console.error('API请求失败:', error);
  
  if (error.response) {
    switch (error.response.status) {
      case 403:
        // 权限不足，清除认证信息并退出
        handleAuthError();
        break;
      case 401:
        // 未认证，清除认证信息并退出
        handleAuthError();
        break;
      default:
        // 其他错误，调用自定义错误处理
        if (customErrorHandler) {
          customErrorHandler(error);
        } else {
          alert('操作失败，请重试。');
        }
    }
  } else if (error.request) {
    // 请求发出但没有收到响应
    alert('网络错误，请检查您的网络连接。');
  } else {
    // 请求配置出错
    alert('请求错误，请重试。');
  }
};
