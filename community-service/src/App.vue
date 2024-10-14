<template>
  <div id="app">
    <!-- 顶部导航栏（桌面和平板设备） -->
    <nav v-if="!isMobile" class="top-nav" :class="{ 'nav-hidden': isNavHidden }">
      <div class="logo">社区服务</div>
      <ul>
        <li><router-link to="/">首页</router-link></li>
        <li><router-link to="/discover">发现</router-link></li>
        <li><router-link to="/profile">我的</router-link></li>
      </ul>
      <div class="toggle-button" v-if="isNavHidden" @click="toggleNav">☰</div>
    </nav>

    <!-- 路由视图，展示每个页面的内容 -->
    <div :class="{ 'content-padding': !isNavHidden && !isMobile }">
      <router-view />
    </div>

    <!-- 底部导航栏（手机设备） -->
    <nav v-if="isMobile" class="bottom-nav">
      <ul>
        <li><router-link to="/">首页</router-link></li>
        <li><router-link to="/discover">发现</router-link></li>
        <li><router-link to="/profile">我的</router-link></li>
      </ul>
    </nav>
  </div>
</template>

<script>
export default {
  data() {
    return {
      isMobile: false,
      isNavHidden: false,
    };
  },
  mounted() {
    this.checkDevice();
    window.addEventListener('scroll', this.handleScroll);
    window.addEventListener('resize', this.checkDevice);
  },
  beforeUnmount() {
    window.removeEventListener('scroll', this.handleScroll);
    window.removeEventListener('resize', this.checkDevice);
  },
  methods: {
    checkDevice() {
      this.isMobile = window.innerWidth <= 768; // 768px 以下为手机端
    },
    handleScroll() {
      this.isNavHidden = window.scrollY > 100; // 当滚动超过100px时隐藏导航栏
    },
    toggleNav() {
      this.isNavHidden = !this.isNavHidden; // 点击按钮切换导航栏显示
    },
  },
};
</script>

<style scoped>
/* 顶部导航栏样式 */
.top-nav {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 20px;
  background-color: #333;
  color: white;
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  z-index: 1000;
  transition: top 0.3s;
}

.nav-hidden {
  top: -60px; /* 隐藏导航栏 */
}

.top-nav ul {
  display: flex;
  list-style: none;
}

.top-nav ul li a {
  color: white;
  text-decoration: none;
  margin-right: 20px;
}

.toggle-button {
  cursor: pointer;
  display: none;
}

/* 内容区域的样式 */
.content-padding {
  padding-top: 60px; /* 导航栏高度 */
}

/* 底部导航栏（手机设备） */
.bottom-nav {
  display: none;
  position: fixed;
  bottom: 0;
  left: 0;
  width: 100%;
  background-color: #333;
  color: white;
  z-index: 1000;
}

.bottom-nav ul {
  display: flex;
  justify-content: space-around;
  padding: 10px 0;
}

.bottom-nav ul li a {
  color: white;
  text-decoration: none;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .top-nav {
    display: none; /* 隐藏顶部导航栏 */
  }

  .toggle-button {
    display: block; /* 显示导航栏切换按钮 */
  }

  .bottom-nav {
    display: block; /* 显示底部导航栏 */
  }

  /* 移除内容区域的顶部边距 */
  .content-padding {
    padding-top: 0; /* 在手机端移除上边距 */
  }
}
</style>
