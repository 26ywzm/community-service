<template>
  <div class="login-page">
    <div class="login-container">
      <div class="login-header">
        <div class="logo-container">
          <span class="logo-icon">🏠</span>
        </div>
        <h2>欢迎回来</h2>
        <p class="subtitle">请登录您的账户</p>
      </div>

      <form @submit.prevent="login" class="login-form">
        <div class="form-group">
          <label>
            <span class="label-icon">📧</span>
            邮箱
          </label>
          <input 
            type="email" 
            v-model="email" 
            required 
            placeholder="请输入您的邮箱地址"
          />
        </div>

        <div class="form-group">
          <label>
            <span class="label-icon">🔒</span>
            密码
          </label>
          <div class="password-input">
            <input 
              :type="showPassword ? 'text' : 'password'"
              v-model="password" 
              required 
              placeholder="请输入您的密码"
            />
            <button 
              type="button" 
              class="toggle-password"
              @click="showPassword = !showPassword"
            >
              {{ showPassword ? '👁️' : '👁️‍🗨️' }}
            </button>
          </div>
        </div>

        <div class="form-footer">
          <button type="submit" class="login-button" :disabled="loading">
            <span class="button-icon">{{ loading ? '⌛' : '🔑' }}</span>
            {{ loading ? '登录中...' : '登录' }}
          </button>
          <p class="register-link">
            还没有账号？
            <router-link to="/register">立即注册</router-link>
          </p>
        </div>
      </form>
    </div>
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
      loading: false,
      showPassword: false
    };
  },
  methods: {
    async login() {
      this.loading = true;
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
            await this.$router.push('/profile');
        }
      } catch (error) {
        let errorMessage = '登录失败，请重试';
        if (error.response?.data?.message) {
          errorMessage = error.response.data.message;
        }
        alert(errorMessage);
      } finally {
        this.loading = false;
      }
    }
  }
};
</script>

<style scoped>
:root {
  --primary-color: #4CAF50;
  --secondary-color: #2196F3;
  --background-color: #f5f7fa;
  --text-primary: #333333;
  --text-secondary: #666666;
  --border-radius: 12px;
  --box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  --transition-speed: 0.3s;
}

.login-page {
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  padding: 20px;
}

.login-container {
  background: white;
  border-radius: var(--border-radius);
  box-shadow: var(--box-shadow);
  width: 100%;
  max-width: 400px;
  padding: 2rem;
  animation: slideUp 0.5s ease-out;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.login-header {
  text-align: center;
  margin-bottom: 2rem;
}

.logo-container {
  width: 80px;
  height: 80px;
  margin: 0 auto 1rem;
  background: var(--background-color);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.logo-icon {
  font-size: 2.5rem;
}

.login-header h2 {
  color: var(--text-primary);
  margin: 0;
  font-size: 1.8rem;
}

.subtitle {
  color: var(--text-secondary);
  margin-top: 0.5rem;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-group label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--text-secondary);
  font-size: 0.9rem;
}

.label-icon {
  font-size: 1.2rem;
}

.password-input {
  position: relative;
  display: flex;
  align-items: center;
}

.toggle-password {
  position: absolute;
  right: 10px;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  font-size: 1.2rem;
}

input {
  padding: 0.8rem 1rem;
  border: 1px solid #ddd;
  border-radius: var(--border-radius);
  font-size: 1rem;
  transition: all var(--transition-speed);
}

input:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 2px rgba(76, 175, 80, 0.1);
}

.form-footer {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.login-button {
  width: 100%;
  padding: 0.8rem;
  background: var(--primary-color);
  color: white;
  border: none;
  border-radius: var(--border-radius);
  font-size: 1rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  transition: all var(--transition-speed);
}

.login-button:hover {
  background: #43a047;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(76, 175, 80, 0.2);
}

.login-button:disabled {
  background: #cccccc;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.button-icon {
  font-size: 1.2rem;
}

.register-link {
  color: var(--text-secondary);
  font-size: 0.9rem;
}

.register-link a {
  color: var(--primary-color);
  text-decoration: none;
  font-weight: 500;
  transition: color var(--transition-speed);
}

.register-link a:hover {
  color: #43a047;
}

/* 暗色模式支持 */
@media (prefers-color-scheme: dark) {
  .login-page {
    background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
  }

  .login-container {
    background: #2d2d2d;
  }

  .logo-container {
    background: rgba(255, 255, 255, 0.1);
  }

  .login-header h2 {
    color: #ffffff;
  }

  .subtitle {
    color: #b0b0b0;
  }

  input {
    background: #363636;
    border-color: #4a4a4a;
    color: white;
  }

  input:focus {
    border-color: var(--primary-color);
    box-shadow: 0 0 0 2px rgba(76, 175, 80, 0.2);
  }

  .register-link {
    color: #b0b0b0;
  }

  .toggle-password {
    color: #b0b0b0;
  }
}

/* 响应式设计 */
@media screen and (max-width: 480px) {
  .login-container {
    padding: 1.5rem;
  }

  .logo-container {
    width: 60px;
    height: 60px;
  }

  .logo-icon {
    font-size: 2rem;
  }

  .login-header h2 {
    font-size: 1.5rem;
  }

  input {
    font-size: 0.9rem;
  }
}
</style>
