<template>
  <div class="home-container">
    <!-- 轮播图 -->
    <div class="carousel" @mouseenter="pauseCarousel" @mouseleave="startCarousel">
      <router-link v-if="carouselImages.length > 0"
        :to="{ name: 'NewsDetail', params: { id: carouselImages[currentImage].id } }">
        <img :src="getImageUrl(carouselImages[currentImage].image_url)" alt="轮播图" class="carousel-image" />
      </router-link>
      <button @click="prevImage">‹</button>
      <button @click="nextImage">›</button>
    </div>

    <!-- 热门新闻 -->
    <section class="hot-news">
      <h2>热门新闻</h2>
      <div class="hot-news-grid">
        <div v-for="news in hotNews" :key="news.id" class="news-item">
          <router-link :to="{ name: 'NewsDetail', params: { id: news.id } }">
            <img :src="getImageUrl(news.image_url)" alt="新闻图片" class="news-image" />
          </router-link>
          <p>{{ news.title }}</p>
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
const API = process.env.VUE_APP_API_URL;
import axios from 'axios';
import communityHome from '@/assets/community-home.js';
const BASE_URL = process.env.VUE_APP_BASE_URL;
export default {
  ...communityHome,
  data() {
    return {
      ...communityHome.data(),
      carouselImages: [], // 轮播图数据
      hotNews: [],        // 热门新闻数据
      newsList: [],       // 新闻列表数据
      currentImage: 0,    // 当前显示的轮播图索引
      intervalId: null,   // 用于存储定时器 ID
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
        const response = await axios.get(`${API}/articles?category=carousel`);
        this.carouselImages = response.data.map(article => ({
          id: article.id,
          image_url: article.image_url,
        }));
      } catch (error) {
        console.error('获取轮播图失败:', error);
      }
    },

    async fetchHotNews() {
      try {
        const response = await axios.get(`${API}/articles?category=hotNews`);
        this.hotNews = response.data;
      } catch (error) {
        console.error('获取热门新闻失败:', error);
      }
    },

    async fetchNewsList() {
      try {
        const response = await axios.get(`${API}/articles?category=newsList`);
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

    getImageUrl(path) {
      if (path.startsWith('http')) {
        // 如果已经是完整URL直接返回
        return path;
      }
      // 拼接完整URL
      return `${BASE_URL}${path}`;
    },

    nextImage() {
      if (this.carouselImages.length > 0) {
        this.currentImage = (this.currentImage + 1) % this.carouselImages.length;
      }
    },

    prevImage() {
      if (this.carouselImages.length > 0) {
        this.currentImage = (this.currentImage + this.carouselImages.length - 1) % this.carouselImages.length;
      }
    },
  },
};
</script>

<style scoped>
@import '@/assets/community-home.css';
</style>
