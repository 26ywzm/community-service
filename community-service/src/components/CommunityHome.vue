<template>
  <div class="home-container">
    <!-- 轮播图 -->
    <div class="carousel" @mouseenter="pauseCarousel" @mouseleave="startCarousel">
      <router-link v-if="carouselImages.length > 0"
        :to="{ name: 'NewsDetail', params: { id: carouselImages[currentImage].id } }">
        <img :src="carouselImages[currentImage].blobUrl" alt="轮播图" class="carousel-image" />
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
            <img :src="news.blobUrl" alt="新闻图片" class="news-image" />
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
import axios from 'axios';
const API = process.env.VUE_APP_API_URL;
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
      intervalId: null,   // 用于存储定时器 ID
      imageCache: new Map(), // 添加图片缓存
    };
  },
  mounted() {
    this.checkDevice();
    window.addEventListener('scroll', this.handleScroll);
    window.addEventListener('resize', this.checkDevice);
    this.fetchData();
    this.startCarousel();
  },
  beforeUnmount() {
    clearInterval(this.intervalId); // 组件销毁时清除定时器
  },
  methods: {
    ...communityHome.methods,

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
    async fetchData() {
      try {
        // 获取轮播图数据
        const carouselResponse = await axios.get(`${API}/articles?category=carousel`);
        this.carouselImages = carouselResponse.data;
        // 预加载轮播图
        for (const image of this.carouselImages) {
          await this.loadImage(image);
        }

        // 获取热门新闻数据
        const hotNewsResponse = await axios.get(`${API}/articles?category=hotNews`);
        this.hotNews = hotNewsResponse.data;
        // 预加载热门新闻图片
        for (const news of this.hotNews) {
          await this.loadImage(news);
        }

        // 获取新闻列表数据
        const newsListResponse = await axios.get(`${API}/articles?category=newsList`);
        this.newsList = newsListResponse.data;
      } catch (error) {
        console.error('获取数据失败:', error);
      }
    },

    startCarousel() {
      this.intervalId = setInterval(() => {
        this.nextImage(); 
      }, 3000); 
    },

    pauseCarousel() {
      clearInterval(this.intervalId); 
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
