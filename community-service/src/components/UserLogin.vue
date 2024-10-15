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
        const response = await axios.post('http://localhost:3000/api/auth/login', {
          email: this.email,      // 发送 email 和 password
          password: this.password,
        });
        
        // 登录成功后的操作
        alert(response.data.message);
        localStorage.setItem('authToken', response.data.token); // 保存 token
        this.$router.push('/profile'); // 跳转到用户个人中心页面
      } catch (error) {
        console.error('Login error:', error);
        // 提供更详细的错误信息
        if (error.response && error.response.data && error.response.data.message) {
          alert(error.response.data.message);
        } else {
          alert('登录失败，请检查您的邮箱和密码。');
        }
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
