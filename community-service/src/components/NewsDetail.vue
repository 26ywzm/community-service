<template>
  <div class="news-detail">
    <h2>{{ news.title }}</h2>
    <img :src="news.blobUrl" alt="新闻图片" v-if="news.blobUrl" />
    <p v-if="news.content">{{ news.content }}</p> <!-- 只有在有内容时才显示 -->
    <button @click="goBack">返回</button>
  </div>
</template>

<script>
import axios from 'axios';

// 确保 URL 前缀正确，调整为你实际的服务器 URL 及端口
const BASE_URL = process.env.VUE_APP_BASE_URL;
const API = `${BASE_URL}/api/auth`;

export default {
  data() {
    return {
      news: {}, // 新闻详情数据
      imageCache: new Map(), // 添加图片缓存
    };
  },
  mounted() {
    this.fetchNews();
  },
  methods: {
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
        const uploadPath = path.startsWith('/uploads/') ? path : `/uploads/${path}`;
        const baseUrl = API.replace('/api/auth', '');
        const response = await fetch(`${baseUrl}${uploadPath}`);
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
    async fetchNews() {
      try {
        const response = await axios.get(`${API}/articles/${this.$route.params.id}`);
        this.news = response.data;
        await this.loadImage(this.news);
      } catch (error) {
        console.error('获取新闻详情失败:', error);
      }
    },
    goBack() {
      this.$router.push('/');
    }
  },
};
</script>

<style scoped>
.news-detail {
  max-width: 800px;
  margin: 0 auto;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  background-color: #f9f9f9;
  padding: 20px;
  border-radius: 10px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

h2 {
  text-align: center;
  color: #333;
  margin-bottom: 20px;
  font-size: 28px;
}

img {
  display: block;
  margin: 0 auto 20px;
  max-width: 100%;
  height: auto;
  border-radius: 8px;
  object-fit: cover;
  overflow: hidden;
}

p {
  line-height: 1.6;
  font-size: 18px;
  color: #444;
  margin-bottom: 20px;
  text-align: justify;
}

button {
  background-color: #42b983;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 5px;
  font-size: 16px;
  cursor: pointer;
  display: block;
  margin: 0 auto;
  transition: background-color 0.3s;
}

button:hover {
  background-color: #369d73;
}

button:active {
  background-color: #2b805d;
}
</style>
