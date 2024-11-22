import axios from 'axios';

const API = process.env.VUE_APP_API_URL;

export const verifyAuth = async () => {
  try {
    const token = localStorage.getItem('authToken');
    if (!token) {
      return { valid: false, reason: 'no-token' };
    }

    const response = await axios.get(`${API}/verify`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.data.valid) {
      // 如果角色不匹配，更新为正确的角色
      if (response.data.correctRole) {
        localStorage.setItem('userRole', response.data.correctRole);
        return { valid: false, reason: 'role-mismatch', newRole: response.data.correctRole };
      } else {
        // 如果验证完全失败，清除所有认证信息
        localStorage.removeItem('authToken');
        localStorage.removeItem('userRole');
        localStorage.removeItem('username');
        localStorage.removeItem('userId');
        localStorage.removeItem('email');
        return { valid: false, reason: 'invalid-token' };
      }
    }

    return { valid: true, role: response.data.role };
  } catch (error) {
    console.error('验证失败:', error);
    if (error.response && error.response.status === 401) {
      // 只在401错误时清除认证信息
      localStorage.removeItem('authToken');
      localStorage.removeItem('userRole');
      localStorage.removeItem('username');
      localStorage.removeItem('userId');
      localStorage.removeItem('email');
      return { valid: false, reason: 'unauthorized' };
    }
    // 其他错误（如网络错误）不做处理
    return { valid: true };
  }
};
