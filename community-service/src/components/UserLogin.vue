<template>
    <div>
      <h2>用户登录</h2>
      <form @submit.prevent="login">
        <div>
          <label>用户名：</label>
          <input type="text" v-model="username" required />
        </div>
        <div>
          <label>密码：</label>
          <input type="password" v-model="password" required />
        </div>
        <button type="submit">登录</button>
      </form>
    </div>
  </template>
  
  <script>
  import axios from 'axios';
  // import router from './router';

  export default {
    name: 'UserLogin',
    data() {
      return {
        username: '',
        password: '',
      };
    },
    methods: {
      async login() {
        try {
          const response = await axios.post('http://localhost:3000/api/login', {
            username: this.username,
            password: this.password,
          });
          alert(response.data.message);
          // 登录成功后的操作，如保存token，跳转页面等
          localStorage.setItem('authToken', response.data.token); // 保存 token
          this.$router.push('/profile'); // 登录成功后跳转到“我的”页面
        } catch (error) {
          alert('登录失败，请检查用户名和密码。');
        }
      },
    },
  };
  
  </script>
  
  <style scoped>
  /* 添加样式 */
  </style>
  