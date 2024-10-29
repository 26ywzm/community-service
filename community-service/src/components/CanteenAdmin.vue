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
          <label>或上传图片</label>
          <input type="file" @change="handleFileUpload" ref="fileInput" />
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
        <img :src="getImageUrl(item.image_url)" alt="菜品图片" />
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

const BASE_URL = 'http://localhost:3000';

export default {
  data() {
    return {
      menuItems: [],
      newItem: { name: '', price: '', image_url: '', description: '' },
      imageFile: null, // 增加一个字段存储文件
      isEditing: false, // 编辑状态
    };
  },
  mounted() {
    this.fetchMenuItems(); // 加载菜品数据
  },
  methods: {
    handleFileUpload(event) {
      this.imageFile = event.target.files[0];
    },
    async fetchMenuItems() {
      try {
        const response = await axios.get(`${BASE_URL}/api/auth/canteen/menu`);
        this.menuItems = response.data; // 获取菜品数据
      } catch (error) {
        console.error('获取菜单失败:', error);
      }
    },
    async addMenuItem() {
      const formData = new FormData();
      formData.append('name', this.newItem.name);
      formData.append('price', this.newItem.price);
      formData.append('image_url', this.newItem.image_url);
      formData.append('description', this.newItem.description);
      if (this.imageFile) {
        formData.append('image', this.imageFile); // 添加文件到formData
      }

      try {
        await axios.post(`${BASE_URL}/api/auth/canteen/menu`, formData);
        this.fetchMenuItems(); // 刷新菜单列表
        this.resetForm();
      } catch (error) {
        console.error('添加菜品失败:', error);
      }
    },
    async deleteMenuItem(itemId) {
      try {
        await axios.delete(`${BASE_URL}/api/auth/canteen/menu/${itemId}`);
        this.fetchMenuItems(); // 刷新菜单列表
      } catch (error) {
        console.error('删除菜品失败:', error);
      }
    },
    editMenuItem(item) {
      this.newItem = { ...item };
      this.isEditing = true; // 设置为编辑状态
    },
    async updateMenuItem() {
      const formData = new FormData();
      formData.append('name', this.newItem.name);
      formData.append('price', this.newItem.price);
      formData.append('image_url', this.newItem.image_url);
      formData.append('description', this.newItem.description);
      if (this.imageFile) {
        formData.append('image', this.imageFile); // 添加文件到formData
      }

      try {
        await axios.put(`${BASE_URL}/api/auth/canteen/menu/${this.newItem.id}`, formData);
        this.fetchMenuItems(); // 刷新菜单列表
        this.resetForm();
      } catch (error) {
        console.error('更新菜品失败:', error);
      }
    },
    cancelEdit() {
      this.resetForm(); // 清空表单
    },
    resetForm() {
      this.isEditing = false;
      this.newItem = { name: '', price: '', image_url: '', description: '' };
      this.imageFile = null; // 重置文件字段
      this.$refs.fileInput.value = ''; // 清空文件输入
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