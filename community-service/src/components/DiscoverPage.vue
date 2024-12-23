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
        <router-link to="/feedback">
          <button class="action-button">意见反馈</button>
        </router-link>
      </div>

      <!-- 用户订单列表 -->
      <div v-if="orders.length > 0" class="orders-section">
        <h3>我的订单</h3>
        <ul class="order-list">
          <li v-for="order in orders" :key="order.id" class="order-item">
            <div class="order-info">
              <div class="order-header">
                <span class="order-id">订单号: {{ order.id }}</span>
                <span class="order-status" :class="order.status">
                  {{ getOrderStatusText(order.status) }}
                </span>
              </div>
              <div class="order-details">
                <span class="order-price">总价: ¥{{ order.total_price }}</span>
                <span class="order-date">{{ formatDate(order.created_at) }}</span>
              </div>
            </div>
            <div class="order-actions">
              <button @click="viewOrderDetails(order.id)" class="view-button">查看详情</button>
            </div>
          </li>
        </ul>
      </div>

      <!-- 管理员和超级管理员的功能 -->
      <div v-if="isAdmin || isSuperAdmin">
        <div class="button-group">
          <router-link to="/articles/new">
            <button class="admin-button">文章编写</button>
          </router-link>
          <button @click="openAdminPanel" class="admin-button" v-if="isAdmin || isSuperAdmin">管理模块</button>
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
                <div class="role-info" v-if="isAdmin && !isSuperAdmin">
                  <el-alert
                    title="提示：您可以查看用户列表，但只有超级管理员可以修改权限"
                    type="info"
                    :closable="false"
                    show-icon
                  />
                </div>
                <ul class="list">
                  <li v-for="admin in admins" :key="admin.id" class="user-item">
                    <div class="user-info">
                      <span class="username">{{ admin.username }}</span>
                      <span class="role-tag" :class="{ 'super': admin.role === 'super_admin' }">
                        {{ admin.role === 'super_admin' ? '超级管理员' : '管理员' }}
                      </span>
                    </div>
                    <div class="action-buttons" v-if="isSuperAdmin">
                      <button @click="demoteUser(admin.id)" class="action-button" 
                              v-if="admin.role !== 'super_admin'">降为用户</button>
                      <button @click="deleteUser(admin.id)" class="close-button"
                              v-if="admin.role !== 'super_admin'">删除</button>
                    </div>
                  </li>
                </ul>

                <h4>用户列表</h4>
                <ul class="list">
                  <li v-for="user in users" :key="user.id" class="user-item">
                    <div class="user-info">
                      <span class="username">{{ user.username }}</span>
                      <span class="role-tag">用户</span>
                    </div>
                    <div class="action-buttons" v-if="isSuperAdmin">
                      <button @click="promoteUser(user.id)" class="action-button">升为管理员</button>
                      <button @click="deleteUser(user.id)" class="close-button">删除</button>
                    </div>
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
          <router-link to="/managefeedback">
            <button class="admin-button">意见反馈</button>
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
        this.orders = response.data.orders || response.data || [];
        if (this.orders.length === 0) {
          ElMessage.info('暂无订单记录');
        }
      } catch (error) {
        console.error('获取订单失败:', error);
        ElMessage.error('获取订单列表失败，请重试');
      }
    },
    async fetchUsers() {
      try {
        const response = await axios.get(`${API}/users`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("authToken")}` },
        });
        this.users = response.data.users || response.data;
      } catch (error) {
        console.error('获取用户列表失败:', error);
        if (error.response?.status === 403) {
          ElMessage.warning('您只有查看权限');
        } else {
          ElMessage.error('获取用户列表失败，请重试');
        }
      }
    },
    async fetchAdmins() {
      try {
        // 使用users接口，但是过滤出管理员
        const response = await axios.get(`${API}/users`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("authToken")}` },
          params: { role: 'admin' }  // 添加查询参数来获取管理员
        });
        const allUsers = response.data.users || response.data;
        // 过滤出管理员和超级管理员
        this.admins = allUsers.filter(user => 
          user.role === 'admin' || user.role === 'super_admin'
        );
      } catch (error) {
        console.error('获取管理员列表失败:', error);
        if (error.response?.status === 403) {
          ElMessage.warning('您只有查看权限');
        } else {
          ElMessage.error('获取管理员列表失败，请重试');
        }
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
        const results = await Promise.allSettled([
          this.fetchUsers(),
          this.fetchAdmins()
        ]);
        
        // 检查是否所有请求都失败了
        const allFailed = results.every(result => result.status === 'rejected');
        if (allFailed) {
          this.error = '加载数据失败，请重试';
        }
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
      if (!dateString) return '感谢使用';
      try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return '--';
        const options = { 
          year: "numeric", 
          month: "2-digit", 
          day: "2-digit", 
          hour: "2-digit", 
          minute: "2-digit",
          hour12: false 
        };
        return date.toLocaleString("zh-CN", options).replace(/\//g, '-');
      } catch (error) {
        console.error('日期格式化错误:', error);
        return '--';
      }
    },
    getOrderStatusText(status) {
      const statusMap = {
        0: '待处理',
        1: '处理中',
        2: '已完成',
        3: '已取消'
      };
      return statusMap[status] || '未知状态';
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

.role-info {
  margin: 10px 0;
  padding: 10px;
}

.error-message {
  color: #f56c6c;
  margin: 10px 0;
  padding: 10px;
  background-color: #fef0f0;
  border-radius: 4px;
}

.user-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  margin: 8px 0;
  background-color: white;
  border-radius: 6px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
}

.user-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.username {
  font-weight: 500;
  color: #303133;
}

.role-tag {
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 12px;
  background-color: #e1f3d8;
  color: #67c23a;
}

.role-tag.super {
  background-color: #ffd04b;
  color: #b88230;
}

.action-buttons {
  display: flex;
  gap: 8px;
}

.title {
  color: #303133;
  margin-bottom: 20px;
}

.button-group {
  margin: 15px 0;
  display: flex;
  gap: 10px;
}

.admin-button {
  padding: 10px 20px;
  background-color: #409eff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.admin-button:hover {
  background-color: #66b1ff;
}

.action-button {
  padding: 5px 10px;
  background-color: #67c23a;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s;
}

.action-button:hover {
  background-color: #85ce61;
}

.close-button {
  padding: 5px 10px;
  background-color: #f56c6c;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s;
}

.close-button:hover {
  background-color: #f78989;
}

.list {
  list-style: none;
  padding: 0;
}

.admin-panel {
  padding: 20px;
}

.orders-section {
  margin-top: 20px;
  background-color: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
}

.order-list {
  list-style: none;
  padding: 0;
}

.order-item {
  border: 1px solid #ebeef5;
  border-radius: 4px;
  padding: 15px;
  margin-bottom: 10px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  transition: all 0.3s;
}

.order-item:hover {
  box-shadow: 0 2px 12px 0 rgba(0,0,0,0.1);
}

.order-info {
  flex: 1;
}

.order-header {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
}

.order-id {
  font-weight: 500;
  color: #303133;
  margin-right: 15px;
}

.order-status {
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 12px;
}

.order-status.pending {
  background-color: #e6a23c1a;
  color: #e6a23c;
}

.order-status.completed {
  background-color: #67c23a1a;
  color: #67c23a;
}

.order-status.cancelled {
  background-color: #f56c6c1a;
  color: #f56c6c;
}

.order-details {
  display: flex;
  gap: 15px;
  color: #606266;
  font-size: 14px;
}

.order-price {
  color: #f56c6c;
  font-weight: 500;
}

.order-date {
  color: #909399;
}

.order-actions {
  margin-left: 15px;
}

.view-button {
  padding: 5px 15px;
  background-color: #409eff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s;
}

.view-button:hover {
  background-color: #66b1ff;
}
</style>
