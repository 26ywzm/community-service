// src/assets/community-home.js

export default {
    data() {
      return {
        isMobile: false,
        isNavHidden: false,
        carouselImages: [
          'carousel1.jpg',
          'carousel2.jpg',
          'carousel3.jpg',
        ],
        currentImage: 0,
        hotNews: [
          { id: 1, title: '社区活动一', image: 'hot1.jpg' },
          { id: 2, title: '社区活动二', image: 'hot2.jpg' },
          { id: 3, title: '社区活动三', image: 'hot3.jpg' },
        ],
        newsList: [
          { id: 1, title: '新闻条目1' },
          { id: 2, title: '新闻条目2' },
          { id: 3, title: '新闻条目3' },
        ],
      };
    },
    mounted() {
      this.checkDevice();
      window.addEventListener('scroll', this.handleScroll);
      window.addEventListener('resize', this.checkDevice);
    },
    beforeDestroy() {
      window.removeEventListener('scroll', this.handleScroll);
      window.removeEventListener('resize', this.checkDevice);
    },
    methods: {
      checkDevice() {
        this.isMobile = window.innerWidth <= 768;
      },
      handleScroll() {
        this.isNavHidden = window.scrollY > 100;
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
  