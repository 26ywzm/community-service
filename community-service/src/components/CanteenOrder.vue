<template>
  <div class="canteen-order">
    <h2>社区食堂</h2>

    <!-- 菜品列表 -->
    <div v-if="menuItems.length > 0" class="menu-list">
      <div v-for="item in menuItems" :key="item.id" class="menu-item">
        <img v-if="item.image_url" 
             :src="item.blobUrl || ''" 
             @error="loadImage(item)" 
             alt="菜品图片" />
        <div class="menu-item-info">
          <h3>{{ item.name }}</h3>
          <p class="description">{{ item.description }}</p>
          <p class="price">¥{{ item.price }}</p>
          <div class="quantity-controls">
            <button @click="decrementQuantity(item)">-</button>
            <span>{{ item.quantity }}</span>
            <button @click="incrementQuantity(item)">+</button>
          </div>
          <button @click="addToCart(item)" class="add-to-cart">加入购物车</button>
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
      cart: [], // 购物车数据
      imageCache: new Map(), // 添加图片缓存
    };
  },
  async mounted() {
    await this.fetchMenuItems(); // 加载可用的菜单项
  },
  methods: {
    async fetchMenuItems() {
      try {
        const response = await axios.get(`${BASE_URL}/api/auth/canteen/menu`);
        this.menuItems = response.data.map(item => ({ ...item, quantity: 1 })); // 添加 quantity 字段并设置默认值为1
        // 预加载所有图片
        for (const item of this.menuItems) {
          await this.loadImage(item);
        }
      } catch (error) {
        console.error('获取菜单失败:', error);
      }
    },

    async loadImage(item) {
      if (!item.image_url) return;
      item.blobUrl = await this.getImageUrl(item.image_url);
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

    async getImageUrl(path) {
      if (!path) return ''; 
      if (path.startsWith('http')) {
        return path;
      }
      
      // 检查缓存
      if (this.imageCache.has(path)) {
        return this.imageCache.get(path);
      }

      try {
        const token = localStorage.getItem('authToken');
        const headers = { 'Authorization': `Bearer ${token}` };
        const uploadPath = path.startsWith('/uploads/') ? path : `/uploads/${path}`;
        const baseUrl = process.env.VUE_APP_BASE_URL || 'http://localhost:3000';
        const response = await fetch(`${baseUrl}${uploadPath}`, { headers });
        const blob = await response.blob();
        const blobUrl = URL.createObjectURL(blob);
        
        // 存入缓存
        this.imageCache.set(path, blobUrl);
        
        return blobUrl;
      } catch (error) {
        console.error('加载图片失败:', error);
        return '';
      }
    },
    decrementQuantity(item) {
      if (item.quantity > 1) {
        item.quantity--;
      }
    },
    incrementQuantity(item) {
      item.quantity++;
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

.quantity-controls {
  display: flex;
  align-items: center;
  margin-top: 10px;
  margin-bottom: 10px;
}

.quantity-controls button {
  width: 20px;
  height: 20px;
  padding: 0;
  margin: 0 5px;
  font-size: 1rem;
  border-radius: 5px;
  border: 1px solid #ccc;
}

.quantity-controls span {
  font-size: 1rem;
  margin: 0 5px;
}

.add-to-cart {
  background-color: #4CAF50;
  color: white;
  border: none;
  padding: 10px;
  cursor: pointer;
  border-radius: 5px;
}

.add-to-cart:hover {
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
