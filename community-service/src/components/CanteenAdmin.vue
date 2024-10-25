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
  max-width: 800px;
  margin: 0 auto;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

h2 {
  text-align: center;
  color: #333;
  margin-bottom: 20px;
}

.form-section {
  margin-bottom: 40px;
  background-color: #f9f9f9;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.form-group {
  margin-bottom: 15px;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: bold;
  color: #555;
}

input[type="text"],
input[type="number"] {
  width: 100%;
  padding: 8px;
  font-size: 16px;
  border: 1px solid #ddd;
  border-radius: 5px;
  box-sizing: border-box;
  transition: border-color 0.3s ease;
}

input[type="text"]:focus,
input[type="number"]:focus {
  border-color: #42b983;
  outline: none;
}

.btn {
  background-color: #42b983;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 5px;
  font-size: 16px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.btn:hover {
  background-color: #369d73;
}

.delete {
  background-color: #e74c3c;
}

.delete:hover {
  background-color: #c0392b;
}

.edit {
  background-color: #3498db;
}

.edit:hover {
  background-color: #2980b9;
}

.menu-item {
  margin-bottom: 20px;
  padding: 15px;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.menu-item img {
  max-width: 100%;
  border-radius: 8px;
  margin-bottom: 10px;
}

.actions {
  display: flex;
  gap: 10px;
}
</style>