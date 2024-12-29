<template>
  <div class="register-page">
    <div class="register-container">
      <div class="register-header">
        <div class="logo-container">
          <span class="logo-icon">✨</span>
        </div>
        <h2>创建账户</h2>
        <p class="subtitle">加入我们的社区</p>
      </div>

      <form @submit.prevent="register" class="register-form">
        <div class="form-group">
          <label>
            <span class="label-icon">👤</span>
            用户名
          </label>
          <input 
            type="text" 
            v-model="username" 
            required 
            placeholder="请输入用户名"
          />
        </div>

        <div class="form-group">
          <label>
            <span class="label-icon">📧</span>
            邮箱
          </label>
          <input 
            type="email" 
            v-model="email" 
            required 
            placeholder="请输入邮箱地址"
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
              placeholder="请输入密码"
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

        <div class="form-group">
          <label>
            <span class="label-icon">🔐</span>
            确认密码
          </label>
          <div class="password-input">
            <input 
              :type="showConfirmPassword ? 'text' : 'password'"
              v-model="confirmPassword" 
              required 
              placeholder="请再次输入密码"
            />
            <button 
              type="button" 
              class="toggle-password"
              @click="showConfirmPassword = !showConfirmPassword"
            >
              {{ showConfirmPassword ? '👁️' : '👁️‍🗨️' }}
            </button>
          </div>
        </div>

        <div class="password-strength" v-if="password">
          <div class="strength-label">密码强度：</div>
          <div class="strength-meter">
            <div 
              class="strength-bar" 
              :style="{ width: passwordStrength + '%' }"
              :class="strengthClass"
            ></div>
          </div>
          <div class="strength-text" :class="strengthClass">{{ strengthText }}</div>
        </div>

        <div class="form-footer">
          <button type="submit" class="register-button" :disabled="loading || !isPasswordMatch">
            <span class="button-icon">{{ loading ? '⌛' : '✨' }}</span>
            {{ loading ? '注册中...' : '注册' }}
          </button>
          <p class="login-link">
            已有账号？
            <router-link to="/login">立即登录</router-link>
          </p>
        </div>
      </form>
    </div>
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
      confirmPassword: '',
      loading: false,
      showPassword: false,
      showConfirmPassword: false
    };
  },
  computed: {
    isPasswordMatch() {
      return this.password === this.confirmPassword;
    },
    passwordStrength() {
      if (!this.password) return 0;
      let strength = 0;
      
      // 长度检查
      if (this.password.length >= 8) strength += 25;
      
      // 包含数字
      if (/\d/.test(this.password)) strength += 25;
      
      // 包含小写字母
      if (/[a-z]/.test(this.password)) strength += 25;
      
      // 包含大写字母或特殊字符
      if (/[A-Z]/.test(this.password) || /[^A-Za-z0-9]/.test(this.password)) strength += 25;
      
      return strength;
    },
    strengthClass() {
      if (this.passwordStrength <= 25) return 'weak';
      if (this.passwordStrength <= 50) return 'medium';
      if (this.passwordStrength <= 75) return 'good';
      return 'strong';
    },
    strengthText() {
      if (this.passwordStrength <= 25) return '弱';
      if (this.passwordStrength <= 50) return '中';
      if (this.passwordStrength <= 75) return '良好';
      return '强';
    }
  },
  methods: {
    async register() {
      if (this.password !== this.confirmPassword) {
        alert('两次输入的密码不一致');
        return;
      }

      this.loading = true;
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

.register-page {
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  padding: 20px;
}

.register-container {
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

.register-header {
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

.register-header h2 {
  color: var(--text-primary);
  margin: 0;
  font-size: 1.8rem;
}

.subtitle {
  color: var(--text-secondary);
  margin-top: 0.5rem;
}

.register-form {
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

.password-strength {
  margin-top: -0.5rem;
}

.strength-label {
  font-size: 0.8rem;
  color: var(--text-secondary);
  margin-bottom: 0.3rem;
}

.strength-meter {
  height: 4px;
  background-color: #eee;
  border-radius: 2px;
  overflow: hidden;
}

.strength-bar {
  height: 100%;
  transition: width 0.3s ease-out;
}

.strength-bar.weak { background-color: #ff4444; }
.strength-bar.medium { background-color: #ffbb33; }
.strength-bar.good { background-color: #00C851; }
.strength-bar.strong { background-color: #007E33; }

.strength-text {
  font-size: 0.8rem;
  margin-top: 0.3rem;
  text-align: right;
}

.strength-text.weak { color: #ff4444; }
.strength-text.medium { color: #ffbb33; }
.strength-text.good { color: #00C851; }
.strength-text.strong { color: #007E33; }

.form-footer {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.register-button {
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

.register-button:hover {
  background: #43a047;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(76, 175, 80, 0.2);
}

.register-button:disabled {
  background: #cccccc;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.button-icon {
  font-size: 1.2rem;
}

.login-link {
  color: var(--text-secondary);
  font-size: 0.9rem;
}

.login-link a {
  color: var(--primary-color);
  text-decoration: none;
  font-weight: 500;
  transition: color var(--transition-speed);
}

.login-link a:hover {
  color: #43a047;
}

/* 暗色模式支持 */
@media (prefers-color-scheme: dark) {
  .register-page {
    background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
  }

  .register-container {
    background: #2d2d2d;
  }

  .logo-container {
    background: rgba(255, 255, 255, 0.1);
  }

  .register-header h2 {
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

  .strength-meter {
    background-color: #444;
  }

  .login-link {
    color: #b0b0b0;
  }

  .toggle-password {
    color: #b0b0b0;
  }
}

/* 响应式设计 */
@media screen and (max-width: 480px) {
  .register-container {
    padding: 1.5rem;
  }

  .logo-container {
    width: 60px;
    height: 60px;
  }

  .logo-icon {
    font-size: 2rem;
  }

  .register-header h2 {
    font-size: 1.5rem;
  }

  input {
    font-size: 0.9rem;
  }
}
</style>
