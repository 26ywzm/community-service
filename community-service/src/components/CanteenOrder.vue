<template>
  <div class="canteen-order">
    <h2>社区食堂</h2>

    <!-- 菜品列表 -->
    <div v-if="menuItems.length > 0" class="menu-list">
      <div v-for="item in menuItems" :key="item.id" class="menu-item">
        <img :src="getImageUrl(item.image_url)" alt="菜品图片" />
        <div class="menu-item-info">
          <h3>{{ item.name }}</h3>
          <p class="description">{{ item.description }}</p>
          <p class="price">价格: {{ item.price }} 元</p>

          <!-- 订餐数量输入框 -->
          <div class="quantity-selector">
            <input type="number" v-model.number="item.quantity" min="1" placeholder="订购数量" />
            <button @click="addToCart(item)" class="add-to-cart-btn">加入购物车</button>
          </div>
        </div>
      </div>
    </div>

    <div v-else>
      <p>目前没有可用的菜品。</p>
    </div>

    <!-- 购物车 -->
    <div v-if="cart.length > 0" class="cart">
      <h3>购物车</h3>
      <ul>
        <li v-for="(cartItem, index) in cart" :key="cartItem.id" class="cart-item">
          <span>{{ cartItem.name }} ({{ cartItem.quantity }}): {{ cartItem.price * cartItem.quantity }} 元</span>
          <button @click="removeFromCart(index)" class="remove-btn">删除</button>
        </li>
      </ul>
      <div class="cart-footer">
        <button @click="checkout" class="checkout-btn">结账</button>
      </div>
    </div>
    <div v-else>
      <p>购物车为空。</p>
    </div>
  </div>
</template>

<script>
import axios from 'axios';

const BASE_URL = process.env.VUE_APP_BASE_URL;

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
        const response = await axios.get(`${BASE_URL}/api/auth/canteen/menu`);
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
        this.cart.push({ ...item });
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
        menuItemId: cartItem.id, 
        quantity: cartItem.quantity,
        price: cartItem.price 
      }));

      if (orders.length === 0) {
        alert('请至少选择一项菜品！');
        return;
      }

      try {
        console.log('Orders being sent:', orders);
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
        return path;
      }
      return `${BASE_URL}${path}`;
    }
  }
};
</script>

<style scoped>
.canteen-order {
  padding: 20px;
  font-family: 'Arial', sans-serif;
}

h2 {
  font-size: 2rem;
  color: #333;
  margin-bottom: 20px;
}

.menu-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 20px;
}

.menu-item {
  background-color: #fff;
  border-radius: 8px;
  padding: 15px;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s ease;
}

.menu-item:hover {
  transform: translateY(-5px);
}

.menu-item img {
  width: 100%;
  height: auto;
  border-radius: 5px;
  object-fit: cover;
}

.menu-item-info {
  padding: 10px;
}

.menu-item-info h3 {
  font-size: 1.5rem;
  margin: 10px 0;
}

.menu-item-info .description {
  color: #666;
  font-size: 0.9rem;
  margin: 10px 0;
}

.menu-item-info .price {
  font-size: 1.2rem;
  color: #4CAF50;
  font-weight: bold;
}

.quantity-selector {
  display: flex;
  align-items: center;
  margin-top: 10px;
}

.quantity-selector input {
  width: 50px;
  padding: 5px;
  margin-right: 10px;
  font-size: 1rem;
  border-radius: 5px;
  border: 1px solid #ccc;
}

.add-to-cart-btn {
  background-color: #4CAF50;
  color: white;
  border: none;
  padding: 10px;
  cursor: pointer;
  border-radius: 5px;
}

.add-to-cart-btn:hover {
  background-color: #45a049;
}

.cart {
  margin-top: 30px;
}

.cart-item {
  padding: 10px;
  background-color: #f9f9f9;
  margin-bottom: 10px;
  border-radius: 5px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.cart-footer {
  display: flex;
  justify-content: flex-end;
}

.remove-btn {
  background-color: #f44336;
  color: white;
  padding: 5px 10px;
  border-radius: 5px;
  border: none;
  cursor: pointer;
}

.remove-btn:hover {
  background-color: #e53935;
}

.checkout-btn {
  background-color: #2196F3;
  color: white;
  padding: 10px 20px;
  border-radius: 5px;
  border: none;
  cursor: pointer;
}

.checkout-btn:hover {
  background-color: #1976D2;
}

button {
  font-size: 1rem;
}
</style>
