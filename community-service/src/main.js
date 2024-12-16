import { createApp } from 'vue';  // 使用 Vue 3 的新导入方式
import App from './App.vue';
import router from './router'; // 确保导入 router
import { createPinia } from 'pinia'; // 导入 createPinia

// 按需引入 Vant 组件
import { Button, List, Tabbar, TabbarItem, Dialog, Form, Field, CellGroup } from 'vant';
import 'vant/lib/index.css';

// 按需引入 Element Plus 组件
import { ElMenu, ElMenuItem, ElButton, ElDialog, ElMessage } from 'element-plus';
import 'element-plus/dist/index.css';

const createMyApp = () => { 
  const app = createApp(App);
  const pinia = createPinia();
  app.use(router);
  // 注册 Vant 组件
  app.use(Button);
  app.use(List);
  app.use(Tabbar);
  app.use(TabbarItem);
  app.use(Dialog);
  // 注册 Element Plus 组件
  app.use(ElMenu);
  app.use(ElMenuItem);
  app.use(ElButton);
  app.use(ElDialog);
  app.use(ElMessage);
  // 注册其他组件
  app.use(Form);
  app.use(Field);
  app.use(CellGroup);
  app.use(pinia);
  return app;
};

const app = createMyApp();
app.mount('#app');
