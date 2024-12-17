<template>
  <div class="profile-container">
    <h2>我的账户</h2>

    <div v-if="!isLoggedIn" class="auth-section">
      <p>请先登录或注册以查看您的个人信息。</p>
      <button class="auth-button" @click="goToLogin">登录</button>
      <button class="auth-button register-button" @click="goToRegister">注册</button>
    </div>

    <div v-else-if="loading" class="loading-section">
      <p>加载中...</p>
    </div>

    <div v-else class="profile-section">
      <div v-if="loadError" class="error-message">
        {{ loadError }}
        <button @click="retryLoad" class="retry-button">重试</button>
      </div>

      <div v-if="updateSuccess" class="success-message">
        {{ updateSuccess }}
      </div>

      <h3>欢迎, {{ userInfo.username }}</h3>
      <p>邮箱: {{ userInfo.email }}</p>
      <p>角色: {{ formatRole(userInfo.role) }}</p>

      <!-- 编辑按钮 -->
      <button class="edit-button" @click="editMode = true" v-if="!editMode">编辑信息</button>

      <!-- 编辑表单 -->
      <div v-if="editMode" class="edit-form">
        <div class="form-group">
          <label>用户名：</label>
          <input type="text" v-model="userInfo.username" />
        </div>
        <div class="form-group">
          <label>邮箱：</label>
          <input type="email" v-model="userInfo.email" />
        </div>
        <div class="form-group">
          <label>当前密码（必填）：</label>
          <input type="password" v-model="currentPassword" />
        </div>
        <div class="form-group">
          <label>新密码（可选）：</label>
          <input type="password" v-model="newPassword" />
        </div>
        <div class="form-group">
          <label>头像：</label>
          <input type="file" @change="handleFileUpload" accept="image/*" />
        </div>
        <div class="button-group">
          <button class="save-button" @click="updateProfile" :disabled="loading">
            {{ loading ? '保存中...' : '保存' }}
          </button>
          <button class="cancel-button" @click="cancelEdit">取消</button>
        </div>
      </div>

      <button class="logout-button" @click="logout">退出登录</button>
    </div>
  </div>
</template>

<script>
import axios from 'axios';
import { handleApiError } from '../utils/errorHandler';
const API = process.env.VUE_APP_API_URL;

export default {
  name: 'UserProfile',
  data() {
    return {
      isLoggedIn: !!localStorage.getItem('authToken'),
      userInfo: {
        username: '',
        email: '',
        role: '',
        balance: 0
      },
      editMode: false,
      currentPassword: '',
      newPassword: '',
      file: null,
      loading: false,
      loadError: '',
      updateSuccess: ''
    };
  },
  async created() {
    // 从 localStorage 获取基本信息
    const token = localStorage.getItem('authToken');
    const role = localStorage.getItem('userRole');
    const username = localStorage.getItem('username');
    const email = localStorage.getItem('email');

    if (!token) {
      this.isLoggedIn = false;
    } else {
      // 立即设置基本信息
      this.userInfo = {
        username: username || '',
        email: email || '',
        role: role || ''
      };

      // 异步加载完整用户信息
      try {
        await this.fetchUserProfile();
      } catch (error) {
        console.error('Failed to fetch user profile:', error);
        if (error.response && error.response.status === 401) {
          this.handleUnauthorized();
        }
      }
    }
  },
  methods: {
    formatRole(role) {
      const roleMap = {
        'super_admin': '超级管理员',
        'admin': '管理员',
        'user': '普通用户'
      };
      return roleMap[role] || role;
    },

    async retryLoad() {
      this.loadError = '';
      await this.fetchUserProfile();
    },

    async fetchUserProfile() {
      this.loading = true;
      this.loadError = '';
      try {
        const token = localStorage.getItem('authToken');
        
        if (!token) {
          console.warn('No auth token found, using local storage data');
          this.useLocalStorageData();
          return;
        }

        const requestConfig = {
          method: 'get',
          url: `${API}/me`,
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        };

        const response = await axios(requestConfig);
        // console.log('Profile response:', {
        //   status: response.status,
        //   data: response.data
        // });

        if (response.data && response.data.user) {
          this.userInfo = response.data.user;
        } else if (response.data) {
          this.userInfo = response.data;
        } else {
          throw new Error('Invalid response format');
        }

      } catch (error) {
        console.error('Error fetching user profile:', error);
        if (error.response) {
          if (error.response.status === 401) {
            this.handleUnauthorized();
            return;
          }
          this.loadError = `加载失败: ${error.response.data.message || '服务器错误'}`;
        } else {
          this.loadError = '网络错误，请检查网络连接';
        }
        this.useLocalStorageData();
      } finally {
        this.loading = false;
      }
    },

    useLocalStorageData() {
      this.userInfo = {
        username: localStorage.getItem('username') || '',
        email: localStorage.getItem('email') || '',
        role: localStorage.getItem('userRole') || ''
      };
    },

    handleUnauthorized() {
      // 清除所有认证信息
      localStorage.removeItem('authToken');
      localStorage.removeItem('userRole');
      localStorage.removeItem('username');
      localStorage.removeItem('userId');
      localStorage.removeItem('email');
      
      this.isLoggedIn = false;
    },

    async updateProfile() {
      this.loading = true;
      this.updateSuccess = '';
      try {
        const formData = new FormData();
        formData.append('username', this.userInfo.username);
        formData.append('email', this.userInfo.email);
        if (this.currentPassword) {
          formData.append('currentPassword', this.currentPassword);
          if (this.newPassword) {
            formData.append('newPassword', this.newPassword);
          }
        }
        if (this.file) {
          formData.append('avatar', this.file);
        }

        await axios.put(`${API}/me`, formData, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
            'Content-Type': 'multipart/form-data'
          }
        });

        this.updateSuccess = '个人信息更新成功！';
        this.editMode = false;
        this.currentPassword = '';
        this.newPassword = '';
        this.file = null;
        await this.fetchUserProfile();
      } catch (error) {
        handleApiError(error);
      } finally {
        this.loading = false;
      }
    },
    handleFileUpload(event) {
      this.file = event.target.files[0];
    },
    goToLogin() {
      this.$router.push('/login');
    },
    goToRegister() {
      this.$router.push('/register');
    },
    async logout() {
      localStorage.removeItem('authToken');
      this.isLoggedIn = false;
      this.userInfo = {
        username: '',
        email: '',
        role: '',
        balance: 0
      };
    },
    cancelEdit() {
      this.editMode = false;
      this.currentPassword = '';
      this.newPassword = '';
      this.file = null;
      this.fetchUserProfile();
    }
  }
};
</script>

<style scoped>
.profile-container {
  max-width: 600px;
  margin: 20px auto;
  padding: 20px;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.loading-section {
  text-align: center;
  padding: 20px;
  color: #666;
}

.loading-section p {
  margin: 0;
  font-size: 16px;
}

.profile-section {
  padding: 20px;
}

.auth-section {
  text-align: center;
  padding: 20px;
}

.form-group {
  margin-bottom: 15px;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  color: #333;
}

.form-group input {
  width: 100%;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  box-sizing: border-box;
}

.button-group {
  display: flex;
  gap: 10px;
  margin-top: 20px;
}

.edit-button,
.save-button,
.cancel-button,
.auth-button,
.logout-button {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.3s;
}

.edit-button {
  background-color: #4CAF50;
  color: white;
}

.save-button {
  background-color: #2196F3;
  color: white;
}

.cancel-button {
  background-color: #f44336;
  color: white;
}

.auth-button {
  background-color: #2196F3;
  color: white;
  margin: 0 5px;
}

.register-button {
  background-color: #4CAF50;
}

.logout-button {
  background-color: #f44336;
  color: white;
  margin-top: 20px;
}

.edit-button:hover,
.save-button:hover,
.cancel-button:hover,
.auth-button:hover,
.logout-button:hover {
  opacity: 0.9;
}

.error-message {
  color: #f44336;
  margin-bottom: 10px;
}

.success-message {
  color: #4CAF50;
  margin-bottom: 10px;
}

.retry-button {
  background-color: #2196F3;
  color: white;
  padding: 5px 10px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  transition: background-color 0.3s;
}

.retry-button:hover {
  opacity: 0.9;
}
</style>
