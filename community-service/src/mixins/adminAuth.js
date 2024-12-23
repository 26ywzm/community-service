// adminAuth.js
export const adminAuth = {
  methods: {
    checkAdminAuth() {
      const userRole = localStorage.getItem('userRole');
      if (userRole !== 'admin' && userRole !== 'super_admin') {
        this.$router.push('/');
        return false;
      }
      return true;
    }
  },
  beforeMount() {
    // 组件挂载前检查权限
    this.checkAdminAuth();
  },
  beforeRouteEnter(to, from, next) {
    // 路由进入前检查权限
    const userRole = localStorage.getItem('userRole');
    if (userRole !== 'admin' && userRole !== 'super_admin') {
      next('/');
    } else {
      next();
    }
  }
};
