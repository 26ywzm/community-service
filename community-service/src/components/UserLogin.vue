<template>
  <div class="login-container">
    <h2>用户登录</h2>
    <form @submit.prevent="login">
      <div class="form-group">
        <label>邮箱：</label>
        <input type="email" v-model="email" required />
      </div>
      <div class="form-group">
        <label>密码：</label>
        <input type="password" v-model="password" required />
      </div>
      <button type="submit" class="login-button">登录</button>
    </form>
  </div>
</template>

<script>
import axios from 'axios';
import { handleApiError } from '../utils/errorHandler';
const API = process.env.VUE_APP_API_URL;

export default {
  name: 'UserLogin',
  data() {
    return {
      email: '',   // 使用 email 而不是 username
      password: '',
    };
  },
  methods: {
    async login() {
      try {
        const response = await axios.post(`${API}/login`, {
          email: this.email,      // 发送 email 和 password
          password: this.password,
        });

        const { token, user } = response.data;
        
        // 存储认证信息
        localStorage.setItem('authToken', token);
        localStorage.setItem('userRole', user.role);
        localStorage.setItem('username', user.username);
        localStorage.setItem('userId', user.id);
        localStorage.setItem('email', user.email);

        // 根据角色重定向
        switch(user.role) {
          case 'super_admin':
            await this.$router.push('/profile');
            break;
          case 'admin':
            await this.$router.push('/profile');
            break;
          default:
            await this.$router.push('/profile');
        }

      } catch (error) {
        // 根据错误类型显示不同的错误信息
        if (error.response) {
          // 服务器返回了错误响应
          if (error.response.status === 401) {
            alert('邮箱或密码错误，请重试。');
          } else if (error.response.data && error.response.data.message) {
            alert(error.response.data.message);
          } else {
            alert('登录失败，请稍后重试。');
          }
        } else if (error.request) {
          // 请求已发出，但没有收到响应
          alert('无法连接到服务器，请检查网络连接。');
        } else {
          // 请求配置出错
          alert('登录请求出错，请稍后重试。');
        }
        handleApiError(error);
      }
    },
  },
};
</script>

<style scoped>
/* 基本样式，您可以根据需要进行修改 */
.login-container {
  max-width: 400px;
  margin: 0 auto;
  padding: 20px;
  background-color: #f5f5f5;
  border-radius: 10px;
}

h2 {
  text-align: center;
}

.form-group {
  margin-bottom: 15px;
}

label {
  display: block;
  margin-bottom: 5px;
}

input {
  width: 100%;
  padding: 8px;
  box-sizing: border-box;
  border-radius: 4px;
  border: 1px solid #ccc;
}

.login-button {
  width: 100%;
  padding: 10px;
  background-color: #4CAF50;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.login-button:hover {
  background-color: #45a049;
}
</style>
