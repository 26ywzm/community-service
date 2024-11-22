<!-- DiscoverPage.vue -->
<template>
  <div class="discover">
    <h2>发现</h2>

    <!-- 检查用户是否已登录 -->
    <div v-if="isLoggedIn">

      <!-- 普通用户可以看到的订餐按钮 -->
      <div v-if="!isAdmin && !isSuperAdmin">
        <router-link to="/CanteenOrder">
          <button>社区食堂</button>
        </router-link>
      </div>

      <!-- 用户的订单详细按钮 -->
      <div v-if="!isAdmin && !isSuperAdmin">
        <button @click="fetchUserOrders">查看我的订单</button>
      </div>

      <!-- 用户订单列表 -->
      <div v-if="orders.length > 0">
        <h3>我的订单</h3>
        <ul>
          <li v-for="order in orders" :key="order.id">
            订单 ID: {{ order.id }}, 总价格: {{ order.total_price }} 元, 创建时间: {{ formatDate(order.created_at) }}
            <button @click="viewOrderDetails(order.id)"> 查看详情 </button>
          </li>
        </ul>
      </div>

      <!-- 管理员和超级管理员可以看到的管理模块按钮 -->
      <div v-if="isSuperAdmin || isAdmin">
        <router-link to="/articles/new">
          <button>文章编写</button>
        </router-link>
      </div>

      <div v-if="isAdmin || isSuperAdmin">
        <button @click="showAdminPanel = true">管理模块</button>
      </div>

      <div v-if="showAdminPanel" class="admin-panel">
        <h3>管理员和用户列表</h3>
        <button @click="showAdminPanel = false">关闭</button>
        <div>
          <h4>管理员列表</h4>
          <ul>
            <li v-for="admin in admins" :key="admin.id">
              {{ admin.username }}
              <span v-if="isSuperAdmin"> <!-- 仅超级管理员可以降级 -->
                <button @click="demoteUser(admin.id)">降为用户</button>
                <button @click="deleteUser(admin.id)">删除</button>
              </span>
            </li>
          </ul>
        </div>
        <div>
          <h4>用户列表</h4>
          <ul>
            <li v-for="user in users" :key="user.id">
              {{ user.username }}
              <span v-if="isSuperAdmin"> <!-- 仅超级管理员可以升级 -->
                <button @click="promoteUser(user.id)">升为管理员</button>
                <button @click="deleteUser(user.id)">删除</button>
              </span>
            </li>
          </ul>
        </div>
      </div>
      <!-- 管理员和超级管理员的食堂管理按钮 -->
      <div v-if="isAdmin || isSuperAdmin">
        <router-link to="/canteenadmin">
          <button>食堂管理</button>
        </router-link>
      </div>
      <!-- 订单管理 -->
      <div v-if="isAdmin || isSuperAdmin">
        <router-link to="/canteen/orders">
          <button>订单管理</button>
        </router-link>
      </div>
    </div>

    <!-- 未登录用户 -->
    <div v-else>
      <p>请登录以查看内容。</p>
    </div>
  </div>

</template>

<script>
import axios from 'axios';
import { verifyAuth } from '../utils/auth';
import { handleApiError } from '../utils/errorHandler';
const API = process.env.VUE_APP_API_URL;

export default {
  data() {
    return {
      showAdminPanel: false,
      users: [],
      admins: [],
      orders: [], // 在数据中新增 orders 来存储用户订单
      verificationInterval: null
    };
  },
  computed: {
    isLoggedIn() {
      return !!localStorage.getItem('authToken'); // 检查是否有 token
    },
    // 计算属性，用于检查用户是否为管理员或超级管理员
    isAdmin() {
      const role = localStorage.getItem('userRole');
      return role === 'admin'; // 仅普通管理员
    },
    isSuperAdmin() {
      const role = localStorage.getItem('userRole');
      return role === 'super_admin'; // 仅超级管理员
    },
    isAuthenticated() {
      return !!localStorage.getItem('authToken'); // 检查是否登录
    },
  },
  async created() {
    // 只在登录状态下启动验证
    if (this.isLoggedIn) {
      this.startVerification();
    }
  },
  watch: {
    // 监听登录状态变化
    isLoggedIn(newValue) {
      if (newValue) {
        // 登录后启动验证
        this.startVerification();
      } else {
        // 登出后清除验证定时器
        if (this.verificationInterval) {
          clearInterval(this.verificationInterval);
          this.verificationInterval = null;
        }
      }
    }
  },
  beforeUnmount() {
    // 组件销毁时清除定时器
    if (this.verificationInterval) {
      clearInterval(this.verificationInterval);
    }
  },
  methods: {
    startVerification() {
      // 如果已经有定时器在运行，先清除它
      if (this.verificationInterval) {
        clearInterval(this.verificationInterval);
      }
      
      // 立即进行一次验证
      this.verifyAndUpdate();
      
      // 每5分钟验证一次
      this.verificationInterval = setInterval(() => {
        this.verifyAndUpdate();
      }, 5 * 60 * 1000);
    },
    async verifyAndUpdate() {
      // 如果未登录，不进行验证
      if (!this.isLoggedIn) {
        return;
      }

      const result = await verifyAuth();
      if (!result.valid) {
        switch (result.reason) {
          case 'role-mismatch':
            // 角色不匹配时，只更新角色不刷新页面
            this.$forceUpdate();
            break;
          case 'no-token':
          case 'invalid-token':
          case 'unauthorized':
            // 清除验证定时器
            if (this.verificationInterval) {
              clearInterval(this.verificationInterval);
              this.verificationInterval = null;
            }
            break;
          // 其他情况不做处理
        }
      }
    },
    async fetchUsers() {
      try {
        const response = await axios.get(`${API}/users`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('authToken')}`,
          },
        });
        this.users = response.data.users; // 从 response.data.users 获取用户列表
      } catch (error) {
        handleApiError(error);
      }
    },
    async fetchAdmins() {
      try {
        const response = await axios.get(`${API}/admins`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('authToken')}`,
          },
        });
        this.admins = response.data.admins; // 从 response.data.admins 获取管理员列表
      } catch (error) {
        handleApiError(error);
      }
    },
    async fetchUserOrders() {
      try {
        const response = await axios.get(`${API}/orders/user`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('authToken')}`,
          },
        });
        this.orders = response.data; // 存储订单信息
      } catch (error) {
        handleApiError(error);
      }
    },
    handleAuthError() {
      // 清除所有认证信息
      localStorage.removeItem('authToken');
      localStorage.removeItem('userRole');
      localStorage.removeItem('username');
      localStorage.removeItem('userId');
      localStorage.removeItem('email');
      
      // 停止验证定时器
      if (this.verificationInterval) {
        clearInterval(this.verificationInterval);
        this.verificationInterval = null;
      }
      
      // 跳转到登录页面
      this.$router.push('/login');
    },
    async promoteUser(userId) {
      // 仅超级管理员可以执行升降级操作
      if (this.isSuperAdmin) {
        await axios.post(`${API}/promote/${userId}`, {}, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('authToken')}`,
          },
        });
        this.fetchUsers(); // 刷新用户列表
        this.fetchAdmins(); // 刷新管理员列表
      }
    },
    async demoteUser(adminId) {
      // 仅超级管理员可以执行升降级操作
      if (this.isSuperAdmin) {
        await axios.post(`${API}/demote/${adminId}`, {}, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('authToken')}`,
          },
        });
        this.fetchUsers(); // 刷新用户列表
        this.fetchAdmins(); // 刷新管理员列表
      }
    },
    async deleteUser(userId) {
      if (this.isSuperAdmin) {
        try {
          await axios.delete(`${API}/users/${userId}`, {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('authToken')}`,
            },
          });
          this.fetchUsers(); // 刷新用户列表
          this.fetchAdmins(); // 刷新管理员列表
        } catch (error) {
          handleApiError(error);
        }
      }
    },
    viewOrderDetails(orderId) {
      this.$router.push({ name: 'OrderDetail', params: { orderId } });
    },
    formatDate(dateString) {
      const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
      return new Date(dateString).toLocaleDateString('zh-CN', options);
    }
  },

  mounted() {
    if (this.isAdmin || this.isSuperAdmin) {
      this.fetchUsers();
      this.fetchAdmins();
    }
  }

};
</script>

<style scoped>
.discover {
  padding: 20px;
  background-color: #f9f9f9;
  border-radius: 8px;
}

.title {
  font-size: 24px;
  color: #333;
  margin-bottom: 20px;
  text-align: center;
}

.button-group {
  text-align: center;
  margin-bottom: 15px;
}

.admin-button,
.article-button,
.close-button,
.action-button {
  background-color: #007bff;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 5px;
  cursor: pointer;
  transition: background-color 0.3s ease;
  margin: 5px;
}

.admin-button:hover,
.article-button:hover,
.close-button:hover,
.action-button:hover {
  background-color: #0056b3;
}

.admin-panel {
  border: 1px solid #ccc;
  padding: 15px;
  margin-top: 20px;
  border-radius: 8px;
  background-color: #fff;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

h3 {
  text-align: center;
  margin-bottom: 15px;
}

h4 {
  margin-top: 10px;
  color: #555;
}

.list {
  list-style-type: none;
  padding: 0;
}

.list li {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px solid #eee;
}

.list li:last-child {
  border-bottom: none;
}

/* 按钮 */
.admin-button,
.article-button,
.close-button,
.action-button {
  background: linear-gradient(135deg, #007bff, #0056b3);
  color: white;
  border: none;
  padding: 15px 30px;
  /* 增大按钮的内边距 */
  border-radius: 8px;
  /* 增加圆角 */
  cursor: pointer;
  transition: all 0.3s ease;
  margin: 5px;
  font-size: 18px;
  /* 增大字体大小 */
  box-shadow: 0 4px 8px rgba(0, 123, 255, 0.2);
}

.admin-button:hover,
.article-button:hover,
.close-button:hover,
.action-button:hover {
  background: linear-gradient(135deg, #0056b3, #004494);
  transform: translateY(-2px);
  box-shadow: 0 6px 12px rgba(0, 123, 255, 0.3);
}
</style>
