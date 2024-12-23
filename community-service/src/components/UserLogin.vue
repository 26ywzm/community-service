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
const API = process.env.VUE_APP_API_URL;

export default {
  name: 'UserLogin',
  data() {
    return {
      email: '',   
      password: '',
    };
  },
  methods: {
    async login() {
      try {
        const response = await axios.post(`${API}/login`, {
          email: this.email,
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
            await this.$router.push('/');
            break;
        }
      } catch (error) {
        // 处理不同类型的错误
        if (error.response) {
          // 服务器返回错误状态码
          switch (error.response.status) {
            case 401:
              alert('登录失败：邮箱或密码错误');
              break;
            case 404:
              alert('登录失败：用户不存在');
              break;
            case 429:
              alert('登录失败：尝试次数过多，请稍后再试');
              break;
            default:
              alert('登录失败：' + (error.response.data.message || '未知错误'));
          }
        } else if (error.request) {
          // 请求发出但没有收到响应
          alert('登录失败：无法连接到服务器，请检查网络连接');
        } else {
          // 请求设置时发生错误
          alert('登录失败：' + error.message);
        }
        console.error('登录错误:', error);
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
