<!-- CanteenAdmin.vue -->
<template>
  <div class="canteen-admin">
    <h2>食堂管理</h2>

    <!-- 添加新菜品的表单 -->
    <div>
      <h3>添加新菜品</h3>
      <form @submit.prevent="addMenuItem">
        <div>
          <label>菜品名称</label>
          <input type="text" v-model="newItem.name" required />
        </div>
        <div>
          <label>价格</label>
          <input type="number" v-model="newItem.price" required />
        </div>
        <div>
          <label>描述</label>
          <input type="text" v-model="newItem.description" />
        </div>
        <div>
          <label>图片链接</label>
          <input type="text" v-model="newItem.image_url" />
        </div>
        <button type="submit">添加</button>
      </form>
    </div>

    <!-- 菜品列表 -->
    <div v-for="item in menuItems" :key="item.id" class="menu-item">
      <img :src="item.image_url" alt="菜品图片" />
      <h3>{{ item.name }}</h3>
      <p>价格: {{ item.price }} 元</p>
      <button @click="deleteMenuItem(item.id)">删除</button>
      <button @click="editMenuItem(item.id)">编辑</button>
    </div>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  data() {
    return {
      menuItems: [],
      newItem: {
        name: '',
        price: '',
        image_url: ''
      }
    };
  },
  mounted() {
    this.fetchMenuItems();
  },
  methods: {
    async fetchMenuItems() {
      try {
        const response = await axios.get('http://localhost:3000/api/auth/canteen/menu/all');
        this.menuItems = response.data;
      } catch (error) {
        console.error('获取菜单失败:', error);
      }
    },

    async addMenuItem() {
      try {
        await axios.post('http://localhost:3000/api/auth/canteen/menu', this.newItem);
        this.fetchMenuItems(); // 刷新菜单列表
        this.newItem = { name: '', price: '', image_url: '' }; // 清空表单
      } catch (error) {
        console.error('添加菜品失败:', error);
      }
    },
    async deleteMenuItem(itemId) {
      try {
        await axios.delete(`http://localhost:3000/api/auth/canteen/menu/${itemId}`);
        this.fetchMenuItems(); // 刷新菜单列表
      } catch (error) {
        console.error('删除菜品失败:', error);
      }
    },
    editMenuItem(itemId) {
      // 跳转到编辑页面或弹出编辑表单
      console.log(`编辑菜品ID: ${itemId}`);
    }
  }
};

</script>

<style scoped>
.canteen-admin {
  padding: 20px;
}
</style>