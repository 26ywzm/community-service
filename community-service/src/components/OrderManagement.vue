<template>
  <div class="order-management">
    <h2>订单管理</h2>
    <div v-if="loading" class="loading">加载中...</div>
    <div v-else>
      <table>
        <thead>
          <tr>
            <th>订单ID</th>
            <th>用户名</th>
            <th>订单详情</th>
            <th>总价</th>
            <th>状态</th>
            <th>创建时间</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="order in orders" :key="order.id">
            <td>{{ order.id }}</td>
            <td>
              <div class="user-info">
                <div>{{ order.username }}</div>
                <div class="email">{{ order.email }}</div>
              </div>
            </td>
            <td>
              <div class="order-items">
                <div v-for="item in order.items" :key="item.menu_item_id" class="order-item">
                  <div class="item-info">
                    <span class="item-name">{{ item.name }}</span>
                    <div class="item-details">
                      <span class="item-quantity">数量: {{ item.quantity }}</span>
                      <span class="item-price">单价: ¥{{ item.price }}</span>
                      <span class="item-total">小计: ¥{{ item.quantity * item.price }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </td>
            <td class="price">¥{{ order.total_price }}</td>
            <td>
              <span :class="['status-tag', 'status-' + order.status]">
                {{ statusText[order.status] }}
              </span>
            </td>
            <td>
              <div class="time-info">
                <div>{{ formatDate(order.created_at).date }}</div>
                <div class="time">{{ formatDate(order.created_at).time }}</div>
              </div>
            </td>
            <td class="order-actions">
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
            </td>
          </tr>
        </tbody>
      </table>
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

const API = 'http://localhost:3000/api/auth';  // 直接定义 API 地址

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
  mounted() {
    this.fetchOrders(); // 加载所有订单
  },
  methods: {
    async fetchOrders() {
      try {
        this.loading = true;
        const response = await axios.get(`${API}/canteen/orders`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`
          }
        });
        console.log('获取到的订单数据:', response.data);
        
        // 处理订单数据
        this.orders = response.data.orders.map(order => ({
          ...order,
          lastActionTime: 0,
          items: order.items || [] // 确保 items 存在
        }));
        
        // 更新分页信息
        if (response.data.pagination) {
          this.pagination = response.data.pagination;
        }
      } catch (error) {
        console.error('获取订单列表失败:', error);
        ElMessage.error('获取订单列表失败');
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
  padding: 20px;
}

h2 {
  color: #303133;
  margin-bottom: 20px;
}

table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 20px;
  background-color: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 12px 0 rgba(0,0,0,0.1);
}

th, td {
  padding: 12px 15px;
  text-align: left;
  border-bottom: 1px solid #EBEEF5;
}

th {
  background-color: #F5F7FA;
  color: #606266;
  font-weight: 500;
}

tr:hover {
  background-color: #F5F7FA;
}

button {
  padding: 6px 12px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s;
  margin: 0 5px;
}

button:hover {
  opacity: 0.8;
}

.dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.dialog {
  background-color: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0,0,0,0.1);
  text-align: center;
}

.dialog p {
  margin-bottom: 15px;
  color: #606266;
}

.dialog button {
  background-color: #409EFF;
  color: white;
  padding: 8px 20px;
}

.order-actions {
  display: flex;
  gap: 8px;
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

.user-info {
  display: flex;
  flex-direction: column;
}

.email {
  font-size: 14px;
  color: #909399;
}

.order-items {
  max-width: 300px;
  padding: 8px;
}

.order-item {
  background-color: #f8f9fa;
  border-radius: 4px;
  padding: 8px;
  margin-bottom: 8px;
}

.order-item:last-child {
  margin-bottom: 0;
}

.item-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.item-name {
  font-weight: bold;
  color: #303133;
}

.item-details {
  display: flex;
  flex-direction: column;
  gap: 2px;
  font-size: 13px;
  color: #606266;
}

.item-quantity, .item-price, .item-total {
  margin-right: 12px;
}

.item-total {
  color: #409EFF;
  font-weight: 500;
}

.price {
  font-weight: bold;
}

.status-tag {
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 12px;
}

.status-0 {
  background-color: #F56C6C;
  color: white;
}

.status-1 {
  background-color: #67C23A;
  color: white;
}

.status-2 {
  background-color: #409EFF;
  color: white;
}

.status-3 {
  background-color: #909399;
  color: white;
}

.time-info {
  display: flex;
  flex-direction: column;
}

.time {
  font-size: 14px;
  color: #909399;
}

.loading {
  text-align: center;
  margin-top: 40px;
}
</style>