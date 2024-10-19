<template>
  <div class="home-container">
    <!-- 轮播图 -->
    <div class="carousel" @mouseenter="pauseCarousel" @mouseleave="startCarousel">
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
        <router-link :to="{ name: 'NewsDetail', params: { id: news.id } }">查看详情</router-link>
      </div>
    </div>
    </section>

    <!-- 新闻列表 -->
    <section class="news-list">
    <h2>新闻列表</h2>
    <ul>
      <li v-for="news in newsList" :key="news.id">
        <router-link :to="{ name: 'NewsDetail', params: { id: news.id } }">{{ news.title }}</router-link>
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
      currentImage: 0,    // 当前显示的轮播图索引
      intervalId: null,    // 用于存储定时器 ID
    };
  },
  mounted() {
    this.checkDevice();
    window.addEventListener('scroll', this.handleScroll);
    window.addEventListener('resize', this.checkDevice);
    this.fetchCarouselImages(); // 获取轮播图数据
    this.fetchHotNews();        // 获取热门新闻数据
    this.fetchNewsList();       // 获取新闻列表数据
    this.startCarousel();       // 启动轮播图定时器
  },
  beforeUnmount() {
    clearInterval(this.intervalId); // 组件销毁时清除定时器
  },
  methods: {
    ...communityHome.methods,

    async fetchCarouselImages() {
      try {
        const response = await axios.get('http://localhost:3000/api/auth/articles?category=carousel'); // 修改为新 API
        this.carouselImages = response.data.map(article => article.image_url);
      } catch (error) {
        console.error('获取轮播图失败:', error);
      }
    },

    async fetchHotNews() {
      try {
        const response = await axios.get('http://localhost:3000/api/auth/articles?category=hotNews'); // 修改为新 API
        this.hotNews = response.data;
      } catch (error) {
        console.error('获取热门新闻失败:', error);
      }
    },

    async fetchNewsList() {
      try {
        const response = await axios.get('http://localhost:3000/api/auth/articles?category=newsList'); // 修改为新 API
        this.newsList = response.data;
      } catch (error) {
        console.error('获取新闻列表失败:', error);
      }
    },

    startCarousel() {
      this.intervalId = setInterval(() => {
        this.nextImage(); // 定时切换到下一张图片
      }, 3000); // 每 3 秒切换一次
    },

    pauseCarousel() {
      clearInterval(this.intervalId); // 鼠标悬停时暂停
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
