<!-- CommunityHome.vue -->
<template>
  <div class="home-container">
    <!-- 轮播图 -->
    <div class="carousel">
      <img :src="carouselImages[currentImage]" alt="轮播图" />
      <button @click="prevImage">‹</button>
      <button @click="nextImage">›</button>
    </div>

    <!-- 热门新闻 -->
    <section class="hot-news">
      <h2>热门新闻</h2>
      <div class="hot-news-grid">
        <div v-for="news in hotNews" :key="news.id" class="news-item">
          <img :src="news.image" alt="新闻图片" />
          <p>{{ news.title }}</p>
        </div>
      </div>
    </section>

    <!-- 新闻列表 -->
    <section class="news-list">
      <h2>新闻列表</h2>
      <ul>
        <li v-for="news in newsList" :key="news.id">
          <a href="#">{{ news.title }}</a>
        </li>
      </ul>
    </section>
  </div>
</template>

<script>
// 引入外部的逻辑文件
import communityHome from '@/assets/community-home.js';

export default {
  ...communityHome,
  methods: {
    ...communityHome.methods,
    toggleNav() {
      this.isNavHidden = !this.isNavHidden;
    }
  }
};
</script>

<style scoped>
/* 引入外部的 CSS 文件 */
@import '@/assets/community-home.css';
</style>