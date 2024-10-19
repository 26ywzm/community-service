import { createRouter, createWebHistory } from 'vue-router'; // 使用 Vue 3 的新导入方式
import CommunityHome from '@/components/CommunityHome.vue';
import UserLogin from '@/components/UserLogin.vue';
import UserRegister from '@/components/UserRegister.vue';
import UserDiscover from '@/components/DiscoverPage.vue';
import UserProfile from '@/components/Profile.vue';
import NewsDetail from '@/components/NewsDetail.vue'; // 导入新闻详情组件

// 创建路由
const routes = [
  { path: '/', name: 'CommunityHome', component: CommunityHome },
  { path: '/login', name: 'UserLogin', component: UserLogin },
  { path: '/register', name: 'UserRegister', component: UserRegister },
  { path: '/profile', name: 'Profile', component: UserProfile},
  { path: '/Discover', name: 'Discover', component: UserDiscover},
  { path: '/news/:id', name: 'NewsDetail', component: NewsDetail }, // 添加新闻详情的路由
];

// 创建 router 实例
const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
