import { createRouter, createWebHistory } from 'vue-router'; // 使用 Vue 3 的新导入方式
import CommunityHome from '@/components/CommunityHome.vue';
import UserLogin from '@/components/UserLogin.vue';
import UserRegister from '@/components/UserRegister.vue';
import UserDiscover from '@/components/DiscoverPage.vue';
import UserProfile from '@/components/Profile.vue';
import NewsDetail from '@/components/NewsDetail.vue'; // 导入新闻详情组件
import ArticleEditor from '@/components/ArticleEditor.vue'; // 导入文章编写组件
import CanteenPage from '@/components/CanteenPage.vue'; // 导入订餐组件

// 创建路由
const routes = [
  { path: '/', name: 'CommunityHome', component: CommunityHome },
  { path: '/login', name: 'UserLogin', component: UserLogin },
  { path: '/register', name: 'UserRegister', component: UserRegister },
  { path: '/profile', name: 'Profile', component: UserProfile},
  { path: '/Discover', name: 'Discover', component: UserDiscover},
  { path: '/news/:id', name: 'NewsDetail', component: NewsDetail }, // 添加新闻详情的路由
  { path: '/articles/new', name: 'ArticleEditor', component: ArticleEditor }, // 添加文章编写的路由
  { path: '/canteen', name: 'CanteenPage', component: CanteenPage }, // 订餐路由
];

// 创建 router 实例
const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
