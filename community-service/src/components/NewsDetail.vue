<template>
  <div class="news-detail">
    <h2>{{ news.title }}</h2>
    <img :src="getImageUrl(news.image_url)" alt="新闻图片" v-if="news.image_url" />
    <p v-if="news.content">{{ news.content }}</p> <!-- 只有在有内容时才显示 -->
    <button @click="goBack">返回</button>
  </div>
</template>

<script>
import axios from 'axios';

// 确保 URL 前缀正确，调整为你实际的服务器 URL 及端口
const BASE_URL = 'http://localhost:3000';

export default {
  data() {
    return {
      news: {}, // 新闻详情数据
    };
  },
  mounted() {
    this.fetchNewsDetail();
  },
  methods: {
    async fetchNewsDetail() {
      const newsId = this.$route.params.id; // 从路由参数获取新闻 ID
      try {
        const response = await axios.get(`${BASE_URL}/api/auth/articles/${newsId}`);
        this.news = response.data; // 获取新闻详情数据
        console.log('文章详情数据:', response.data); // 调试输出
      } catch (error) {
        console.error('获取新闻详情失败:', error);
      }
    },
    getImageUrl(path) {
      if (path.startsWith('http')) {
        // 如果已经是完整URL直接返回
        return path;
      }
      // 拼接完整URL
      return `${BASE_URL}${path}`;
    },
    goBack() {
      this.$router.push('/'); // 返回首页
    },
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
