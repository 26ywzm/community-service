<template>
    <div class="order-management">
      <h2>订单管理</h2>
  
      <div v-if="orders.length > 0">
        <table>
          <thead>
            <tr>
              <th>订单 ID</th>
              <th>用户</th>
              <th>邮箱</th>
              <th>总价格</th>
              <th>创建时间</th>
              <th>状态</th>
              <th>详细内容</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="order in orders" :key="order.id">
              <td>{{ order.id }}</td>
              <td>{{ order.username }}</td>
              <td>{{ order.email }}</td>
              <td>{{ order.total_price }} 元</td>
              <td>{{ formatDate(order.created_at) }}</td>
              <td>{{ order.status }}</td>
              <td>
                <ul>
                  <li v-for="item in order.items" :key="item.menu_item_id">
                    {{ item.name }} ({{ item.quantity }}): {{ item.total }} 元
                  </li>
                </ul>
              </td>
              <td>
                <button 
                  v-if="order.status === 'pending'" 
                  @click="handleButtonClick(order, 'confirmed')"
                >确定订单</button>
  
                <button 
                  v-if="order.status === 'confirmed'" 
                  @click="handleButtonClick(order, 'completed')"
                >完成订单</button>
  
                <button 
                  v-if="order.status === 'completed'" 
                  @click="handleButtonClick(order, 'deleted')"
                >删除订单</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
  
      <div v-else>
        <p>没有找到订单。</p>
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
  
  export default {
    data() {
      return {
        orders: [], // 存储所有订单信息
        showDialog: false,
        dialogMessage: '',
        lastActionTime: 0 // 记录上一次操作的时间戳
      };
    },
    mounted() {
      this.fetchOrders(); // 加载所有订单
    },
    methods: {
      async fetchOrders() {
        try {
          const response = await axios.get('http://localhost:3000/api/auth/canteen/orders', {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('authToken')}`
            }
          });
          this.orders = response.data.map(order => ({ ...order, lastActionTime: 0 })); // 为每个订单添加一个lastActionTime属性
        //   console.log('Fetched Orders:', JSON.stringify(this.orders, null, 2)); // 打印获取到的订单数据
        } catch (error) {
          console.error('获取订单列表失败:', error);
          alert('获取订单列表失败，请重试。');
        }
      },
      handleButtonClick(order, newStatus) {
        const currentTime = Date.now();
        const timeElapsed = currentTime - order.lastActionTime;
        const delay = 2 * 60 * 1000; // 2分钟
  
        if (timeElapsed < delay) {
          // 弹出对话框提示操作太频繁
          this.dialogMessage = '操作太频繁，请稍后再试';
          this.showDialog = true;
          return;
        }
  
        const actionFn = async () => {
          try {
            if (newStatus === 'deleted') {
              await this.deleteOrder(order.id);
            } else {
              await this.updateOrderStatus(order, newStatus);
            }
          } catch (error) {
            console.error('操作失败:', error);
          }
        };
  
        order.lastActionTime = currentTime; // 更新订单的上一次操作时间
        actionFn();
      },
      async updateOrderStatus(order, status) {
        try {
          await axios.put(
            `http://localhost:3000/api/auth/canteen/orders/${order.id}`, 
            { status }, 
            {
              headers: {
                Authorization: `Bearer ${localStorage.getItem('authToken')}`
              }
            }
          );
          alert('订单状态已更新');
          order.status = status; // 更新本地状态以避免重新获取
        } catch (error) {
          console.error('更新订单状态失败:', error);
          alert('更新订单状态失败，请重试。');
        }
      },
      async deleteOrder(orderId) {
        try {
          await axios.delete(`http://localhost:3000/api/auth/canteen/orders/${orderId}`, {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('authToken')}`
            }
          });
          alert('订单已删除');
          this.orders = this.orders.filter(order => order.id !== orderId); // 更新本地订单列表
        } catch (error) {
          console.error('删除订单失败:', error);
          alert('删除订单失败，请重试。');
        }
      },
      closeDialog() {
        this.showDialog = false;
        this.dialogMessage = '';
      },
      formatDate(dateString) {
        const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
        return new Date(dateString).toLocaleDateString('zh-CN', options);
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
  }
  th, td {
    border: 1px solid #ddd;
    padding: 8px;
  }
  th {
    background-color: #f2f2f2;
  }
  button {
    background-color: #4CAF50;
    color: white;
    border: none;
    padding: 5px 10px;
    cursor: pointer;
    border-radius: 3px;
    margin-right: 5px;
  }
  button[disabled] {
    background-color: #ddd;
    cursor: not-allowed;
  }
  button:hover:not([disabled]) {
    background-color: #45a049;
  }
  .dialog-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
  }
  .dialog {
    background: white;
    padding: 20px;
    border-radius: 8px;
    text-align: center;
  }
  </style>