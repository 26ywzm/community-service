<template>
  <div id="app">
    <!-- 顶部导航栏（桌面和平板设备） -->
    <el-menu v-if="!isMobile" :default-active="activeIndex" :class="{ 'nav-hidden': isNavHidden }" mode="horizontal" background-color="#444"
      text-color="#fff" active-text-color="#1e90ff" class="top-menu">
      <div class="logo">社区服务</div>
      <div class="menu-right">
        <el-menu-item index="1">
          <router-link to="/">首页</router-link>
        </el-menu-item>
        <el-menu-item index="2">
          <router-link to="/discover">发现</router-link>
        </el-menu-item>
        <el-menu-item index="3">
          <router-link to="/profile">我的</router-link>
        </el-menu-item>
      </div>
    </el-menu>

    <!-- 路由视图，展示每个页面的内容 -->
    <div :class="{ 'content-padding': !isNavHidden && !isMobile }">
      <router-view />
    </div>

    <!-- 底部导航栏（手机设备） -->
    <van-tabbar v-if="isMobile" route>
      <van-tabbar-item replace to="/" icon="home-o">
        首页
      </van-tabbar-item>
      <van-tabbar-item replace to="/discover" icon="apps-o">
        发现
      </van-tabbar-item>
      <van-tabbar-item :to="profilePath" icon="user-o" @click="handleProfileClick">
        我的
      </van-tabbar-item>
    </van-tabbar>
  </div>
</template>

<script>
export default {
  data() {
    return {
      isMobile: false,
      isNavHidden: false,
      lastScrollTop: 0,
      activeIndex: '1',
    };
  },
  computed: {
    profilePath() {
      const token = localStorage.getItem('authToken');
      return token ? '/profile' : '/login';
    }
  },
  mounted() {
    this.checkDevice();
    window.addEventListener('resize', this.checkDevice);
    window.addEventListener('scroll', this.handleScroll);
  },
  methods: {
    checkDevice() {
      this.isMobile = window.innerWidth <= 768;
    },
    handleScroll() {
      const currentScrollTop = window.pageYOffset || document.documentElement.scrollTop;
      this.isNavHidden = currentScrollTop > this.lastScrollTop && currentScrollTop > 100;
      this.lastScrollTop = currentScrollTop;
    },
    handleProfileClick() {
      // 检查是否已登录
      const token = localStorage.getItem('authToken');
      if (!token) {
        // 如果未登录，跳转到登录页面
        this.$router.push('/login');
      }
    }
  }
};
</script>

<style scoped>
.top-menu {
  display: flex;
  /* 启用弹性布局 */
  align-items: center;
  /* 垂直居中 */
  justify-content: space-between;
  /* 左右分布 */
  padding: 0 20px;
  /* 增加一些左右内边距 */
}

.logo {
  font-size: 18px;
  color: white;
  font-weight: bold;
}

.menu-right {
  display: flex;
  /* 子项横向排列 */
  gap: 20px;
  /* 菜单项之间的间距 */
}

.menu-right a {
  color: white;
  text-decoration: none;
}

.menu-right a:hover {
  color: #1e90ff;
}

.el-menu {
  display: flex;
  align-items: center;
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  z-index: 1000;
  transition: top 0.3s;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.3);
}

.nav-hidden {
  top: -70px;
}

.content-padding {
  padding-top: 70px;
  padding-bottom: 60px;
}

.toggle-button {
  cursor: pointer;
  color: white;
}

.van-tabbar {
  position: fixed;
  bottom: 0;
  left: 0;
  width: 100%;
  z-index: 1000;
  box-shadow: 0 -2px 5px rgba(0, 0, 0, 0.1);
  background-color: #fff;
}

/* Tabbar图标大小自定义 */
.van-icon {
  margin-bottom: 4px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .van-icon {
    margin-bottom: 4px;
  }
}

.menu-right .router-link-active {
  color: #1e90ff !important;
}
</style>