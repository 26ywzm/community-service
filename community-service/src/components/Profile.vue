<template>
  <div class="profile-container">
    <div class="profile-card">
      <!-- 未登录状态 -->
      <div v-if="!isLoggedIn" class="not-logged-in">
        <h2>欢迎来到社区</h2>
        <p>登录或注册以开始您的社区之旅</p>
        <div class="auth-buttons">
          <router-link to="/login" class="auth-button login-btn">
            <span class="button-icon">🔑</span>
            登录
          </router-link>
          <router-link to="/register" class="auth-button login-btn">
            <span class="button-icon">✨</span>
            注册
          </router-link>
        </div>
      </div>

      <!-- 加载状态 -->
      <div v-else-if="loading" class="loading-section">
        <div class="loading-spinner"></div>
        <p>正在加载您的个人信息...</p>
      </div>

      <!-- 个人信息展示 -->
      <div v-else class="profile-content">
        <!-- 错误提示 -->
        <div v-if="loadError" class="message error">
          <span class="message-icon">⚠️</span>
          <span>{{ loadError }}</span>
          <button @click="retryLoad" class="btn small">重试</button>
        </div>

        <!-- 成功提示 -->
        <div v-if="updateSuccess" class="message success">
          <span class="message-icon">✅</span>
          <span>{{ updateSuccess }}</span>
        </div>

        <!-- 用户信息展示模式 -->
        <div v-if="!editMode" class="user-info">
          <div class="avatar-section">
            <div class="avatar" :style="{ backgroundImage: `url(${userInfo.avatar || '/default-avatar.png'})` }">
              <div class="avatar-overlay">
                <span class="role-badge" :class="userInfo.role">
                  {{ formatRole(userInfo.role) }}
                </span>
              </div>
            </div>
          </div>

          <div class="info-section">
            <h2>{{ userInfo.username }}</h2>
            <div class="info-item">
              <span class="info-icon">📧</span>
              <span class="info-label">邮箱：</span>
              <span class="info-value">{{ userInfo.email }}</span>
            </div>
            <div class="info-item">
              <span class="info-icon">👑</span>
              <span class="info-label">角色：</span>
              <span class="info-value">{{ formatRole(userInfo.role) }}</span>
            </div>
          </div>

          <div class="action-buttons">
            <button class="btn primary" @click="editMode = true">
              <span class="btn-icon">✏️</span>
              编辑资料
            </button>
            <button class="btn outline-danger" @click="logout">
              <span class="btn-icon">🚪</span>
              退出登录
            </button>
          </div>
        </div>

        <!-- 编辑模式 -->
        <form v-else class="edit-form" @submit.prevent="updateProfile">
          <h3>编辑个人信息</h3>
          
          <div class="form-group">
            <label>
              <span class="label-icon">👤</span>
              用户名
            </label>
            <input 
              type="text" 
              v-model="userInfo.username" 
              placeholder="请输入用户名"
              required
            />
          </div>

          <div class="form-group">
            <label>
              <span class="label-icon">📧</span>
              邮箱
            </label>
            <input 
              type="email" 
              v-model="userInfo.email" 
              placeholder="请输入邮箱"
              required
            />
          </div>

          <div class="form-group">
            <label>
              <span class="label-icon">🔒</span>
              当前密码
            </label>
            <input 
              type="password" 
              v-model="currentPassword" 
              placeholder="请输入当前密码"
              required
            />
          </div>

          <div class="form-group">
            <label>
              <span class="label-icon">🔑</span>
              新密码
            </label>
            <input 
              type="password" 
              v-model="newPassword" 
              placeholder="如需修改密码请输入新密码"
            />
          </div>

          <div class="form-group">
            <label>
              <span class="label-icon">🖼️</span>
              头像
            </label>
            <div class="file-upload">
              <input 
                type="file" 
                @change="handleFileUpload" 
                accept="image/*" 
                id="avatar-upload"
              />
              <label for="avatar-upload" class="file-upload-label">
                <span class="btn-icon">📤</span>
                选择图片
              </label>
              <span class="file-name" v-if="file">{{ file.name }}</span>
            </div>
          </div>

          <div class="form-actions">
            <button type="submit" class="btn primary" :disabled="loading">
              <span class="btn-icon">💾</span>
              {{ loading ? '保存中...' : '保存修改' }}
            </button>
            <button type="button" class="btn secondary" @click="cancelEdit">
              <span class="btn-icon">✖️</span>
              取消
            </button>
          </div>
        </form>
      </div>
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
      // 清除所有本地存储
      localStorage.removeItem('authToken');
      localStorage.removeItem('userRole');
      localStorage.removeItem('username');
      localStorage.removeItem('userId');
      localStorage.removeItem('email');
      
      // 可选：完全清除所有本地存储
      // localStorage.clear();
      
      // 重定向到登录页
      await this.$router.push('/login');
      
      // 提示用户
      alert('已成功退出登录');
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
/* 基础变量 */
:root {
  --primary-color: #4CAF50;
  --secondary-color: #2196F3;
  --danger-color: #f44336;
  --success-color: #4CAF50;
  --warning-color: #ff9800;
  --text-primary: #333333;
  --text-secondary: #666666;
  --background-light: #f5f7fa;
  --card-shadow: 0 2px 12px 0 rgba(0,0,0,0.1);
  --border-radius: 12px;
  --transition-speed: 0.3s;
}

/* 容器样式 */
.profile-container {
  min-height: 100vh;
  background-color: var(--background-light);
  padding: 2rem;
  display: flex;
  justify-content: center;
  align-items: flex-start;
}

.profile-card {
  background: white;
  border-radius: var(--border-radius);
  box-shadow: var(--card-shadow);
  width: 100%;
  max-width: 800px;
  overflow: hidden;
  animation: slideIn 0.5s ease-out;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.not-logged-in {
  text-align: center;
  padding: 2rem;
  background: white;
  border-radius: var(--border-radius);
  box-shadow: var(--box-shadow);
  margin: 2rem auto;
  max-width: 400px;
  animation: fadeIn 0.5s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.not-logged-in h2 {
  color: var(--text-primary);
  margin-bottom: 1rem;
  font-size: 1.8rem;
}

.not-logged-in p {
  color: var(--text-secondary);
  margin-bottom: 2rem;
}

.auth-buttons {
  display: flex;
  gap: 1rem;
  justify-content: center;
}

.auth-button {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.8rem 2rem;
  border-radius: var(--border-radius);
  font-size: 1rem;
  font-weight: 500;
  text-decoration: none;
  transition: all 0.3s ease;
  border: none;
  cursor: pointer;
}

.login-btn {
  background: var(--primary-color);
  color: white;
}

.login-btn:hover {
  background: #43a047;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(76, 175, 80, 0.2);
}

.register-btn {
  background: white;
  color: var(--primary-color);
  border: 2px solid var(--primary-color);
}

.register-btn:hover {
  background: var(--primary-color);
  color: white;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(76, 175, 80, 0.2);
}

.button-icon {
  font-size: 1.2rem;
}

/* 暗色模式支持 */
@media (prefers-color-scheme: dark) {
  .not-logged-in {
    background: #2d2d2d;
  }

  .not-logged-in h2 {
    color: #ffffff;
  }

  .not-logged-in p {
    color: #b0b0b0;
  }

  .register-btn {
    background: #2d2d2d;
  }

  .register-btn:hover {
    background: var(--primary-color);
  }
}

/* 响应式设计 */
@media screen and (max-width: 480px) {
  .not-logged-in {
    margin: 1rem;
    padding: 1.5rem;
  }

  .auth-buttons {
    flex-direction: column;
  }

  .auth-button {
    width: 100%;
  }
}

.loading-section {
  padding: 2rem;
  text-align: center;
}

.loading-spinner {
  border: 4px solid rgba(0, 0, 0, 0.1);
  border-left-color: var(--primary-color);
  border-radius: 50%;
  width: 24px;
  height: 24px;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.profile-content {
  padding: 2rem;
}

.message {
  padding: 1rem;
  border-radius: var(--border-radius);
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
}

.message-icon {
  font-size: 18px;
  margin-right: 0.5rem;
}

.message.error {
  background-color: #f44336;
  color: white;
}

.message.success {
  background-color: #4CAF50;
  color: white;
}

.user-info {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.avatar-section {
  margin-bottom: 1rem;
}

.avatar {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  background-size: cover;
  background-position: center;
  margin: 0 auto;
}

.avatar-overlay {
  position: relative;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  color: white;
  font-size: 14px;
}

.role-badge {
  padding: 0.2rem 0.5rem;
  border-radius: var(--border-radius);
  font-size: 12px;
}

.role-badge.super_admin {
  background-color: #2196F3;
}

.role-badge.admin {
  background-color: #4CAF50;
}

.role-badge.user {
  background-color: #f44336;
}

.info-section {
  margin-bottom: 1rem;
}

.info-item {
  margin-bottom: 0.5rem;
  display: flex;
  align-items: center;
}

.info-icon {
  font-size: 18px;
  margin-right: 0.5rem;
}

.info-label {
  font-size: 14px;
  color: var(--text-secondary);
}

.info-value {
  font-size: 14px;
  color: var(--text-primary);
}

.action-buttons {
  margin-top: 1rem;
  display: flex;
  gap: 2rem;
  justify-content: center;
}

.btn {
  min-width: 120px;
  padding: 0.5rem 1.5rem;
  border: none;
  border-radius: var(--border-radius);
  font-size: 14px;
  cursor: pointer;
  transition: background-color var(--transition-speed);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

/* 在移动端保持合适的间距 */
@media screen and (max-width: 768px) {
  .action-buttons {
    gap: 1rem;
  }
}

.edit-form {
  padding: 2rem;
}

.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-size: 14px;
  color: var(--text-secondary);
}

.form-group input {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: var(--border-radius);
  font-size: 14px;
}

.form-group input:focus {
  border-color: var(--primary-color);
  box-shadow: 0 0 5px rgba(0, 0, 0, 0.1);
}

.file-upload {
  margin-top: 0.5rem;
}

.file-upload-label {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: var(--border-radius);
  background-color: var(--primary-color);
  color: white;
  cursor: pointer;
}

.file-upload-label:hover {
  background-color: #3e8e41;
}

.file-name {
  font-size: 14px;
  color: var(--text-secondary);
  margin-left: 0.5rem;
}

.form-actions {
  margin-top: 1rem;
  display: flex;
  justify-content: space-between;
}

.btn.primary {
  background-color: var(--primary-color);
  color: white;
}

.btn.primary:hover {
  background-color: #43a047;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(76, 175, 80, 0.2);
}

.btn.secondary {
  background-color: var(--secondary-color);
  color: white;
}

.btn.secondary:hover {
  background-color: #1976d2;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(25, 118, 210, 0.2);
}

.btn.danger {
  background-color: var(--danger-color);
  color: white;
}

.btn.danger:hover {
  background-color: #d32f2f;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(211, 47, 47, 0.2);
}

.btn.small {
  padding: 0.2rem 0.5rem;
  font-size: 12px;
}

.btn.outline-danger {
  color:#ffffff;
  background-color: #3498db;
  border: 2px solid var(--danger-color);
  transition: all var(--transition-speed);
}

.btn.outline-danger:hover {
  background-color: #ff6b6b;
  color: white;
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(244, 67, 54, 0.3);
}

/* 响应式设计 */
@media screen and (max-width: 768px) {
  .profile-container {
    padding: 1rem;
  }

  .profile-card {
    border-radius: calc(var(--border-radius) / 2);
  }

  .user-info {
    padding: 1rem;
  }

  .avatar {
    width: 80px;
    height: 80px;
  }

  .action-buttons {
    flex-direction: column;
    gap: 0.5rem;
  }

  .btn {
    width: 100%;
    justify-content: center;
  }

  .edit-form {
    padding: 1rem;
  }

  .form-actions {
    flex-direction: column;
    gap: 0.5rem;
  }

  .file-upload {
    flex-direction: column;
  }

  .file-upload-label {
    width: 100%;
    text-align: center;
    margin-bottom: 0.5rem;
  }
}

/* 暗色模式支持 */
@media (prefers-color-scheme: dark) {
  :root {
    --text-primary: #ffffff;
    --text-secondary: #b0b0b0;
    --background-light: #1a1a1a;
    --card-shadow: 0 2px 12px 0 rgba(0,0,0,0.2);
  }

  .profile-card {
    background: #2d2d2d;
  }

  .info-item {
    background: rgba(255, 255, 255, 0.05);
  }

  input[type="text"],
  input[type="email"],
  input[type="password"] {
    background: #363636;
    border-color: #4a4a4a;
    color: white;
  }

  input[type="text"]:focus,
  input[type="email"]:focus,
  input[type="password"]:focus {
    border-color: var(--primary-color);
  }

  .file-upload-label {
    background: #363636;
    border: 1px solid #4a4a4a;
  }

  .file-upload-label:hover {
    background: #4a4a4a;
  }

  .message.error {
    background: rgba(244, 67, 54, 0.2);
    color: #ff8a80;
  }

  .message.success {
    background: rgba(76, 175, 80, 0.2);
    color: #b9f6ca;
  }

  .btn.secondary {
    background: #363636;
    color: white;
  }

  .btn.secondary:hover {
    background: #4a4a4a;
  }

  .role-badge.super_admin {
    background: linear-gradient(45deg, #ff9800, #f44336);
  }

  .role-badge.admin {
    background: linear-gradient(45deg, #2196F3, #3f51b5);
  }

  .role-badge.user {
    background: linear-gradient(45deg, #4CAF50, #009688);
  }

  .btn.outline-danger {
    border-color: #ff6b6b;
    color: #ff6b6b;
  }

  .btn.outline-danger:hover {
    background-color: #ff6b6b;
    color: #1a1a1a;
  }
}
</style>
