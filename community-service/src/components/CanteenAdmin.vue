<template>
  <div class="canteen-admin">
    <h2>食堂管理</h2>

    <!-- 添加/编辑菜品的表单 -->
    <div>
      <h3>{{ isEditing ? '编辑菜品' : '添加新菜品' }}</h3>
      <form @submit.prevent="isEditing ? updateMenuItem() : addMenuItem()">
        <div>
          <label>菜品名称</label>
          <input type="text" v-model="newItem.name" required />
        </div>
        <div>
          <label>价格</label>
          <input type="number" v-model="newItem.price" required />
        </div>
        <div>
          <label>图片链接</label>
          <input type="text" v-model="newItem.image_url" />
        </div>
        <div>
          <label>描述</label>
          <textarea v-model="newItem.description"></textarea>
        </div>
        <button type="submit">{{ isEditing ? '更新菜品' : '添加菜品' }}</button>
        <button type="button" @click="cancelEdit" v-if="isEditing">取消</button>
      </form>
    </div>

    <!-- 菜品列表 -->
    <h3>菜品列表</h3>
    <div v-if="menuItems.length > 0">
      <div v-for="item in menuItems" :key="item.id" class="menu-item">
        <img :src="item.image_url" alt="菜品图片" />
        <h3>{{ item.name }}</h3>
        <p>价格: {{ item.price }} 元</p>
        <p>描述: {{ item.description }}</p>
        <button @click="deleteMenuItem(item.id)">删除</button>
        <button @click="editMenuItem(item)">编辑</button>
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
      menuItems: [],
      newItem: { name: '', price: '', image_url: '', description: '' },
      isEditing: false, // 编辑状态
    };
  },
  mounted() {
    this.fetchMenuItems(); // 加载菜品数据
  },
  methods: {
    async fetchMenuItems() {
      try {
        const response = await axios.get('http://localhost:3000/api/auth/canteen/menu');
        this.menuItems = response.data; // 获取菜品数据
      } catch (error) {
        console.error('获取菜单失败:', error);
      }
    },
    async addMenuItem() {
      try {
        await axios.post('http://localhost:3000/api/auth/canteen/menu', this.newItem);
        this.fetchMenuItems(); // 刷新菜单列表
        this.newItem = { name: '', price: '', image_url: '', description: '' }; // 清空表单
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
    editMenuItem(item) {
      this.newItem = { ...item }; // 复制要编辑的菜品
      this.isEditing = true; // 设置为编辑状态
    },
    async updateMenuItem() {
      try {
        await axios.put(`http://localhost:3000/api/auth/canteen/menu/${this.newItem.id}`, this.newItem);
        this.fetchMenuItems(); // 刷新菜单列表
        this.resetForm(); // 清空表单
      } catch (error) {
        console.error('更新菜品失败:', error);
      }
    },
    cancelEdit() {
      this.resetForm(); // 清空表单
    },
    resetForm() {
      this.isEditing = false; // 退出编辑状态
      this.newItem = { name: '', price: '', image_url: '', description: '' }; // 清空表单
    },
  }
};
</script>

<style scoped>
.canteen-admin {
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