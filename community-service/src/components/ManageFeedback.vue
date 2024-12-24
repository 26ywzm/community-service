<template>
  <div class="chat-container">
    <!-- 用户列表 -->
    <div class="user-list">
      <h3>用户列表</h3>
      <div v-if="loading" class="loading">加载中...</div>
      <div v-else-if="users.length === 0" class="no-users">暂无用户数据</div>
      <ul v-else>
        <li v-for="user in users" 
            :key="user.id" 
            @click="selectUser(user)"
            :class="{ active: selectedUser && selectedUser.id === user.id }">
          <span class="username">{{ user.username || user.email || '未命名用户' }}</span>
          <span class="message-count" v-if="user.messageCount">{{ user.messageCount }}</span>
        </li>
      </ul>
    </div>

    <!-- 留言记录 -->
    <div class="chat-box">
      <div v-if="!selectedUser" class="no-selection">请选择一个用户查看留言记录</div>
      <template v-else>
        <h3>与 {{ selectedUser.username || selectedUser.email || '未命名用户' }} 的留言记录</h3>
        <div class="messages">
          <div v-if="loading" class="loading">加载中...</div>
          <div v-else-if="chatMessages.length === 0" class="no-messages">暂无留言记录</div>
          <template v-else>
            <div v-for="message in chatMessages" 
                 :key="message.id" 
                 :class="['message', message.isAdmin ? 'admin' : 'user']">
              <div class="message-header">
                <span class="username">{{ message.username }}</span>
                <div class="message-actions">
                  <button class="action-btn delete" @click="deleteMessage(message)">删除</button>
                  <button v-if="!message.admin_reply" 
                          class="action-btn reply" 
                          @click="selectMessage(message)">回复</button>
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

const API_BASE = process.env.VUE_APP_BASE_URL;

export default {
  data() {
    return {
      users: [],
      selectedUser: null,
      chatMessages: [],
      selectedMessage: null,
      adminReply: '',
      loading: false,
      message: { show: false, content: '', type: '' }
    };
  },
  methods: {
    async fetchUsers() {
      try {
        const token = localStorage.getItem('authToken');
        const userRole = localStorage.getItem('userRole');
        
        if (userRole !== 'admin' && userRole !== 'super_admin') {
          this.$router.push('/');
          return;
        }

        const headers = { 'Authorization': `Bearer ${token}` };
        const response = await axios.get(`${API_BASE}/api/canteen/users`, { headers });
        this.users = response.data || [];
      } catch (error) {
        console.error('获取用户列表失败:', error);
        alert('获取用户列表失败：' + (error.response?.data?.message || error.message));
      }
    },
    selectUser(user) {
      this.selectedUser = user;
      this.selectedMessage = null;
      this.adminReply = '';
      if (user) {
        this.fetchUserMessages(user.id);
      } else {
        this.chatMessages = [];
      }
    },
    async fetchUserMessages(userId) {
      try {
        const token = localStorage.getItem('authToken');
        const userRole = localStorage.getItem('userRole');
        
        if (userRole !== 'admin' && userRole !== 'super_admin') {
          this.$router.push('/');
          return;
        }

        const headers = { 'Authorization': `Bearer ${token}` };
        const response = await axios.get(`${API_BASE}/api/canteen/feedback/${userId}`, { headers });
        this.chatMessages = response.data.map(msg => ({
          ...msg,
          isAdmin: msg.admin_reply !== null
        }));
      } catch (error) {
        console.error('获取留言记录失败:', error);
        alert('获取留言记录失败：' + (error.response?.data?.message || error.message));
      }
    },
    selectMessage(message) {
      this.selectedMessage = message;
      this.adminReply = '';
    },
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
        
        if (userRole !== 'admin' && userRole !== 'super_admin') {
          this.$router.push('/');
          return;
        }

        const headers = { 'Authorization': `Bearer ${token}` };
        
        if (this.selectedMessage) {
          const response = await axios.put(
            `${API_BASE}/api/canteen/feedback/${this.selectedMessage.id}/reply`, 
            { admin_reply: this.adminReply },
            { headers }
          );

          if (response.data.message === '回复成功') {
            alert('回复成功');
            await this.fetchUserMessages(this.selectedUser.id);
            this.adminReply = '';
            this.selectedMessage = null;
          } else {
            throw new Error(response.data.message || '回复失败');
          }
        } else if (this.selectedUser) {
          const response = await axios.post(
            `${API_BASE}/api/canteen/feedback/admin-message`,
            {
              user_id: this.selectedUser.id,
              message: this.adminReply
            },
            { headers }
          );

          if (response.data.message) {
            alert(response.data.message);
            await this.fetchUserMessages(this.selectedUser.id);
            this.adminReply = '';
          } else {
            throw new Error('发送失败');
          }
        }
      } catch (error) {
        console.error('发送消息失败:', error);
        alert('发送消息失败：' + (error.response?.data?.message || error.message));
      }
    },
    cancelReply() {
      this.selectedMessage = null;
      this.adminReply = '';
    },
    async deleteMessage(message) {
      if (!confirm('确定要删除这条留言吗？')) return;

      try {
        const token = localStorage.getItem('authToken');
        const userRole = localStorage.getItem('userRole');
        
        if (userRole !== 'admin' && userRole !== 'super_admin') {
          this.$router.push('/');
          return;
        }

        const headers = { 'Authorization': `Bearer ${token}` };
        await axios.delete(`${API_BASE}/api/canteen/feedback/${message.id}`, { headers });
        alert('留言已删除');
        await this.fetchUserMessages(this.selectedUser.id);
      } catch (error) {
        alert('删除留言失败：' + (error.response?.data?.message || error.message));
      }
    },
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
    const userRole = localStorage.getItem('userRole');
    if (userRole !== 'admin' && userRole !== 'super_admin') {
      this.$router.push('/');
      return;
    }

    this.fetchUsers();
  }
};
</script>

<style scoped>
/* 页面布局 */
.chat-container {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
}

.user-list {
  width: 100%;
  max-width: 280px;
  background-color: #fafafa;
  padding: 20px;
  border-radius: 10px;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
}

.chat-box {
  flex-grow: 1;
  padding: 20px;
  background-color: #fff;
  border-radius: 10px;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
}

h3 {
  margin-bottom: 10px;
  font-size: 18px;
  color: #333;
}

ul {
  list-style-type: none;
  padding: 0;
  margin: 0;
}

li {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px;
  border-bottom: 1px solid #ddd;
  cursor: pointer;
  transition: background-color 0.3s;
}

li:hover {
  background-color: #f1f1f1;
}

li.active {
  background-color: #e3f2fd;
}

.username {
  font-weight: bold;
}

.message-count {
  background-color: #2196F3;
  color: white;
  border-radius: 50%;
  padding: 5px 10px;
  font-size: 12px;
}

.message {
  padding: 15px;
  border-radius: 8px;
  margin-bottom: 10px;
  background-color: #f5f5f5;
}

.message.admin {
  background-color: #e3f2fd;
}

.message-header {
  display: flex;
  justify-content: space-between;
  font-weight: bold;
}

.timestamp {
  font-size: 12px;
  color: #999;
  text-align: right;
}

.reply-area {
  margin-top: 20px;
}

.input-area {
  display: flex;
  gap: 15px;
  margin-top: 10px;
}

textarea {
  flex-grow: 1;
  padding: 10px;
  border-radius: 8px;
  border: 1px solid #ddd;
  resize: none;
}

.send-btn {
  padding: 10px 20px;
  background-color: #1976d2;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.send-btn:hover {
  background-color: #1565c0;
}

.cancel-btn {
  padding: 5px 10px;
  background-color: #ef5350;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.cancel-btn:hover {
  background-color: #e53935;
}

.action-btn {
  padding: 5px 10px;
  font-size: 12px;
  cursor: pointer;
}

.action-btn.delete {
  background-color: #ef5350;
  color: white;
}

.action-btn.reply {
  background-color: #66bb6a;
  color: white;
}

@media (max-width: 767px) {
  .chat-container {
    flex-direction: column;
  }

  .user-list {
    margin-bottom: 20px;
  }
}
</style>
