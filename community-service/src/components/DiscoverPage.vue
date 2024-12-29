<template>
  <div class="discover-container">
    <div class="discover">
      <header class="page-header">
        <h1>发现</h1>
      </header>

      <!-- 检查用户是否已登录 -->
      <div v-if="isLoggedIn" class="content-wrapper">
        <!-- 普通用户的功能 -->
        <div v-if="!isAdmin && !isSuperAdmin" class="feature-grid">
          <router-link to="/CanteenOrder" class="feature-card">
            <div class="card-icon">🍽️</div>
            <span class="card-title">社区食堂</span>
          </router-link>
          <div class="feature-card" @click="fetchUserOrders">
            <div class="card-icon">📋</div>
            <span class="card-title">我的订单</span>
          </div>
          <router-link to="/feedback" class="feature-card">
            <div class="card-icon">💭</div>
            <span class="card-title">意见反馈</span>
          </router-link>
          <router-link to="/votelist" class="feature-card">
            <div class="card-icon">📊</div>
            <span class="card-title">管理投票</span>
          </router-link>
        </div>

        <!-- 用户订单列表 -->
        <div v-if="orders.length > 0" class="orders-section">
          <h2 class="section-title">我的订单</h2>
          <div class="order-list">
            <div v-for="order in orders" :key="order.id" class="order-card">
              <div class="order-header">
                <span class="order-number">订单号: {{ order.id }}</span>
                <span class="order-status" :class="order.status">
                  {{ getOrderStatusText(order.status) }}
                </span>
              </div>
              <div class="order-body">
                <div class="order-info">
                  <div class="price">¥{{ order.total_price }}</div>
                  <div class="date">{{ formatDate(order.created_at) }}</div>
                </div>
                <button @click="viewOrderDetails(order.id)" class="view-details-btn">
                  查看详情
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- 管理员和超级管理员的功能 -->
        <div v-if="isAdmin || isSuperAdmin" class="admin-section">
          <div class="feature-grid">
            <router-link to="/articles/new" class="feature-card admin">
              <div class="card-icon">📝</div>
              <span class="card-title">文章编写</span>
            </router-link>
            <div class="feature-card admin" @click="openAdminPanel">
              <div class="card-icon">⚙️</div>
              <span class="card-title">管理模块</span>
            </div>
            <router-link to="/canteenadmin" class="feature-card admin">
              <div class="card-icon">🏪</div>
              <span class="card-title">食堂管理</span>
            </router-link>
            <router-link to="/canteen/orders" class="feature-card admin">
              <div class="card-icon">📦</div>
              <span class="card-title">订单管理</span>
            </router-link>
            <router-link to="/managefeedback" class="feature-card admin">
              <div class="card-icon">📢</div>
              <span class="card-title">意见反馈</span>
            </router-link>
            <router-link to="/adminvotes" class="feature-card admin">
              <div class="card-icon">🗳️</div>
              <span class="card-title">管理投票</span>
            </router-link>
          </div>
        </div>

        <!-- 管理面板对话框 -->
        <el-dialog
          v-model="dialogVisible"
          title="管理模块"
          width="90%"
          :fullscreen="isMobile"
          :before-close="handleClose"
          :close-on-click-modal="false"
          class="admin-dialog"
        >
          <div class="admin-panel">
            <div class="panel-header">
              <h3>管理员和用户列表</h3>
              <div v-if="isAdmin && !isSuperAdmin" class="role-info">
                <el-alert
                  title="提示：您可以查看用户列表，但只有超级管理员可以修改权限"
                  type="info"
                  :closable="false"
                  show-icon
                />
              </div>
            </div>

            <div v-loading="loading" class="panel-content">
              <div v-if="error" class="error-message">{{ error }}</div>
              
              <template v-else>
                <div class="user-section">
                  <h4>管理员列表</h4>
                  <div class="user-list">
                    <div v-for="admin in admins" :key="admin.id" class="user-card">
                      <div class="user-info">
                        <span class="username">{{ admin.username }}</span>
                        <span class="role-badge" :class="{ 'super': admin.role === 'super_admin' }">
                          {{ admin.role === 'super_admin' ? '超级管理员' : '管理员' }}
                        </span>
                      </div>
                      <div class="user-actions" v-if="isSuperAdmin && admin.role !== 'super_admin'">
                        <button @click="demoteUser(admin.id)" class="action-btn demote">降为用户</button>
                        <button @click="deleteUser(admin.id)" class="action-btn delete">删除</button>
                      </div>
                    </div>
                  </div>
                </div>

                <div class="user-section">
                  <h4>用户列表</h4>
                  <div class="user-list">
                    <div v-for="user in users" :key="user.id" class="user-card">
                      <div class="user-info">
                        <span class="username">{{ user.username }}</span>
                        <span class="role-badge">用户</span>
                      </div>
                      <div class="user-actions" v-if="isSuperAdmin">
                        <button @click="promoteUser(user.id)" class="action-btn promote">升为管理员</button>
                        <button @click="deleteUser(user.id)" class="action-btn delete">删除</button>
                      </div>
                    </div>
                  </div>
                </div>
              </template>
            </div>
          </div>
          <template #footer>
            <div class="dialog-footer">
              <el-button @click="closeDialog" type="primary">关闭</el-button>
            </div>
          </template>
        </el-dialog>
      </div>

      <!-- 未登录用户 -->
      <div v-else class="login-prompt">
        <div class="prompt-icon">🔒</div>
        <p>请登录以查看内容</p>
        <router-link to="/login" class="login-btn">立即登录</router-link>
      </div>
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
      error: null,
      isMobile: window.innerWidth <= 768
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
    window.addEventListener('resize', this.handleResize);
  },
  beforeUnmount() {
    if (this.verificationInterval) {
      clearInterval(this.verificationInterval);
    }
    window.removeEventListener('resize', this.handleResize);
  },
  methods: {
    handleResize() {
      this.isMobile = window.innerWidth <= 768;
    },
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
.discover-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.discover {
  background-color: #f9f9f9;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
}

.page-header {
  margin-bottom: 20px;
}

.page-header h1 {
  font-weight: 500;
  color: #303133;
}

.feature-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  margin-bottom: 20px;
}

.feature-card {
  background-color: white;
  border-radius: 4px;
  padding: 20px;
  cursor: pointer;
  transition: all 0.3s;
}

.feature-card:hover {
  box-shadow: 0 2px 12px 0 rgba(0,0,0,0.1);
}

.feature-card.admin {
  background-color: #409eff;
  color: white;
}

.feature-card.admin:hover {
  background-color: #66b1ff;
}

.card-icon {
  font-size: 24px;
  margin-bottom: 10px;
}

.card-title {
  font-weight: 500;
  color: #303133;
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

.order-card {
  border: 1px solid #ebeef5;
  border-radius: 4px;
  padding: 15px;
  margin-bottom: 10px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  transition: all 0.3s;
}

.order-card:hover {
  box-shadow: 0 2px 12px 0 rgba(0,0,0,0.1);
}

.order-header {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
}

.order-number {
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

.order-body {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.order-info {
  display: flex;
  gap: 15px;
  color: #606266;
  font-size: 14px;
}

.price {
  color: #f56c6c;
  font-weight: 500;
}

.date {
  color: #909399;
}

.view-details-btn {
  padding: 5px 15px;
  background-color: #409eff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s;
}

.view-details-btn:hover {
  background-color: #66b1ff;
}

.admin-section {
  margin-top: 20px;
}

.admin-dialog {
  max-width: 90%;
  margin: 0 auto;
}

.admin-panel {
  padding: 20px;
}

.panel-header {
  margin-bottom: 20px;
}

.panel-header h3 {
  font-weight: 500;
  color: #303133;
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

.user-section {
  margin-bottom: 20px;
}

.user-list {
  list-style: none;
  padding: 0;
}

.user-card {
  border: 1px solid #ebeef5;
  border-radius: 4px;
  padding: 15px;
  margin-bottom: 10px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  transition: all 0.3s;
}

.user-card:hover {
  box-shadow: 0 2px 12px 0 rgba(0,0,0,0.1);
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

.role-badge {
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 12px;
  background-color: #e1f3d8;
  color: #67c23a;
}

.role-badge.super {
  background-color: #ffd04b;
  color: #b88230;
}

.user-actions {
  display: flex;
  gap: 8px;
}

.action-btn {
  padding: 5px 10px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s;
}

.action-btn.demote {
  background-color: #e6a23c;
  color: white;
}

.action-btn.demote:hover {
  background-color: #f78989;
}

.action-btn.promote {
  background-color: #67c23a;
  color: white;
}

.action-btn.promote:hover {
  background-color: #85ce61;
}

.action-btn.delete {
  background-color: #f56c6c;
  color: white;
}

.action-btn.delete:hover {
  background-color: #f78989;
}

.dialog-footer {
  margin-top: 20px;
  text-align: right;
}

.login-prompt {
  text-align: center;
  padding: 20px;
}

.prompt-icon {
  font-size: 48px;
  margin-bottom: 10px;
}

.login-btn {
  padding: 10px 20px;
  background-color: #409eff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s;
}

.login-btn:hover {
  background-color: #66b1ff;
}

/* 响应式设计 */
@media screen and (max-width: 1200px) {
  .discover-container {
    padding: 15px;
  }

  .feature-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media screen and (max-width: 992px) {
  .feature-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .order-body {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }

  .view-details-btn {
    width: 100%;
  }
}

@media screen and (max-width: 768px) {
  .discover-container {
    padding: 10px;
  }

  .discover {
    padding: 15px;
  }

  .page-header h1 {
    font-size: 24px;
  }

  .feature-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 10px;
  }

  .feature-card {
    padding: 15px;
  }

  .card-icon {
    font-size: 20px;
  }

  .card-title {
    font-size: 14px;
  }

  .orders-section {
    padding: 15px;
  }

  .order-card {
    padding: 12px;
  }

  .order-header {
    flex-direction: column;
    gap: 8px;
  }

  .order-status {
    align-self: flex-start;
  }

  .order-info {
    flex-direction: column;
    gap: 8px;
  }

  .user-card {
    flex-direction: column;
    gap: 10px;
    text-align: center;
  }

  .user-info {
    flex-direction: column;
  }

  .user-actions {
    width: 100%;
    justify-content: center;
  }

  .action-btn {
    flex: 1;
    max-width: 120px;
  }
}

@media screen and (max-width: 480px) {
  .feature-grid {
    grid-template-columns: 1fr;
  }

  .card-icon {
    font-size: 24px;
  }

  .card-title {
    font-size: 16px;
  }

  .order-number,
  .order-status,
  .price,
  .date {
    font-size: 14px;
  }

  .view-details-btn {
    font-size: 14px;
    padding: 8px 12px;
  }

  .user-card {
    padding: 10px;
  }

  .role-badge {
    font-size: 11px;
  }

  .action-btn {
    font-size: 12px;
    padding: 4px 8px;
  }
}

/* 暗色模式支持 */
@media (prefers-color-scheme: dark) {
  .discover {
    background-color: #1a1a1a;
  }

  .feature-card {
    background-color: #2d2d2d;
  }

  .feature-card .card-title {
    color: #ffffff;
  }

  .feature-card.admin {
    background-color: #1867c0;
  }

  .order-card,
  .user-card {
    background-color: #2d2d2d;
    border-color: #3d3d3d;
  }

  .order-number,
  .username {
    color: #ffffff;
  }

  .date,
  .order-info {
    color: #b0b0b0;
  }

  .role-badge {
    background-color: #2d2d2d;
  }

  .role-badge.super {
    background-color: #4a3000;
    color: #ffd04b;
  }

  .login-prompt {
    color: #ffffff;
  }
}
</style>
