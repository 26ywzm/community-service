import { createApp } from 'vue';  // 使用 Vue 3 的新导入方式
import App from './App.vue';
import router from './router'; // 确保导入 router
import Vant from 'vant';
import 'vant/lib/index.css';
import ElementPlus from 'element-plus';
import 'element-plus/dist/index.css';

const app = createApp(App);
app.use(router);
app.use(Vant);
app.use(ElementPlus);
app.mount('#app');
