<template>
  <div class="order-management">
    <h2>订单管理</h2>

    <table>
      <thead>
        <tr>
          <th>用户</th>
          <th>菜品</th>
          <th>数量</th>
          <th>总价</th>
          <th>状态</th>
          <th>操作</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="order in orders" :key="order.id">
          <td>{{ order.username }}</td>
          <td>{{ order.menu_item_name }}</td>
          <td>{{ order.quantity }}</td>
          <td>{{ order.total_price }} 元</td>
          <td>{{ order.status }}</td>
          <td>
            <button v-if="order.status === 'pending'" @click="updateStatus(order.id, 'confirmed')">确认</button>
            <button v-if="order.status === 'confirmed'" @click="updateStatus(order.id, 'completed')">完成</button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  data() {
    return {
      orders: [] // 订单列表
    };
  },
  mounted() {
    this.fetchOrders(); // 加载订单
  },
  methods: {
    async fetchOrders() {
      try {
        const response = await axios.get('http://localhost:3000/api/auth/canteen/orders');
        this.orders = response.data;
      } catch (error) {
        console.error('获取订单失败:', error);
      }
    },
    async updateStatus(orderId, status) {
      try {
        console.log('正在更新订单状态:', orderId, status); // 调试输出
        await axios.put(`http://localhost:3000/api/auth/canteen/orders/${orderId}/status`,
          { status },
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('authToken')}` // 确保 token 正确
            }
          }
        );
        this.fetchOrders(); // 刷新订单列表
        alert('订单状态已更新');
      } catch (error) {
        console.error('更新订单状态失败:', error); // 打印完整错误信息
        alert('更新订单状态失败，请稍后重试。');
      }
    }
  }
};
</script>


<style scoped>
.order-management {
  padding: 20px;
}

table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 20px;
}

th,
td {
  padding: 10px;
  border: 1px solid #ccc;
  text-align: center;
}

button {
  margin-right: 10px;
  padding: 5px;
  background-color: #4CAF50;
  color: white;
  border: none;
  cursor: pointer;
}

button:hover {
  background-color: #45a049;
}
</style>
