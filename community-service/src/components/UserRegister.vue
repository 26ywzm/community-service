<template>
  <div class="register-container">
    <h2>用户注册</h2>
    <form @submit.prevent="register">
      <div class="form-group">
        <label>用户名：</label>
        <input type="text" v-model="username" required />
      </div>
      <div class="form-group">
        <label>邮箱：</label>
        <input type="email" v-model="email" required />
      </div>
      <div class="form-group">
        <label>密码：</label>
        <input type="password" v-model="password" required />
      </div>
      <div class="form-group">
        <label>确认密码：</label>
        <input type="password" v-model="confirmPassword" required />
      </div>
      <button type="submit" class="register-button">注册</button>
    </form>
  </div>
</template>

<script>
import axios from 'axios';
import { handleApiError } from '../utils/errorHandler';
const API = process.env.VUE_APP_API_URL;

export default {
  name: 'UserRegister',
  data() {
    return {
      username: '',
      email: '',
      password: '',
      confirmPassword: ''
    };
  },
  methods: {
    async register() {
      if (this.password !== this.confirmPassword) {
        alert('两次输入的密码不一致');
        return;
      }

      try {
        await axios.post(`${API}/register`, {
          username: this.username,
          email: this.email,
          password: this.password
        });

        alert('注册成功！请登录');
        this.$router.push('/login');
      } catch (error) {
        handleApiError(error, () => {
          if (error.response?.data?.message) {
            alert(error.response.data.message);
          } else {
            alert('注册失败，请重试');
          }
        });
      }
    }
  }
};
</script>

<style scoped>
/* 基本样式，您可以根据需要进行修改 */
.register-container {
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

.register-button {
  width: 100%;
  padding: 10px;
  background-color: #4CAF50;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.register-button:hover {
  background-color: #45a049;
}
</style>
