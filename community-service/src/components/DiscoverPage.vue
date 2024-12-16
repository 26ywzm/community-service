<template>
  <div class="discover">
    <h2 class="title">发现</h2>

    <!-- 检查用户是否已登录 -->
    <div v-if="isLoggedIn">
      <!-- 普通用户的功能 -->
      <div v-if="!isAdmin && !isSuperAdmin" class="button-group">
        <router-link to="/CanteenOrder">
          <button class="action-button">社区食堂</button>
        </router-link>
        <button @click="fetchUserOrders" class="action-button">查看我的订单</button>
      </div>

      <!-- 用户订单列表 -->
      <div v-if="orders.length > 0">
        <h3>我的订单</h3>
        <ul class="list">
          <li v-for="order in orders" :key="order.id">
            订单 ID: {{ order.id }}, 总价格: {{ order.total_price }} 元, 创建时间: {{ formatDate(order.created_at) }}
            <button @click="viewOrderDetails(order.id)" class="action-button">查看详情</button>
          </li>
        </ul>
      </div>

      <!-- 管理员和超级管理员的功能 -->
      <div v-if="isAdmin || isSuperAdmin">
        <div class="button-group">
          <router-link to="/articles/new">
            <button class="admin-button">文章编写</button>
          </router-link>
          <button @click="openAdminPanel" class="admin-button" v-if="isSuperAdmin">管理模块</button>
        </div>
        
        <el-dialog
          v-model="dialogVisible"
          title="管理模块"
          width="70%"
          :before-close="handleClose"
          :close-on-click-modal="false"
        >
          <div class="admin-panel">
            <h3>管理员和用户列表</h3>
            <div v-loading="loading">
              <div v-if="error" class="error-message">{{ error }}</div>
              
              <div v-else>
                <h4>管理员列表</h4>
                <ul class="list">
                  <li v-for="admin in admins" :key="admin.id">
                    {{ admin.username }}
                    <span v-if="isSuperAdmin">
                      <button @click="demoteUser(admin.id)" class="action-button">降为用户</button>
                      <button @click="deleteUser(admin.id)" class="close-button">删除</button>
                    </span>
                  </li>
                </ul>

                <h4>用户列表</h4>
                <ul class="list">
                  <li v-for="user in users" :key="user.id">
                    {{ user.username }}
                    <span v-if="isSuperAdmin">
                      <button @click="promoteUser(user.id)" class="action-button">升为管理员</button>
                      <button @click="deleteUser(user.id)" class="close-button">删除</button>
                    </span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
          <template #footer>
            <span class="dialog-footer">
              <el-button @click="closeDialog">关闭</el-button>
            </span>
          </template>
        </el-dialog>

        <!-- 其他管理员功能 -->
        <div class="button-group">
          <router-link to="/canteenadmin">
            <button class="admin-button">食堂管理</button>
          </router-link>
          <router-link to="/canteen/orders">
            <button class="admin-button">订单管理</button>
          </router-link>
        </div>
      </div>
    </div>

    <!-- 未登录用户 -->
    <div v-else>
      <p>请登录以查看内容。</p>
    </div>
  </div>
</template>

<script>
import axios from "axios";
import { verifyAuth } from "../utils/auth";
import { handleApiError } from "../utils/errorHandler";
import { ElMessage } from 'element-plus';
const API = process.env.VUE_APP_API_URL;

export default {
  data() {
    return {
      dialogVisible: false,
      showAdminPanel: false,
      users: [],
      admins: [],
      orders: [],
      verificationInterval: null,
      loading: false,
      error: null
    };
  },
  computed: {
    isLoggedIn() {
      return !!localStorage.getItem("authToken");
    },
    isAdmin() {
      const role = localStorage.getItem("userRole");
      return role === "admin";
    },
    isSuperAdmin() {
      const role = localStorage.getItem("userRole");
      return role === "super_admin";
    },
  },
  created() {
    if (this.isLoggedIn) {
      this.startVerification();
    }
  },
  beforeUnmount() {
    if (this.verificationInterval) {
      clearInterval(this.verificationInterval);
    }
  },
  methods: {
    startVerification() {
      if (this.verificationInterval) {
        clearInterval(this.verificationInterval);
      }
      this.verifyAndUpdate();
      this.verificationInterval = setInterval(this.verifyAndUpdate, 300000);
    },
    async verifyAndUpdate() {
      if (!this.isLoggedIn) return;

      const result = await verifyAuth();
      if (!result.valid) {
        this.handleAuthError(result.reason);
      }
    },
    handleAuthError(reason) {
      if (["no-token", "invalid-token", "unauthorized"].includes(reason)) {
        localStorage.clear();
        if (this.verificationInterval) {
          clearInterval(this.verificationInterval);
        }
        this.$router.push("/login");
      }
    },
    async fetchUserOrders() {
      try {
        const response = await axios.get(`${API}/orders/user`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("authToken")}` },
        });
        this.orders = response.data;
      } catch (error) {
        handleApiError(error);
      }
    },
    async fetchUsers() {
      try {
        const response = await axios.get(`${API}/users`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("authToken")}` },
        });
        this.users = response.data.users;
      } catch (error) {
        handleApiError(error);
      }
    },
    async fetchAdmins() {
      try {
        const response = await axios.get(`${API}/admins`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("authToken")}` },
        });
        this.admins = response.data.admins;
      } catch (error) {
        handleApiError(error);
      }
    },
    async openAdminPanel() {
      this.dialogVisible = true;
      await this.loadAdminData();
    },
    
    async loadAdminData() {
      this.loading = true;
      this.error = null;
      try {
        await Promise.all([
          this.fetchUsers(),
          this.fetchAdmins()
        ]);
      } catch (error) {
        console.error('加载数据失败:', error);
        this.error = '加载数据失败，请重试';
      } finally {
        this.loading = false;
      }
    },

    closeDialog() {
      this.dialogVisible = false;
      this.error = null;
    },

    handleClose(done) {
      this.error = null;
      done();
    },
    async promoteUser(userId) {
      if (this.isSuperAdmin) {
        try {
          await axios.post(`${API}/promote/${userId}`, {}, { headers: { Authorization: `Bearer ${localStorage.getItem("authToken")}` } });
          ElMessage.success('用户已成功升级为管理员');
          await this.loadAdminData();
        } catch (error) {
          handleApiError(error);
          ElMessage.error('升级管理员失败，请稍后重试');
        }
      }
    },
    async demoteUser(adminId) {
      if (this.isSuperAdmin) {
        try {
          await axios.post(`${API}/demote/${adminId}`, {}, { headers: { Authorization: `Bearer ${localStorage.getItem("authToken")}` } });
          ElMessage.success('管理员已成功降级为普通用户');
          await this.loadAdminData();
        } catch (error) {
          handleApiError(error);
          ElMessage.error('降级管理员失败，请稍后重试');
        }
      }
    },
    async deleteUser(userId) {
      if (this.isSuperAdmin) {
        try {
          await axios.delete(`${API}/users/${userId}`, { headers: { Authorization: `Bearer ${localStorage.getItem("authToken")}` } });
          await this.loadAdminData();
        } catch (error) {
          handleApiError(error);
        }
      }
    },
    viewOrderDetails(orderId) {
      this.$router.push({ name: "OrderDetail", params: { orderId } });
    },
    formatDate(dateString) {
      const options = { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" };
      return new Date(dateString).toLocaleDateString("zh-CN", options);
    },
  },
  mounted() {
    if (this.isSuperAdmin) {
      this.fetchUsers();
      this.fetchAdmins();
    }
  },
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

.action-button,
.admin-button,
.close-button {
  background-color: #007bff;
  color: white;
  padding: 10px 20px;
  margin: 5px;
  border-radius: 5px;
  border: none;
  cursor: pointer;
  transition: background-color 0.3s;
}

.action-button:hover,
.admin-button:hover,
.close-button:hover {
  background-color: #0056b3;
}

.admin-panel {
  margin-top: 20px;
  padding: 15px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.list {
  list-style: none;
  padding: 0;
}

.list li {
  margin-bottom: 10px;
  display: flex;
  justify-content: space-between;
}
</style>
