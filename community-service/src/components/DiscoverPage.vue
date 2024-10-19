<!-- DiscoverPage.vue -->
<template>
  <div class="discover">
    <h2>发现</h2>
    <div v-if="isAdmin || isSuperAdmin">
      <button @click="showAdminPanel = true">管理模块</button>
    </div>
    
    <div v-if="isSuperAdmin || isAdmin">
      <router-link to="/articles/new">
        <button>文章编写</button>
      </router-link>
    </div>

    <div v-if="showAdminPanel" class="admin-panel">
      <h3>管理员和用户列表</h3>
      <button @click="showAdminPanel = false">关闭</button>
      <div>
        <h4>管理员列表</h4>
        <ul>
          <li v-for="admin in admins" :key="admin.id">
            {{ admin.username }}
            <span v-if="isSuperAdmin"> <!-- 仅超级管理员可以降级 -->
              <button @click="demoteUser(admin.id)">降为用户</button>
            </span>
          </li>
        </ul>
      </div>
      <div>
        <h4>用户列表</h4>
        <ul>
          <li v-for="user in users" :key="user.id">
            {{ user.username }}
            <span v-if="isSuperAdmin"> <!-- 仅超级管理员可以升级 -->
              <button @click="promoteUser(user.id)">升为管理员</button>
            </span>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>


<script>
import axios from 'axios';

export default {
  data() {
    return {
      showAdminPanel: false,
      users: [],
      admins: [],
    };
  },
  computed: {
    // 计算属性，用于检查用户是否为管理员或超级管理员
    isAdmin() {
      const role = localStorage.getItem('userRole');
      return role === 'admin'; // 仅普通管理员
    },
    isSuperAdmin() {
      const role = localStorage.getItem('userRole');
      return role === 'super_admin'; // 仅超级管理员
    }
  },
  methods: {
    async fetchUsers() {
      const response = await axios.get('http://localhost:3000/api/auth/users');
      console.log('用户列表:', response.data); // 输出用户列表
      this.users = response.data;
    },
    async fetchAdmins() {
      const response = await axios.get('http://localhost:3000/api/auth/admins');
      this.admins = response.data;
    },
    async promoteUser(userId) {
      // 仅超级管理员可以执行升降级操作
      if (this.isSuperAdmin) {
        await axios.post(`http://localhost:3000/api/auth/promote/${userId}`);
        this.fetchUsers(); // 刷新用户列表
        this.fetchAdmins(); // 刷新管理员列表
      }
    },
    async demoteUser(adminId) {
      // 仅超级管理员可以执行升降级操作
      if (this.isSuperAdmin) {
        await axios.post(`http://localhost:3000/api/auth/demote/${adminId}`);
        this.fetchUsers(); // 刷新用户列表
        this.fetchAdmins(); // 刷新管理员列表
      }
    }
  },
  mounted() {
    if (this.isAdmin || this.isSuperAdmin) {
      this.fetchUsers();
      this.fetchAdmins();
    }
  }
};
</script>

<style scoped>
.admin-panel {
  border: 1px solid #ccc;
  padding: 10px;
  margin-top: 20px;
}
</style>
