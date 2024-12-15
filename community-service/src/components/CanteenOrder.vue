<template>
  <div class="canteen-order">
    <h2>社区食堂</h2>

    <!-- 菜品列表 -->
    <div v-if="menuItems.length > 0">
      <div v-for="item in menuItems" :key="item.id" class="menu-item">
        <img :src="getImageUrl(item.image_url)" alt="菜品图片" />
        <h3>{{ item.name }}</h3>
        <p>{{ item.description }}</p>
        <p>价格: {{ item.price }} 元</p>

        <!-- 订餐数量输入框 -->
        <input type="number" v-model.number="item.quantity" min="1" placeholder="订购数量" />

        <!-- 加入购物车按钮 -->
        <button @click="addToCart(item)">加入购物车</button>
      </div>
    </div>

    <div v-else>
      <p>目前没有可用的菜品。</p>
    </div>

    <!-- 购物车 -->
    <div v-if="cart.length > 0">
      <h3>购物车</h3>
      <ul>
        <li v-for="(cartItem, index) in cart" :key="cartItem.id">
          {{ cartItem.name }} ({{ cartItem.quantity }}): {{ cartItem.price * cartItem.quantity }} 元
          <button @click="removeFromCart(index)">删除</button>
        </li>
      </ul>
    </div>

    <!-- 结账按钮 -->
    <button @click="checkout">结账</button>
  </div>
</template>

<script>
import axios from 'axios';

const BASE_URL = process.env.VUE_APP_BASE_URL; // 确保 BASE_URL 正确指向你的服务器地址

export default {
  data() {
    return {
      menuItems: [], // 菜单数据
      cart: [] // 购物车数据
    };
  },
  mounted() {
    this.fetchMenuItems(); // 加载可用的菜单项
  },
  methods: {
    async fetchMenuItems() {
      try {
        const response = await axios.get(`${BASE_URL}/api/auth/canteen/menu`); // 请求可用菜单项
        this.menuItems = response.data.map(item => ({ ...item, quantity: 1 })); // 添加 quantity 字段并设置默认值为1
      } catch (error) {
        console.error('获取菜单失败:', error);
      }
    },

    addToCart(item) {
      // 检查购物车中是否已经存在该菜品
      const existingItem = this.cart.find(cartItem => cartItem.id === item.id);
      if (existingItem) {
        existingItem.quantity += item.quantity; // 更新数量
      } else {
        this.cart.push({ ...item }); // 将菜品添加到购物车
      }
      item.quantity = 1; // 重置输入框为1
      alert(`${item.name} 已加入购物车！`);
    },

    removeFromCart(index) {
      this.cart.splice(index, 1); // 从购物车中删除指定索引的菜品
      alert('菜品已从购物车中删除！');
    },

    async checkout() {
      const orders = this.cart.map(cartItem => ({
        menuItemId: cartItem.id, // 修改字段名称
        quantity: cartItem.quantity,
        price: cartItem.price // 确保 price 字段有效
      }));

      if (orders.length === 0) {
        alert('请至少选择一项菜品！');
        return;
      }

      try {
        console.log('Orders being sent:', orders); // 打印订单数据以调试
        const response = await axios.post(
          `${BASE_URL}/api/auth/canteen/order`,
          { items: orders },
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('authToken')}`,
            }
          }
        );

        alert(response.data.message || '结账成功！');
        this.$router.push(`/order/${response.data.orderId}`);
      } catch (error) {
        console.error('结账失败:', error);
        alert('结账失败，请重试。');
      }
    },

    getImageUrl(path) {
      if (path.startsWith('http')) {
        // 如果已经是完整URL直接返回
        return path;
      }
      // 拼接完整URL
      return `${BASE_URL}${path}`;
    }
  }
};
</script>

<style scoped>
.canteen-order {
  padding: 20px;
}

.menu-item {
  border: 1px solid #ccc;
  padding: 10px;
  margin-bottom: 20px;
}

img {
  max-width: 100px;
  margin-right: 20px;
}

button {
  background-color: #4CAF50;
  color: white;
  border: none;
  padding: 10px;
  cursor: pointer;
  border-radius: 5px;
}

button:hover {
  background-color: #45a049;
}
</style>