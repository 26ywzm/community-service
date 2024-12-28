<template>
  <div class="order-management">
    <h2>订单管理</h2>
    <div v-if="loading" class="loading">加载中...</div>
    <div v-else>
      <!-- 订单卡片布局 -->
      <div class="order-cards">
        <div v-for="order in orders" :key="order.id" class="order-card">
          <h3>订单ID: {{ order.id }}</h3>
          <div class="order-info">
            <div class="user-info">
              <div>{{ order.username }}</div>
              <div class="email">{{ order.email }}</div>
            </div>
            <div class="order-items">
              <div v-for="item in order.items" :key="item.menu_item_id" class="order-item">
                <span class="item-name">{{ item.name }}</span>
                <div class="item-details">
                  <span>数量: {{ item.quantity }}</span>
                  <span>单价: ¥{{ item.price }}</span>
                  <span>小计: ¥{{ item.quantity * item.price }}</span>
                </div>
              </div>
            </div>
            <div class="price">总价: ¥{{ order.total_price }}</div>
            <div class="status">
              <span :class="['status-tag', 'status-' + order.status]">
                {{ statusText[order.status] }}
              </span>
            </div>
            <div class="time-info">
              <div>{{ formatDate(order.created_at).date }}</div>
              <div class="time">{{ formatDate(order.created_at).time }}</div>
            </div>
            <div class="order-actions">
              <button 
                v-if="parseInt(order.status) === 0" 
                class="btn-confirm"
                @click="handleButtonClick(order)"
              >开始处理</button>
              <button 
                v-if="parseInt(order.status) === 1" 
                class="btn-complete"
                @click="handleButtonClick(order)"
              >完成订单</button>
              <button 
                v-if="parseInt(order.status) === 2" 
                class="btn-delete"
                @click="handleDeleteOrder(order)"
              >删除订单</button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="orders.length === 0 && !loading">
      <p class="empty-message">没有找到订单。</p>
    </div>

    <!-- 对话框 -->
    <div v-if="showDialog" class="dialog-overlay">
      <div class="dialog">
        <p>{{ dialogMessage }}</p>
        <button @click="closeDialog">确定</button>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';
import { ElMessage } from 'element-plus';

const API = process.env.VUE_APP_API_URL;

export default {
  data() {
    return {
      orders: [], // 存储所有订单信息
      showDialog: false,
      dialogMessage: '',
      lastActionTime: 0, // 记录上一次操作的时间戳
      loading: false,
      // 状态显示文本
      statusText: {
        0: '待处理',
        1: '处理中',
        2: '已完成',
        3: '已取消'
      }
    };
  },
  async mounted() {
    await this.fetchOrders(); // 加载所有订单
  },
  methods: {
    async fetchOrders() {
      try {
        this.loading = true;
        const token = localStorage.getItem('authToken');
        
        if (!token) {
          ElMessage.error('请先登录');
          return;
        }

        const response = await axios.get(`${API}/canteen/orders`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.data.orders) {
          this.orders = response.data.orders.map(order => ({
            ...order,
            lastActionTime: 0,
            items: order.items || [] // 确保 items 存在
          }));
        }
      } catch (error) {
        console.error('获取订单列表失败:', error);
        if (error.response?.status === 403) {
          ElMessage.error('没有权限访问订单列表');
        } else {
          ElMessage.error(error.response?.data?.message || '获取订单列表失败');
        }
      } finally {
        this.loading = false;
      }
    },
    
    async handleButtonClick(order) {
      if (!this.canPerformAction(order)) {
        ElMessage.warning('操作太频繁，请稍后再试');
        return;
      }

      try {
        let newStatus;
        const currentStatus = parseInt(order.status);
        switch (currentStatus) {
          case 0:  // pending
            newStatus = 1;  // confirmed
            break;
          case 1:  // confirmed
            newStatus = 2;  // completed
            break;
          default:
            ElMessage.error(`当前状态 ${this.statusText[order.status]} 无法进行操作`);
            return;
        }

        await this.updateOrderStatus(order, newStatus);
        // 操作成功后刷新订单列表
        await this.fetchOrders();
      } catch (error) {
        console.error('操作失败:', error);
        ElMessage.error('操作失败，请重试');
      }
    },

    canPerformAction(order) {
      const now = Date.now();
      // 如果是第一次操作，或者距离上次操作超过3秒
      if (!order.lastActionTime || now - order.lastActionTime > 3000) {
        return true;
      }
      return false;
    },

    async updateOrderStatus(order, status) {
      try {
        console.log('Updating order status:', { orderId: order.id, status: status });
        await axios.put(
          `${API}/canteen/orders/${order.id}`, 
          { status }, 
          {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
              'Content-Type': 'application/json'
            }
          }
        );
        
        ElMessage.success(`订单状态已更新为${this.statusText[status]}`);
        order.lastActionTime = Date.now(); // 更新最后操作时间
        order.status = status; // 更新本地状态
      } catch (error) {
        console.error('更新订单状态失败:', error);
        ElMessage.error(error.response?.data?.message || '更新订单状态失败，请重试');
        throw error;
      }
    },

    async handleDeleteOrder(order) {
      try {
        if (!confirm('确定要删除这个订单吗？此操作不可撤销。')) {
          return;
        }
        
        await axios.delete(`${API}/canteen/orders/${order.id}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`
          }
        });
        
        ElMessage.success('订单已删除');
        // 从列表中移除该订单
        this.orders = this.orders.filter(o => o.id !== order.id);
      } catch (error) {
        console.error('删除订单失败:', error);
        ElMessage.error(error.response?.data?.message || '删除订单失败，请重试');
      }
    },

    closeDialog() {
      this.showDialog = false;
      this.dialogMessage = '';
    },

    formatDate(dateString) {
      const date = new Date(dateString);
      return {
        date: date.toLocaleDateString('zh-CN', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit'
        }),
        time: date.toLocaleTimeString('zh-CN', {
          hour: '2-digit',
          minute: '2-digit'
        })
      };
    }
  }
};
</script>

<style scoped>
.order-management {
  padding: 16px;
}

h2 {
  color: #303133;
  margin-bottom: 16px;
  font-size: 24px;
}

.order-cards {
  display: flex;
  flex-wrap: wrap; /* 允许换行 */
  gap: 16px;
  justify-content: flex-start; /* 所有订单对齐到左边 */
}

.order-card {
  background-color: white;
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  width: 300px; /* 固定宽度 */
  box-sizing: border-box;
  flex-grow: 1; /* 允许订单卡片在没有足够空间时扩展 */
}

.order-info {
  margin-top: 16px;
}

.order-items {
  padding: 8px 0;
}

.order-item {
  background-color: #f8f9fa;
  padding: 8px;
  margin-bottom: 8px;
}

.item-info {
  display: flex;
  flex-direction: column; /* 垂直排列 */
  gap: 4px; /* 为每个信息项提供间距 */
}

.item-name {
  font-weight: bold;
  color: #303133;
}

.item-details {
  font-size: 14px;
  color: #606266;
}

.item-quantity,
.item-price,
.item-total {
  margin-bottom: 4px; /* 让数量、单价和小计之间有间距 */
}

.price {
  font-weight: bold;
  margin-top: 12px;
}

.status-tag {
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 12px;
}

.time-info {
  display: flex;
  flex-direction: column;
  margin-top: 8px;
}

.time {
  font-size: 14px;
  color: #909399;
}

.order-actions {
  margin-top: 12px;
  display: flex;
  gap: 8px;
  flex-direction: column;
}

button {
  padding: 8px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: 0.3s;
  margin: 4px 0;
  font-size: 14px;
  width: 100%;
}

.btn-confirm {
  background-color: #67C23A;
  color: white;
}

.btn-complete {
  background-color: #409EFF;
  color: white;
}

.btn-delete {
  background-color: #F56C6C;
  color: white;
}

.empty-message {
  text-align: center;
  color: #909399;
  margin-top: 40px;
}

/* Mobile Optimization */
@media screen and (max-width: 768px) {
  table {
    display: none; /* 隐藏桌面端表格 */
  }

  .order-cards {
    flex-direction: column; /* 垂直排列 */
    align-items: flex-start; /* 所有订单左对齐 */
    gap: 16px; /* 提供一定的间距 */
  }

  .order-card {
    width: 100%; /* 在小屏幕上每个订单卡片宽度占满父容器 */
    flex-grow: 0; /* 不扩展 */
    margin-bottom: 16px;
  }

  .order-info {
    display: flex;
    flex-direction: column;
  }

  .user-info {
    display: flex;
    flex-direction: column;
    margin-bottom: 8px; /* 用户信息之间有间距 */
  }

  .email {
    font-size: 14px;
    color: #909399;
  }

  .item-info {
    gap: 6px;
  }

  .item-name {
    font-size: 16px;
    color: #303133;
  }

  .item-details {
    font-size: 12px;
    color: #606266;
  }

  .item-quantity,
  .item-price,
  .item-total {
    font-size: 13px;
  }

  .btn-confirm,
  .btn-complete,
  .btn-delete {
    width: 100%;
    padding: 12px;
  }

  .empty-message {
    font-size: 14px;
  }
}

/* Large screen optimization (above 768px) */
@media screen and (min-width: 769px) {
  .order-cards {
    flex-wrap: wrap;
    gap: 16px;
  }

  .order-card {
    width: 300px; /* 固定宽度 */
    flex-grow: 1; /* 自动填充空间 */
  }
}

</style>