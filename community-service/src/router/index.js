import { createRouter, createWebHistory } from 'vue-router'; // 使用 Vue 3 的新导入方式
import CommunityHome from '@/components/CommunityHome.vue';
import UserLogin from '@/components/UserLogin.vue';
import UserRegister from '@/components/UserRegister.vue';
import UserDiscover from '@/components/DiscoverPage.vue';
import UserProfile from '@/components/Profile.vue';
import NewsDetail from '@/components/NewsDetail.vue'; // 导入新闻详情组件
import ArticleEditor from '@/components/ArticleEditor.vue'; // 导入文章编写组件
import CanteenOrder from '@/components/CanteenOrder.vue'; // 导入订餐组件
import CanteenAdmin from '@/components/CanteenAdmin.vue'; // 餐厅管理
import OrderManagement from '@/components/OrderManagement.vue';// 订单

// 创建路由
const routes = [
  { path: '/', name: 'CommunityHome', component: CommunityHome },
  { path: '/login', name: 'UserLogin', component: UserLogin },
  { path: '/register', name: 'UserRegister', component: UserRegister },
  { path: '/profile', name: 'Profile', component: UserProfile },
  { path: '/discover', name: 'Discover', component: UserDiscover },
  { path: '/news/:id', name: 'NewsDetail', component: NewsDetail }, // 添加新闻详情的路由
  { path: '/articles/new', name: 'ArticleEditor', component: ArticleEditor }, // 添加文章编写的路由
  { path: '/canteenorder', name: 'CanteenOrder', component: CanteenOrder }, // 订餐路由
  { path: '/canteenadmin', name: 'CanteenAdmin', component: CanteenAdmin }, //餐厅管理
  { path: '/canteen/orders', name: 'OrderManagement', component: OrderManagement }//订单
];

// 创建 router 实例
const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
