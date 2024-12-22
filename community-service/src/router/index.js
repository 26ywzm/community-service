import { createRouter, createWebHistory } from 'vue-router'; // 使用 Vue 3 的新导入方式
import CommunityHome from '@/components/CommunityHome.vue';
import UserLogin from '@/components/UserLogin.vue';
import UserRegister from '@/components/UserRegister.vue';
import UserDiscover from '@/components/DiscoverPage.vue';
import UserProfile from '@/components/Profile.vue';
import NewsDetail from '@/components/NewsDetail.vue'; // 导入新闻详情组件
import ArticleEditor from '@/components/ArticleEditor.vue'; // 导入文章编写组件
import CanteenOrder from '@/components/CanteenOrder.vue'; // 导入订餐组件
import CanteenAdmin from '@/components/CanteenAdmin.vue';
import OrderDetail from '@/components/OrderDetail.vue';
import OrderManagement from '@/components/OrderManagement.vue';
import SubmitFeedback from '@/components/SubmitFeedback.vue';
import ManageFeedback from '@/components/ManageFeedback.vue';

// 创建路由
const routes = [
  { path: '/', name: 'CommunityHome', component: CommunityHome },
  { path: '/login', name: 'UserLogin', component: UserLogin },
  { path: '/register', name: 'UserRegister', component: UserRegister },
  { path: '/profile', name: 'Profile', component: UserProfile },
  { path: '/discover', name: 'Discover', component: UserDiscover },
  { path: '/news/:id', name: 'NewsDetail', component: NewsDetail }, // 添加新闻详情的路由
  { path: '/articles/new', name: 'ArticleEditor', component: ArticleEditor }, // 添加文章编写的路由
  { path: '/canteenorder', name: 'CanteenOrder', component: CanteenOrder },
  { path: '/canteenadmin', name: 'CanteenAdmin', component: CanteenAdmin },
  { path: '/order/:orderId',name: 'OrderDetail',component: OrderDetail,},
  { path: '/canteen/orders', name: 'OrderManagement', component: OrderManagement },
  { path: '/feedback', name: 'SubmitFeedback', component: SubmitFeedback},
  { path: '/managefeedback', name: 'ManageeFedback', component: ManageFeedback},
];

// 创建 router 实例
const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
