<template>
    <div class="profile-container">
      <h2>我的</h2>
      <div v-if="!isLoggedIn" class="auth-section">
        <p>请先登录或注册以查看您的个人信息。</p>
        <button @click="goToLogin">登录</button>
        <button @click="goToRegister">注册</button>
      </div>
      <div v-else class="profile-section">
        <h3>欢迎, {{ user.username }}</h3>
        <p>邮箱: {{ user.email }}</p>
        <button @click="logout">退出登录</button>
      </div>
    </div>
  </template>
  
  <script>
  export default {
    name: 'UserProfile',
    data() {
      return {
        isLoggedIn: false, // 判断是否已登录
        user: {
          username: '张三',
          email: 'zhangsan@example.com',
        }, // 用户信息 (假设已登录时)
      };
    },
    methods: {
      // 导航到登录页面
      goToLogin() {
        this.$router.push('/login');
      },
      // 导航到注册页面
      goToRegister() {
        this.$router.push('/register');
      },
      // 退出登录
      logout() {
        localStorage.removeItem('authToken'); // 清除 token
        this.isLoggedIn = false;
        alert('已退出登录');
        this.$router.push('/'); // 跳转到首页
      },
    },
    mounted() {
      // 检查用户是否已登录（这里可以从 localStorage 或 Vuex 检查）
      const token = localStorage.getItem('authToken');
      if (token) {
        this.isLoggedIn = true;
        // 你可以根据 token 获取更多的用户数据
      }
    },
  };
  </script>
  
  <style scoped>
  .profile-container {
    padding: 20px;
    max-width: 600px;
    margin: 0 auto;
  }
  
  .auth-section button {
    margin-right: 10px;
  }
  
  .profile-section {
    background-color: #f5f5f5;
    padding: 20px;
    border-radius: 10px;
  }
  
  .profile-section h3 {
    margin-bottom: 10px;
  }
  </style>
  