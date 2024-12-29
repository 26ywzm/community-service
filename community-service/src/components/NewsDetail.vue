<template>
  <div class="news-detail-container">
    <div class="news-detail">
      <div class="back-button" @click="goBack">
        <i class="back-icon">←</i>
        <span>返回</span>
      </div>
      
      <article class="news-content">
        <header>
          <h1>{{ news.title }}</h1>
          <div class="meta-info" v-if="news.created_at">
            <span class="date">{{ formatDate(news.created_at) }}</span>
            <span class="divider">|</span>
            <span class="views">阅读 {{ news.views || 0 }}</span>
          </div>
        </header>

        <div class="featured-image" v-if="news.blobUrl">
          <img :src="news.blobUrl" alt="新闻图片" />
        </div>

        <div class="content" v-if="news.content">
          <p>{{ news.content }}</p>
        </div>
      </article>
    </div>
  </div>
</template>

<script>
import axios from 'axios';

const BASE_URL = process.env.VUE_APP_BASE_URL;
const API = `${BASE_URL}/api/auth`;

export default {
  data() {
    return {
      news: {},
      imageCache: new Map(),
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
      
      if (this.imageCache.has(path)) {
        return this.imageCache.get(path);
      }

      try {
        const uploadPath = path.startsWith('/uploads/') ? path : `/uploads/${path}`;
        const baseUrl = API.replace('/api/auth', '');
        const response = await fetch(`${baseUrl}${uploadPath}`);
        const blob = await response.blob();
        const blobUrl = URL.createObjectURL(blob);
        
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
    },
    formatDate(dateString) {
      if (!dateString) return '';
      const date = new Date(dateString);
      return date.toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  },
};
</script>

<style scoped>
.news-detail-container {
  min-height: 100vh;
  background-color: #f5f7fa;
  padding: 40px 20px;
}

.news-detail {
  max-width: 900px;
  margin: 0 auto;
  background-color: white;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  overflow: hidden;
  animation: slideUp 0.6s ease-out;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.back-button {
  display: inline-flex;
  align-items: center;
  padding: 20px;
  cursor: pointer;
  color: #666;
  transition: all 0.3s ease;
}

.back-button:hover {
  color: #333;
  transform: translateX(-5px);
}

.back-icon {
  font-size: 20px;
  margin-right: 8px;
}

.news-content {
  padding: 0 40px 40px;
}

header {
  margin-bottom: 30px;
  text-align: center;
}

h1 {
  font-size: 32px;
  color: #2c3e50;
  margin-bottom: 16px;
  line-height: 1.4;
  font-weight: 600;
}

.meta-info {
  color: #666;
  font-size: 14px;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 10px;
}

.divider {
  color: #ddd;
}

.featured-image {
  margin: 30px -40px;
  position: relative;
  overflow: hidden;
}

.featured-image img {
  width: 100%;
  height: auto;
  max-height: 500px;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.featured-image:hover img {
  transform: scale(1.02);
}

.content {
  margin-top: 30px;
  font-size: 18px;
  line-height: 1.8;
  color: #3a4a5a;
}

.content p {
  margin-bottom: 20px;
  text-align: justify;
  letter-spacing: 0.5px;
}

/* 响应式设计 */
@media screen and (max-width: 768px) {
  .news-detail-container {
    padding: 20px 10px;
  }

  .news-detail {
    border-radius: 12px;
  }

  .news-content {
    padding: 0 20px 30px;
  }

  h1 {
    font-size: 24px;
  }

  .featured-image {
    margin: 20px -20px;
  }

  .content {
    font-size: 16px;
  }
}
</style>
