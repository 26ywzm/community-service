<template>
  <div class="chat-container">
    <!-- 用户列表 -->
    <div class="user-list">
      <h3>用户列表</h3>
      <div v-if="loading" class="loading">
        加载中...
      </div>
      <div v-else-if="users.length === 0" class="no-users">
        暂无用户数据
      </div>
      <ul v-else>
        <li v-for="user in users" 
            :key="user.id" 
            @click="selectUser(user)"
            :class="{ active: selectedUser && selectedUser.id === user.id }">
          <span class="username">{{ user.username || user.email || '未命名用户' }}</span>
          <span class="message-count" v-if="user.messageCount">
            {{ user.messageCount }}
          </span>
        </li>
      </ul>
    </div>

    <!-- 留言记录 -->
    <div class="chat-box">
      <div v-if="!selectedUser" class="no-selection">
        请选择一个用户查看留言记录
      </div>
      <template v-else>
        <h3>与 {{ selectedUser.username || selectedUser.email || '未命名用户' }} 的留言记录</h3>
        <div class="messages">
          <div v-if="loading" class="loading">
            加载中...
          </div>
          <div v-else-if="chatMessages.length === 0" class="no-messages">
            暂无留言记录
          </div>
          <template v-else>
            <div v-for="message in chatMessages" 
                 :key="message.id" 
                 :class="['message', message.isAdmin ? 'admin' : 'user']">
              <div class="message-header">
                <span class="username">{{ message.username }}</span>
                <div class="message-actions">
                  <button class="action-btn delete" @click="deleteMessage(message)">
                    删除
                  </button>
                  <button v-if="!message.admin_reply" 
                          class="action-btn reply" 
                          @click="selectMessage(message)">
                    回复
                  </button>
                </div>
              </div>
              <div class="message-content">{{ message.message }}</div>
              <div class="message-reply" v-if="message.admin_reply">
                <strong>管理员回复：</strong> {{ message.admin_reply }}
              </div>
              <div class="timestamp">{{ formatTimestamp(message.created_at) }}</div>
            </div>
          </template>
        </div>

        <!-- 管理员回复区域 -->
        <div class="reply-area">
          <div v-if="selectedMessage" class="selected-message">
            正在回复: {{ selectedMessage.message }}
            <button @click="cancelReply" class="cancel-btn">取消回复</button>
          </div>
          <div class="input-area">
            <textarea v-model="adminReply" 
                      :placeholder="selectedMessage ? '输入回复...' : '发送新消息给该用户...'" 
                      rows="3"></textarea>
            <button @click="sendMessage" 
                    class="send-btn" 
                    :disabled="loading || !adminReply.trim()">
              {{ selectedMessage ? '发送回复' : '发送消息' }}
            </button>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>


<script>
import axios from 'axios';

// 配置API基础URL
const API_BASE = process.env.VUE_APP_BASE_URL;

export default {
  data() {
    return {
      users: [],           // 用户列表
      selectedUser: null,  // 当前选中的用户
      chatMessages: [],    // 当前用户的留言列表
      selectedMessage: null, // 当前选中要回复的留言
      adminReply: '',      // 管理员回复内容
      loading: false,      // 加载状态
      message: { show: false, content: '', type: '' }  // 消息提示
    };
  },
  methods: {
    // 获取用户列表
    async fetchUsers() {
      try {
        const token = localStorage.getItem('authToken');
        const userRole = localStorage.getItem('userRole');
        
        // 验证管理员权限
        if (userRole !== 'admin' && userRole !== 'super_admin') {
          this.$router.push('/');
          return;
        }

        const headers = { 'Authorization': `Bearer ${token}` };
        console.log('正在获取用户列表...');
        const response = await axios.get(`${API_BASE}/api/canteen/users`, { headers });
        console.log('获取到的用户列表:', response.data);
        this.users = response.data || [];
      } catch (error) {
        console.error('获取用户列表失败:', error);
        alert('获取用户列表失败：' + (error.response?.data?.message || error.message));
      }
    },

    // 选择用户，查看留言记录
    selectUser(user) {
      console.log('选择用户:', user);
      this.selectedUser = user;
      this.selectedMessage = null;  // 清空选中的消息
      this.adminReply = '';        // 清空回复框
      if (user) {
        this.fetchUserMessages(user.id);
      } else {
        this.chatMessages = [];
      }
    },

    // 获取用户留言记录
    async fetchUserMessages(userId) {
      if (!userId) {
        console.log('未选择用户');
        return;
      }

      try {
        const token = localStorage.getItem('authToken');
        const userRole = localStorage.getItem('userRole');
        
        // 验证管理员权限
        if (userRole !== 'admin' && userRole !== 'super_admin') {
          this.$router.push('/');
          return;
        }

        const headers = { 'Authorization': `Bearer ${token}` };
        console.log('正在获取用户留言:', userId);
        const response = await axios.get(`${API_BASE}/api/canteen/feedback/${userId}`, { headers });
        console.log('获取到的留言:', response.data);
        this.chatMessages = response.data.map(msg => ({
          ...msg,
          isAdmin: msg.admin_reply !== null
        }));
      } catch (error) {
        console.error('获取留言记录失败:', error);
        alert('获取留言记录失败：' + (error.response?.data?.message || error.message));
      }
    },

    // 选择要回复的留言
    selectMessage(message) {
      this.selectedMessage = message;
      this.adminReply = '';  // 清空回复内容
    },

    // 发送消息
    async sendMessage() {
      if (!this.adminReply.trim()) {
        alert('请输入回复内容');
        return;
      }

      if (!this.selectedUser && !this.selectedMessage) {
        alert('请选择一个用户或留言进行回复');
        return;
      }

      try {
        const token = localStorage.getItem('authToken');
        const userRole = localStorage.getItem('userRole');
        
        // 验证管理员权限
        if (userRole !== 'admin' && userRole !== 'super_admin') {
          this.$router.push('/');
          return;
        }

        const headers = { 'Authorization': `Bearer ${token}` };
        
        if (this.selectedMessage) {
          // 回复特定留言
          if (!this.selectedMessage.id) {
            alert('无效的留言ID');
            return;
          }

          console.log('正在回复留言:', {
            id: this.selectedMessage.id,
            content: this.adminReply
          });

          const response = await axios.put(
            `${API_BASE}/api/canteen/feedback/${this.selectedMessage.id}/reply`, 
            { admin_reply: this.adminReply },
            { headers }
          );

          console.log('回复响应:', response.data);

          if (response.data.message === '回复成功') {
            alert('回复成功');
            // 刷新消息列表
            if (this.selectedUser) {
              await this.fetchUserMessages(this.selectedUser.id);
            }
            this.adminReply = '';
            this.selectedMessage = null;
          } else {
            throw new Error(response.data.message || '回复失败');
          }
        } else if (this.selectedUser) {
          // 发送新消息
          if (!this.selectedUser.id) {
            alert('无效的用户ID');
            return;
          }

          console.log('正在发送新消息:', {
            user_id: this.selectedUser.id,
            message: this.adminReply
          });

          const response = await axios.post(
            `${API_BASE}/api/canteen/feedback/admin-message`,
            {
              user_id: this.selectedUser.id,
              message: this.adminReply
            },
            { headers }
          );

          console.log('发送响应:', response.data);

          if (response.data.message) {
            alert(response.data.message);
            // 刷新消息列表
            await this.fetchUserMessages(this.selectedUser.id);
            this.adminReply = '';
          } else {
            throw new Error('发送失败');
          }
        }
      } catch (error) {
        console.error('发送消息失败:', error);
        const errorMessage = error.response?.data?.message || error.message;
        console.error('错误详情:', errorMessage);
        alert('发送消息失败：' + errorMessage);
      }
    },

    // 取消回复
    cancelReply() {
      this.selectedMessage = null;
      this.adminReply = '';
    },

    // 删除留言
    async deleteMessage(message) {
      if (!confirm('确定要删除这条留言吗？')) return;

      try {
        const token = localStorage.getItem('authToken');
        const userRole = localStorage.getItem('userRole');
        
        // 验证管理员权限
        if (userRole !== 'admin' && userRole !== 'super_admin') {
          this.$router.push('/');
          return;
        }

        const headers = { 'Authorization': `Bearer ${token}` };
        console.log('正在删除留言:', message.id);
        await axios.delete(`${API_BASE}/api/canteen/feedback/${message.id}`, { headers });
        alert('留言已删除');
        await this.fetchUserMessages(this.selectedUser.id);
      } catch (error) {
        console.error('删除留言失败:', error);
        alert('删除留言失败：' + (error.response?.data?.message || error.message));
      }
    },

    // 删除整个用户的对话
    async deleteUserConversation() {
      if (!confirm('确定要删除与该用户的所有留言吗？')) {
        return;
      }

      try {
        const token = localStorage.getItem('authToken');
        const userRole = localStorage.getItem('userRole');
        
        // 验证管理员权限
        if (userRole !== 'admin' && userRole !== 'super_admin') {
          this.$router.push('/');
          return;
        }

        const headers = { 'Authorization': `Bearer ${token}` };
        await axios.delete(`${API_BASE}/api/canteen/feedback`, {
          data: { user_id: this.selectedUser.id },
          headers
        });

        alert('该用户的留言已删除');
        this.selectedUser = null;  // 清空选中的用户
        this.chatMessages = [];  // 清空聊天记录
      } catch (error) {
        alert('删除留言失败：' + (error.response?.data?.message || error.message));
      }
    },

    // 显示消息提示
    showMessage(content, type) {
      this.message.content = content;
      this.message.type = type;
      this.message.show = true;

      setTimeout(() => {
        this.message.show = false;
      }, 3000);
    },

    // 格式化时间戳
    formatTimestamp(timestamp) {
      if (!timestamp) return '';
      const date = new Date(timestamp);
      return date.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  },

  async mounted() {
    // 检查用户角色
    const userRole = localStorage.getItem('userRole');
    if (userRole !== 'admin' && userRole !== 'super_admin') {
      this.$router.push('/');
      return;
    }

    // 获取用户列表
    this.loading = true;
    try {
      await this.fetchUsers();
    } catch (error) {
      console.error('初始化失败:', error);
    } finally {
      this.loading = false;
    }
  }
};
</script>

<style scoped>
.chat-container {
  display: flex;
  height: 100%;
  padding: 20px;
  gap: 20px;
}

.user-list {
  width: 250px;
  border-right: 1px solid #ddd;
  padding-right: 20px;
}

.user-list h3 {
  margin-bottom: 15px;
  color: #333;
}

.user-list ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.user-list li {
  padding: 10px;
  margin-bottom: 5px;
  cursor: pointer;
  border-radius: 4px;
  transition: background-color 0.2s;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.user-list li:hover {
  background-color: #f5f5f5;
}

.user-list li.active {
  background-color: #e3f2fd;
  color: #1976d2;
}

.message-count {
  font-size: 12px;
  color: #666;
}

.no-users {
  text-align: center;
  color: #666;
  padding: 20px;
  background-color: #f5f5f5;
  border-radius: 4px;
}

.chat-box {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.no-selection {
  text-align: center;
  color: #666;
  padding: 20px;
  background-color: #f5f5f5;
  border-radius: 4px;
  margin-top: 20px;
}

.messages {
  flex: 1;
  overflow-y: auto;
  padding: 10px;
}

.message {
  margin-bottom: 15px;
  padding: 10px;
  border-radius: 4px;
  background-color: #f5f5f5;
}

.message.admin {
  background-color: #e3f2fd;
}

.message-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 5px;
}

.username {
  font-weight: bold;
  color: #333;
}

.message-content {
  margin: 10px 0;
}

.message-reply {
  margin-top: 10px;
  padding: 10px;
  background-color: #fff;
  border-radius: 4px;
}

.timestamp {
  font-size: 12px;
  color: #666;
  text-align: right;
}

.reply-area {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #ddd;
}

.input-area {
  display: flex;
  gap: 10px;
}

textarea {
  flex: 1;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  resize: vertical;
}

.action-btn {
  padding: 5px 10px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  transition: background-color 0.2s;
}

.action-btn.delete {
  background-color: #ef5350;
  color: white;
}

.action-btn.reply {
  background-color: #66bb6a;
  color: white;
}

.action-btn:hover {
  opacity: 0.9;
}

.selected-message {
  margin-bottom: 10px;
  padding: 10px;
  background-color: #f5f5f5;
  border-radius: 4px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.cancel-btn {
  padding: 5px 10px;
  background-color: #9e9e9e;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.send-btn {
  padding: 10px 20px;
  background-color: #1976d2;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.send-btn:hover {
  background-color: #1565c0;
}

.no-messages {
  text-align: center;
  color: #666;
  padding: 20px;
  background-color: #f5f5f5;
  border-radius: 4px;
}

.loading {
  text-align: center;
  color: #666;
  padding: 20px;
  background-color: #f5f5f5;
  border-radius: 4px;
}
</style>
