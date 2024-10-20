<template>
  <div class="canteen" v-if="isLoggedIn">
    <h2>社区食堂菜单</h2>
    <div v-for="item in menuItems" :key="item.id" class="menu-item">
      <img :src="item.image_url" alt="菜品图片" />
      <h3>{{ item.name }}</h3>
      <p>{{ item.description }}</p>
      <p>价格: {{ item.price }} 元</p>
      <input type="number" v-model="item.quantity" min="1" placeholder="数量" />
      <button @click="order(item.id, item.quantity)">订餐</button>
    </div>
  </div>
  <div v-else>
    <p>请登录以查看菜单。</p>
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
  computed: {
    isLoggedIn() {
      return !!localStorage.getItem('authToken'); // 检查是否有 token
    }
  },
  mounted() {
    if (this.isLoggedIn) {
      this.fetchMenuItems();
    }
  },
  methods: {
    async fetchMenuItems() {
      try {
        const response = await axios.get('http://localhost:3000/api/canteen/menu');
        this.menuItems = response.data; // 获取菜单数据
      } catch (error) {
        console.error('获取菜单失败:', error);
      }
    },
    async order(menuItemId, quantity) {
      try {
        await axios.post('http://localhost:3000/api/canteen/order', {
          menu_item_id: menuItemId,
          quantity: quantity,
        });
        alert('订餐成功！');
      } catch (error) {
        console.error('订餐失败:', error);
      }
    },
  },
};
</script>

<style scoped>

</style>
