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
          <img :src="news.image_url" alt="新闻图片" />
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
import axios from 'axios';
import communityHome from '@/assets/community-home.js';

export default {
  ...communityHome,
  data() {
    return {
      ...communityHome.data(),
      carouselImages: [], // 轮播图数据
      hotNews: [],        // 热门新闻数据
      newsList: [],       // 新闻列表数据
    };
  },
  mounted() {
    this.checkDevice();
    window.addEventListener('scroll', this.handleScroll);
    window.addEventListener('resize', this.checkDevice);
    this.fetchCarouselImages(); // 获取轮播图数据
    this.fetchHotNews();        // 获取热门新闻数据
    this.fetchNewsList();       // 获取新闻列表数据
  },
  methods: {
    ...communityHome.methods,

    async fetchCarouselImages() {
      try {
        const response = await axios.get('http://localhost:3000/api/auth/carousel-images');
        console.log(response.data); // 调试输出
        this.carouselImages = response.data.map(image => image.image_url); // 将数据存储为图片URL
      } catch (error) {
        console.error('获取轮播图失败:', error);
      }
    },

    async fetchHotNews() {
      try {
        const response = await axios.get('http://localhost:3000/api/auth/hot-news');
        this.hotNews = response.data; // 存储返回的数据
      } catch (error) {
        console.error('获取热门新闻失败:', error);
      }
    },

    async fetchNewsList() {
      try {
        const response = await axios.get('http://localhost:3000/api/auth/news-list');
        this.newsList = response.data; // 存储返回的数据
      } catch (error) {
        console.error('获取新闻列表失败:', error);
      }
    },

    toggleNav() {
      this.isNavHidden = !this.isNavHidden;
    },

    prevImage() {
      this.currentImage = (this.currentImage + this.carouselImages.length - 1) % this.carouselImages.length;
    },
    nextImage() {
      this.currentImage = (this.currentImage + 1) % this.carouselImages.length;
    },
  },
};
</script>

<style scoped>
@import '@/assets/community-home.css';
</style>
