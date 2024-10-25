<template>
  <div class="canteen-order">
    <h2>社区食堂</h2>

    <!-- 菜品列表 -->
    <div v-if="menuItems.length > 0">
      <div v-for="item in menuItems" :key="item.id" class="menu-item">
        <img :src="item.image_url" alt="菜品图片" />
        <h3>{{ item.name }}</h3>
        <p>{{ item.description }}</p>
        <p>价格: {{ item.price }} 元</p>

        <!-- 订餐数量输入框 -->
        <input type="number" v-model="item.quantity" min="1" placeholder="订购数量" />

        <!-- 订餐按钮 -->
        <button @click="order(item)">订餐</button>
      </div>
    </div>

    <div v-else>
      <p>目前没有可用的菜品。</p>
    </div>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  data() {
    return {
      menuItems: [], // 菜单数据
    };
  },
  mounted() {
    this.fetchMenuItems(); // 加载可用的菜单项
  },
  methods: {
    async fetchMenuItems() {
      try {
        const response = await axios.get('http://localhost:3000/api/auth/canteen/menu'); // 请求可用菜单项
        this.menuItems = response.data.map(item => ({ ...item, quantity: 1 })); // 添加 quantity 字段并设置默认值为1
      } catch (error) {
        console.error('获取菜单失败:', error);
        alert('获取菜单失败，请稍后重试。');
      }
    },

    async order(item) {
      if (item.quantity <= 0) {
        alert('订购数量必须大于0');
        return;
      }

      try {
        const response = await axios.post('http://localhost:3000/api/auth/canteen/order', {
          menu_item_id: item.id,
          quantity: item.quantity,
        }, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('authToken')}`, // Bearer 格式
          }
        });
        alert(response.data.message || '订餐成功！');
      } catch (error) {
        console.error('订餐失败:', error);
        alert('订餐失败，请重试。');
      }
    }
  }
};
</script>

<style scoped>
.canteen-order {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

h2 {
  text-align: center;
  color: #333;
  margin-bottom: 30px;
}

.menu-list {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
}

.menu-item {
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  align-items: center;
  transition: transform 0.3s, box-shadow 0.3s;
  position: relative; /* 绝对定位子元素 */
}

.menu-item:hover {
  transform: translateY(-5px);
  box-shadow: 0 6px 10px rgba(0, 0, 0, 0.15);
}

.item-image {
  width: 100%;
  height: 150px;
  object-fit: cover;
}

.item-info {
  text-align: center;
  padding: 15px;
}

.price {
  color: #e74c3c;
  font-size: 18px;
  font-weight: bold;
  margin: 10px 0;
}

.order-btn {
  background-color: #42b983;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 5px;
  font-size: 16px;
  cursor: pointer;
  transition: background-color 0.3s;
  position: absolute; /* 绝对定位 */
  bottom: 15px; /* 距离底部 15px */
  left: 50%; /* 水平中心 */
  transform: translateX(-50%); /* 调整水平中心偏移 */
}

.order-btn:hover {
  background-color: #369d73;
}

button:active {
  background-color: #2b805d;
}
</style>
