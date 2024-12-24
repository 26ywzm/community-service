<template>
  <div class="canteen-admin">
    <h2>食堂管理</h2>

    <!-- 添加/编辑菜品的表单 -->
    <div class="form-container">
      <h3>{{ isEditing ? '编辑菜品' : '添加新菜品' }}</h3>
      <form @submit.prevent="isEditing ? updateMenuItem() : addMenuItem()" class="form">
        <div class="form-group">
          <label for="name">菜品名称</label>
          <input id="name" type="text" v-model="newItem.name" required placeholder="输入菜品名称" />
        </div>
        <div class="form-group">
          <label for="price">价格</label>
          <input id="price" type="number" v-model="newItem.price" required placeholder="输入菜品价格" />
        </div>
        <div class="form-group">
          <label for="image-url">图片链接</label>
          <input id="image-url" type="text" v-model="newItem.image_url" placeholder="输入图片URL" />
        </div>
        <div class="form-group">
          <label>或上传图片</label>
          <input type="file" @change="handleFileUpload" ref="fileInput" />
        </div>
        <div class="form-group">
          <label for="description">描述</label>
          <textarea id="description" v-model="newItem.description" placeholder="输入菜品描述"></textarea>
        </div>
        <div class="form-actions">
          <button type="submit" class="submit-btn">{{ isEditing ? '更新菜品' : '添加菜品' }}</button>
          <button type="button" @click="cancelEdit" v-if="isEditing" class="cancel-btn">取消</button>
        </div>
      </form>
    </div>

    <!-- 菜品列表 -->
    <h3>菜品列表</h3>
    <div v-if="menuItems.length > 0" class="menu-list">
      <div v-for="item in menuItems" :key="item.id" class="menu-item">
        <img v-if="item.image_url" :src="item.blobUrl || ''" @error="loadImage(item)" alt="菜品图片" />
        <div class="menu-item-info">
          <h4>{{ item.name }}</h4>
          <p class="price">价格: {{ item.price }} 元</p>
          <p class="description">{{ item.description }}</p>
        </div>
        <div class="menu-item-actions">
          <button @click="deleteMenuItem(item.id)" class="delete-btn">删除</button>
          <button @click="editMenuItem(item)" class="edit-btn">编辑</button>
        </div>
      </div>
    </div>
    <div v-else>
      <p>目前没有可用的菜品。</p>
    </div>
  </div>
</template>

<script>
import axios from 'axios';
import { handleApiError } from '../utils/errorHandler';
const API = process.env.VUE_APP_API_URL;

export default {
  data() {
    return {
      menuItems: [],
      newItem: { name: '', price: '', image_url: '', description: '' },
      imageFile: null,
      isEditing: false,
      imageCache: new Map(), // 添加图片缓存
    };
  },
  mounted() {
    this.fetchMenuItems(); // 加载菜品数据
  },
  methods: {
    async compressImage(file) {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const img = new Image();
          img.onload = () => {
            const canvas = document.createElement('canvas');
            let width = img.width;
            let height = img.height;
            
            // 如果图片大于 1200px，按比例缩小
            const maxSize = 1200;
            if (width > maxSize || height > maxSize) {
              if (width > height) {
                height = Math.round((height * maxSize) / width);
                width = maxSize;
              } else {
                width = Math.round((width * maxSize) / height);
                height = maxSize;
              }
            }

            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);
            
            // 压缩图片质量
            canvas.toBlob((blob) => {
              const compressedFile = new File([blob], file.name, {
                type: 'image/jpeg',
                lastModified: Date.now()
              });
              
              // 如果压缩后的文件仍然太大，继续压缩
              if (compressedFile.size > 2 * 1024 * 1024) {
                canvas.toBlob((blob) => {
                  resolve(new File([blob], file.name, {
                    type: 'image/jpeg',
                    lastModified: Date.now()
                  }));
                }, 'image/jpeg', 0.6); // 使用更低的质量
              } else {
                resolve(compressedFile);
              }
            }, 'image/jpeg', 0.8); // 0.8 是压缩质量
          };
          img.src = e.target.result;
        };
        reader.readAsDataURL(file);
      });
    },
    async handleFileUpload(event) {
      const file = event.target.files[0];
      if (!file) return;

      // 检查文件类型
      if (!file.type.startsWith('image/')) {
        alert('请上传图片文件');
        this.$refs.fileInput.value = '';
        return;
      }

      // 检查文件大小（限制为 5MB）
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        alert('图片大小不能超过 5MB，请压缩后重试');
        this.$refs.fileInput.value = '';
        return;
      }

      try {
        // 如果文件大于 2MB，进行压缩
        if (file.size > 2 * 1024 * 1024) {
          this.imageFile = await this.compressImage(file);
        } else {
          this.imageFile = file;
        }
      } catch (error) {
        console.error('图片处理失败:', error);
        alert('图片处理失败，请重试');
        this.$refs.fileInput.value = '';
      }
    },
    async fetchMenuItems() {
      try {
        const response = await axios.get(`${API}/canteen/menu`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`
          }
        });
        this.menuItems = response.data; // 获取菜品数据
        // 预加载所有图片
        for (const item of this.menuItems) {
          await this.loadImage(item);
        }
      } catch (error) {
        handleApiError(error);
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
        await axios.post(`${API}/canteen/menu`, formData, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
            'Content-Type': 'multipart/form-data'
          },
          withCredentials: true,
          maxContentLength: Infinity,
          maxBodyLength: Infinity
        });
        this.fetchMenuItems(); // 刷新菜单列表
        this.resetForm();
      } catch (error) {
        handleApiError(error, {
          suppressAuthError: true,
          customErrorHandler: () => {
            alert('添加菜品失败，请重试');
          }
        });
      }
    },
    async deleteMenuItem(itemId) {
      try {
        await axios.delete(`${API}/canteen/menu/${itemId}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`
          }
        });
        this.fetchMenuItems(); // 刷新菜单列表
      } catch (error) {
        handleApiError(error, {
          suppressAuthError: true,
          customErrorHandler: () => {
            alert('删除菜品失败，请重试');
          }
        });
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
        await axios.put(
          `${API}/canteen/menu/${this.newItem.id}`, 
          formData,
          {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
              'Content-Type': 'multipart/form-data'
            }
          }
        );
        this.fetchMenuItems(); // 刷新菜单列表
        this.resetForm();
      } catch (error) {
        handleApiError(error, {
          suppressAuthError: true,
          customErrorHandler: () => {
            alert('更新菜品失败，请重试');
          }
        });
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
    async loadImage(item) {
      if (!item.image_url) return;
      item.blobUrl = await this.getImageUrl(item.image_url);
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
    }
  }
};
</script>

<style scoped>
.canteen-admin {
  padding: 30px;
  font-family: Arial, sans-serif;
}

.form-container {
  background-color: #f9f9f9;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
  margin-bottom: 20px;
}

.form h3 {
  font-size: 1.5em;
  margin-bottom: 20px;
}

.form-group {
  margin-bottom: 15px;
}

label {
  display: block;
  font-weight: bold;
  margin-bottom: 5px;
}

input, textarea {
  width: 100%;
  padding: 10px;
  border-radius: 5px;
  border: 1px solid #ccc;
  font-size: 1em;
}

textarea {
  min-height: 100px;
  resize: vertical;
}

button {
  padding: 10px 20px;
  border-radius: 5px;
  border: none;
  cursor: pointer;
  font-size: 1em;
}

.submit-btn {
  background-color: #4CAF50;
  color: white;
}

.submit-btn:hover {
  background-color: #45a049;
}

.cancel-btn {
  background-color: #f44336;
  color: white;
  margin-left: 10px;
}

.cancel-btn:hover {
  background-color: #e53935;
}

.menu-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 20px;
}

.menu-item {
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  padding: 15px;
  transition: transform 0.3s ease;
}

.menu-item:hover {
  transform: translateY(-5px);
}

.menu-item img {
  width: 100%;
  height: auto;
  border-radius: 5px;
}

.menu-item-info {
  padding: 10px 0;
}

.menu-item-info h4 {
  font-size: 1.2em;
  margin: 0;
}

.menu-item-info .price {
  color: #4CAF50;
}

.menu-item-actions {
  margin-top: 10px;
}

.menu-item-actions button {
  margin-right: 10px;
  padding: 8px 15px;
  border-radius: 5px;
  font-size: 0.9em;
}

.edit-btn {
  background-color: #2196F3;
  color: white;
}

.edit-btn:hover {
  background-color: #1976D2;
}

.delete-btn {
  background-color: #f44336;
  color: white;
}

.delete-btn:hover {
  background-color: #e53935;
}
</style>
