<template>
  <div class="news-detail">
    <h2>{{ news.title }}</h2>
    <img :src="news.image_url" alt="新闻图片" v-if="news.image_url" />
    <p v-if="news.content">{{ news.content }}</p> <!-- 只有在有内容时才显示 -->
    <button @click="goBack">返回</button>
  </div>
</template>

<script>
import axios from 'axios';

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
        const response = await axios.get(`http://localhost:3000/api/auth/articles/${newsId}`); // 更新为新的 API 路径
        this.news = response.data; // 获取新闻详情数据
        console.log('文章详情数据:', response.data); // 调试输出
      } catch (error) {
        console.error('获取新闻详情失败:', error);
      }
    },
    goBack() {
      this.$router.push('/'); // 返回首页
    },
  },
};
</script>

<style scoped>
.news-detail {
  padding: 20px;
}
</style>
