<template>
  <div class="profile-container">
    <h2>我的账户</h2>

    <div v-if="!isLoggedIn" class="auth-section">
      <p>请先登录或注册以查看您的个人信息。</p>
      <button class="auth-button" @click="goToLogin">登录</button>
      <button class="auth-button register-button" @click="goToRegister">注册</button>
    </div>

    <div v-else class="profile-section">
      <h3>欢迎, {{ user.username }}</h3>
      <p>邮箱: {{ user.email }}</p>

      <!-- 编辑按钮 -->
      <button class="edit-button" @click="editProfile = true" v-if="!editProfile">编辑信息</button>

      <!-- 编辑表单 -->
      <div v-if="editProfile">
        <div class="form-group">
          <label>用户名：</label>
          <input type="text" v-model="user.username" />
        </div>
        <div class="form-group">
          <label>邮箱：</label>
          <input type="email" v-model="user.email" />
        </div>
        <div class="form-group">
          <label>新密码（可选）：</label>
          <input type="password" v-model="newPassword" />
        </div>
        <button class="save-button" @click="updateProfile">保存</button>
        <button class="cancel-button" @click="cancelEdit">取消</button>
      </div>

      <button class="logout-button" @click="logout">退出登录</button>
    </div>
  </div>
</template>

<script>
const API = process.env.VUE_APP_API_URL;
import axios from 'axios';

export default {
  name: 'UserProfile',
  data() {
    return {
      isLoggedIn: false,
      user: {
        username: '',
        email: ''
      }, // 存储从后端获取的用户信息
      newPassword: '', // 新密码字段（可选）
      editProfile: false, // 是否在编辑模式
    };
  },
  methods: {
    goToLogin() {
      this.$router.push('/login');
    },
    goToRegister() {
      this.$router.push('/register');
    },
    logout() {
      localStorage.removeItem('authToken'); // 清除 token
      localStorage.removeItem('userRole'); // 清除角色信息
      localStorage.removeItem('username'); // 清除用户名
      this.isLoggedIn = false;
      alert('已退出登录');
      this.$router.push('/'); //跳转
    },
    async fetchUserProfile() {
      const token = localStorage.getItem('authToken');
      if (!token) {
        this.isLoggedIn = false;
        return;
      }

      try {
        const response = await axios.get(`${API}/profile`, {
          headers: {
            Authorization: token,
          },
        });

        this.user = response.data.user;
        this.isLoggedIn = true;
      } catch (error) {
        console.error('获取用户信息失败:', error);
        this.isLoggedIn = false;
      }
    },
    async updateProfile() {
      const token = localStorage.getItem('authToken');
      if (!token) {
        return alert('请先登录');
      }

      try {
        await axios.put(
          `${API}/profile`,
          {
            username: this.user.username,
            email: this.user.email,
            password: this.newPassword, // 新密码（如果用户填写了）
          },
          {
            headers: {
              Authorization: token,
            },
          }
        );

        alert('用户信息已更新');
        this.editProfile = false;
        this.newPassword = ''; // 清除新密码字段
      } catch (error) {
        console.error('更新用户信息失败:', error);
        alert('更新失败，请重试');
      }
    },
    cancelEdit() {
      this.editProfile = false;
      this.newPassword = ''; // 清除新密码字段
      this.fetchUserProfile(); // 重新获取用户信息，恢复原始数据
    },
  },
  mounted() {
    this.fetchUserProfile(); // 页面加载时调用 API 获取用户信息
  },
};
</script>

<style scoped>
/* 基本容器样式 */
.profile-container {
  padding: 40px;
  max-width: 600px;
  margin: 40px auto;
  background-color: #f5f7fa;
  border-radius: 12px;
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
  text-align: center;
  transition: all 0.3s ease;
}

/* 标题样式 */
h2 {
  color: #333;
  margin-bottom: 20px;
  font-size: 28px;
  font-weight: 700;
}

/* 按钮样式 */
.auth-button,
.save-button,
.cancel-button,
.logout-button,
.edit-button {
  background-color: #007bff;
  color: white;
  padding: 10px 20px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 16px;
  margin: 10px;
  transition: background-color 0.3s ease, transform 0.2s ease;
}

.auth-button:hover,
.save-button:hover,
.cancel-button:hover,
.logout-button:hover,
.edit-button:hover {
  background-color: #0056b3;
  transform: translateY(-2px);
}

.register-button {
  background-color: #28a745;
}

.register-button:hover {
  background-color: #218838;
}

/* 输入框样式 */
input {
  width: 100%;
  padding: 10px;
  margin-bottom: 15px;
  border: 1px solid #ddd;
  border-radius: 6px;
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.05);
  font-size: 16px;
  transition: border-color 0.3s ease;
}

input:focus {
  border-color: #007bff;
}

/* 登录成功后的个人信息区域 */
.profile-section {
  background-color: #ffffff;
  padding: 20px;
  border-radius: 12px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  margin-top: 20px;
  text-align: left;
}

.profile-section h3 {
  color: #333;
  margin-bottom: 10px;
  font-size: 24px;
  font-weight: 600;
}

.profile-section p {
  color: #666;
  font-size: 16px;
  margin-bottom: 10px;
}

.logout-button {
  background-color: #dc3545;
}

.logout-button:hover {
  background-color: #c82333;
}
</style>
