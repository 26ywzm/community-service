<template>
  <div class="article-editor">
    <h2>{{ editingArticleId ? "编辑文章" : "编写文章" }}</h2>
    <form @submit.prevent="submitArticle">
      <div>
        <label>标题：</label>
        <input type="text" v-model="title" required />
      </div>
      <div>
        <label>内容：</label>
        <textarea v-model="content" required></textarea>
      </div>
      <div>
        <label>图片链接：</label>
        <input type="text" v-model="imageUrl" />
      </div>
      <div>
        <label>或上传图片：</label>
        <input type="file" ref="fileInput" @change="handleFileUpload" />
      </div>
      <div>
        <label>选择发布位置：</label>
        <select v-model="category" required>
          <option value="carousel">轮播图</option>
          <option value="hotNews">热门新闻</option>
          <option value="newsList">新闻列表</option>
        </select>
      </div>
      <button type="submit">{{ editingArticleId ? "保存修改" : "发布文章" }}</button>
      <button v-if="editingArticleId" type="button" @click="cancelEdit">取消编辑</button>
    </form>

    <!-- 选择文章区域 -->
    <div class="articles-area">
      <!-- 切换按钮 -->
      <div class="category-buttons">
        <button @click="loadArticles('carousel')">轮播图</button>
        <button @click="loadArticles('hotNews')">热门新闻</button>
        <button @click="loadArticles('newsList')">新闻列表</button>
      </div>

      <!-- 列表展示 -->
      <div v-for="article in articles" :key="article.id" class="article">
        <h3>{{ article.title }}</h3>
        <img v-if="article.image_url" :src="article.blobUrl || ''" @error="loadImage(article)" :alt="article.title" class="article-image">
        <p>{{ article.content }}</p>
        <div class="action-buttons">
          <button class="edit" @click="editArticle(article)">修改</button>
          <button @click="deleteArticle(article.id)">删除</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';
import { adminAuth } from '../mixins/adminAuth';
const API = process.env.VUE_APP_API_URL;

export default {
  name: 'ArticleEditor',
  mixins: [adminAuth],
  data() {
    return {
      title: '',
      content: '',
      imageUrl: '',
      category: 'newsList',
      imageFile: null,
      editingArticleId: null,
      articles: [],
      imageCache: new Map(), // 添加图片缓存
    };
  },
  methods: {
    async fetchArticles(category) {
      if (!this.checkAdminAuth()) return;
      try {
        const token = localStorage.getItem('authToken');
        const headers = { 'Authorization': `Bearer ${token}` };
        const response = await axios.get(`${API}/articles${category ? `?category=${category}` : ''}`, { headers });
        this.articles = response.data;
        // 预加载所有图片
        for (const article of this.articles) {
          await this.loadImage(article);
        }
      } catch (error) {
        console.error('获取文章失败:', error);
      }
    },
    async loadArticles(category) {
      this.category = category; // 更新当前类别
      await this.fetchArticles(category); // 获取对应类别的文章
    },
    handleFileUpload(event) {
      this.imageFile = event.target.files[0];
    },
    async submitArticle() {
      if (!this.checkAdminAuth()) return;
      try {
        const formData = new FormData();
        formData.append('title', this.title);
        formData.append('content', this.content);
        formData.append('category', this.category);
        formData.append('image_url', this.imageUrl);
        if (this.imageFile) {
          formData.append('image', this.imageFile);
        }

        const token = localStorage.getItem('authToken');
        const headers = {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`
        };

        if (this.editingArticleId) {
          // 编辑模式
          await axios.put(`${API}/articles/${this.editingArticleId}`, formData, { headers });
          alert('文章修改成功');
        } else {
          // 新建模式
          await axios.post(`${API}/articles`, formData, { headers });
          alert('文章发布成功');
        }
        this.resetForm();
        this.fetchArticles();
      } catch (error) {
        console.error('提交文章失败:', error);
        alert('提交失败，请重试。');
      }
    },
    editArticle(article) {
      if (!this.checkAdminAuth()) return;
      this.title = article.title;
      this.content = article.content;
      this.imageUrl = article.image_url;
      this.category = article.category;
      this.editingArticleId = article.id;
    },
    async deleteArticle(articleId) {
      if (!this.checkAdminAuth()) return;
      if (confirm('确定要删除这篇文章吗？')) {
        try {
          const token = localStorage.getItem('authToken');
          const headers = { 'Authorization': `Bearer ${token}` };
          await axios.delete(`${API}/articles/${articleId}`, { headers });
          this.fetchArticles(); // 重新加载文章列表
        } catch (error) {
          console.error('删除文章失败:', error);
          alert('删除失败，请重试。');
        }
      }
    },
    resetForm() {
      this.title = '';
      this.content = '';
      this.imageUrl = '';
      this.imageFile = null;
      this.category = 'newsList';
      this.editingArticleId = null;
      this.$refs.fileInput.value = '';
    },
    cancelEdit() {
      this.resetForm();
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
    async loadImage(article) {
      if (!article.image_url) return;
      article.blobUrl = await this.getImageUrl(article.image_url);
    },
  },
  mounted() {
    if (!this.checkAdminAuth()) {
      this.$router.push('/');
      return;
    }
    this.fetchArticles();
  }
};
</script>

<style scoped>
.article-image {
  max-width: 100%;
  height: auto;
  margin: 10px 0;
}
.article-editor {
  padding: 20px;
  max-width: 600px;
  margin: 0 auto;
  background-color: #ffffff;
  border-radius: 10px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

h2 {
  text-align: center;
  color: #333;
  margin-bottom: 20px;
}

/* 新增区域样式 */
.article-area {
  margin-bottom: 30px;
}

.category-buttons {
  display: flex;
  justify-content: space-between;
  margin-bottom: 20px;
}

.category-buttons button {
  flex: 1;
  padding: 10px;
  margin-right: 10px;
  background-color: #42b983;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.category-buttons button:hover {
  background-color: #369d73;
}

.category-buttons button:last-child {
  margin-right: 0; /* 去掉最后一个按钮的右边距 */
}

/* 修改按钮和删除按钮的样式 */
.article .action-buttons {
  display: flex;
  justify-content: space-between;
  margin-top: 10px; /* 上方的间距 */
}

.action-buttons button {
  flex: 1; /* 使按钮宽度均匀 */
  padding: 5px; /* 按钮变小 */
  margin-right: 5px; /* 按钮之间的间距 */
  background-color: #e74c3c; /* 删除按钮颜色 */
  border: none;
  border-radius: 5px;
  color: white;
  cursor: pointer;
  transition: background-color 0.3s;
}

.action-buttons button:hover {
  background-color: #c0392b; /* 删除按钮悬停颜色 */
}

.action-buttons button.edit {
  background-color: #42b983; /* 修改按钮颜色 */
}

.action-buttons button.edit:hover {
  background-color: #369d73; /* 修改按钮悬停颜色 */
}

.form-group {
  margin-bottom: 60px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: bold;
  color: #555;
}

.form-group label.required::after {
  content: '*';
  color: #e74c3c;
  margin-left: 5px;
}

input[type="text"],
textarea,
select {
  width: 100%;
  padding: 10px;
  font-size: 16px;
  border: 1px solid #ddd;
  border-radius: 5px;
  box-sizing: border-box;
  transition: border-color 0.3s ease;
}

input[type="text"]:focus,
textarea:focus,
select:focus {
  border-color: #42b983;
  outline: none;
}

textarea {
  resize: vertical;
  height: 120px;
}

button {
  width: 100%;
  background-color: #42b983;
  color: white;
  border: none;
  padding: 12px 0;
  border-radius: 5px;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  transition: background-color 0.3s;
  margin-top: 15px;
}

button:disabled {
  background-color: #bdc3c7;
  cursor: not-allowed;
}

button:not(:disabled):hover {
  background-color: #369d73;
}

@media (max-width: 768px) {
  .article-editor {
    padding: 15px;
  }

  button {
    font-size: 14px;
    padding: 10px 0;
    margin-top: 15px;
  }
}
</style>
