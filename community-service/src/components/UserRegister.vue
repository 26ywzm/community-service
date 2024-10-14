<template>
    <div>
      <h2>用户注册</h2>
      <form @submit.prevent="register">
        <div>
          <label>用户名：</label>
          <input type="text" v-model="username" required />
        </div>
        <div>
          <label>密码：</label>
          <input type="password" v-model="password" required />
        </div>
        <button type="submit">注册</button>
      </form>
    </div>
  </template>
  
  <script>
  import axios from 'axios';
  
  export default {
    name: 'UserRegister',
    data() {
      return {
        username: '',
        password: '',
      };
    },
    methods: {
      async register() {
        try {
          const response = await axios.post('http://localhost:3000/api/register', {
            username: this.username,
            password: this.password,
          });
          alert(response.data.message);
          // 注册成功后的操作，如跳转到登录页面
        } catch (error) {
          alert('注册失败，请重试。');
        }
      },
    },
  };
  </script>
  
  <style scoped>
  /* 添加样式 */
  </style>
  