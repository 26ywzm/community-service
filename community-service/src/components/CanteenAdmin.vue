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
            let { width, height } = img;
            
            // 计算图片的复杂度（基于尺寸）
            const complexity = width * height;
            
            // 根据复杂度动态调整压缩参数
            let quality = 0.8;
            let maxDimension = 1200;
            
            if (complexity > 1920 * 1080) {
              quality = 0.7;
              maxDimension = 1000;
            }
            
            // 保持宽高比进行缩放
            if (width > height) {
              if (width > maxDimension) {
                height = Math.round((height * maxDimension) / width);
                width = maxDimension;
              }
            } else {
              if (height > maxDimension) {
                width = Math.round((width * maxDimension) / height);
                height = maxDimension;
              }
            }

            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);
            
            // 递归压缩，直到文件大小合适
            const compressRecursive = (currentQuality) => {
              canvas.toBlob((blob) => {
                const compressedFile = new File([blob], file.name, {
                  type: 'image/jpeg',
                  lastModified: Date.now()
                });
                
                // 如果文件仍然太大且质量还可以继续降低
                if (compressedFile.size > 1.5 * 1024 * 1024 && currentQuality > 0.3) {
                  compressRecursive(currentQuality - 0.1);
                } else {
                  console.log('最终图片大小:', (compressedFile.size / 1024 / 1024).toFixed(2) + 'MB');
                  resolve(compressedFile);
                }
              }, 'image/jpeg', currentQuality);
            };
            
            // 开始压缩
            compressRecursive(quality);
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

      try {
        console.log('原始图片大小:', (file.size / 1024 / 1024).toFixed(2) + 'MB');
        // 对所有图片进行压缩，但使用智能压缩算法
        this.imageFile = await this.compressImage(file);
        console.log('压缩后图片大小:', (this.imageFile.size / 1024 / 1024).toFixed(2) + 'MB');
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
        formData.append('image', this.imageFile);
      }

      try {
        const response = await axios.post(`${API}/canteen/menu`, formData, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
            'Content-Type': 'multipart/form-data'
          },
          withCredentials: true,
          maxBodyLength: Infinity,
          maxContentLength: Infinity,
          timeout: 60000, // 增加超时时间到60秒
          onUploadProgress: (progressEvent) => {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            console.log('上传进度：', percentCompleted);
          }
        });
        
        console.log('上传成功：', response.data);
        this.fetchMenuItems(); // 刷新菜单列表
        this.resetForm();
      } catch (error) {
        console.error('上传错误：', error);
        if (error.response) {
          console.error('错误响应：', error.response.data);
          alert(error.response.data.message || '添加菜品失败，请重试');
        } else if (error.request) {
          console.error('请求错误：', error.request);
          alert('网络连接失败，请检查网络后重试');
        } else {
          console.error('错误：', error.message);
          alert('添加菜品失败，请重试');
        }
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
