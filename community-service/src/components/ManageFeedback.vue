<template>
  <div class="chat-container">
    <div class="user-list">
      <h3>用户列表</h3>
      <ul>
        <!-- 显示所有用户，管理员可以点击查看与他们的对话 -->
        <li v-for="user in users" :key="user.id" @click="selectUser(user)"
            :class="{ active: selectedUser && selectedUser.id === user.id }">
          {{ user.username }}
        </li>
      </ul>
    </div>

    <div class="chat-box">
      <!-- 如果选定了用户，显示与该用户的对话，否则显示所有用户的聊天记录 -->
      <h3>{{ selectedUser ? `与 ${selectedUser.username} 的对话` : '所有用户聊天记录' }}</h3>
      <div class="messages">
        <div v-for="message in chatMessages" :key="message.id" 
             :class="['message', message.isAdmin ? 'admin' : 'user']"
             @click="selectMessage(message)">
          <div class="message-content">{{ message.message }}</div>
          <div class="message-reply" v-if="message.admin_reply">
            <strong>管理员回复：</strong> {{ message.admin_reply }}
          </div>
          <div class="timestamp">{{ formatTimestamp(message.created_at) }}</div>
        </div>
      </div>

      <!-- 管理员回复区域 -->
      <div class="reply-area">
        <div v-if="selectedMessage" class="selected-message">
          正在回复: {{ selectedMessage.message }}
          <button @click="cancelReply" class="cancel-btn small">取消回复</button>
        </div>
        <div class="input-area">
          <textarea v-model="adminReply" 
                    :placeholder="selectedMessage ? '输入回复...' : (selectedUser ? '发送新消息给该用户...' : '请先选择一个用户')" 
                    rows="3"
                    :disabled="!selectedUser && !selectedMessage"></textarea>
          <div class="button-group">
            <button @click="sendMessage" 
                    :disabled="isSending || !adminReply.trim() || (!selectedUser && !selectedMessage)">
              {{ isSending ? '发送中...' : '发送' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 提示消息 -->
    <div v-if="message.show" :class="['message-toast', message.type]">
      {{ message.content }}
    </div>
  </div>
</template>

<script>
import axios from 'axios';
const BASE_URL = process.env.VUE_APP_BASE_URL;

export default {
  data() {
    return {
      users: [],  // 用户列表
      selectedUser: null,  // 当前选择的用户
      selectedMessage: null, // 当前选择要回复的消息
      chatMessages: [],  // 当前用户的聊天记录
      adminReply: '',  // 管理员输入的回复内容
      message: {
        show: false,
        content: '',
        type: 'success'
      },
      isSending: false  // 防止重复发送
    };
  },

  mounted() {
    this.fetchUsers();  // 获取用户列表
    this.fetchChatMessages(); // 获取所有聊天记录
  },

  methods: {
    // 显示提示消息
    showMessage(content, type) {
      this.message = {
        content,
        type,
        show: true
      };

      setTimeout(() => {
        this.message.show = false;
      }, 3000);
    },

    // 获取用户列表
    async fetchUsers() {
      try {
        const response = await axios.get(`${BASE_URL}/api/canteen/users`);
        this.users = response.data;
      } catch (error) {
        console.error('获取用户列表失败:', error);
        this.showMessage('获取用户列表失败，请稍后重试', 'error');
      }
    },

    // 选择与某个用户对话
    async selectUser(user) {
      this.selectedUser = this.selectedUser?.id === user.id ? null : user;
      this.selectedMessage = null; // 清除选中的消息
      this.adminReply = ''; // 清空回复框
      this.fetchChatMessages(this.selectedUser?.id);
    },

    // 选择要回复的消息
    selectMessage(message) {
      if (message.admin_reply) {
        this.showMessage('该消息已经回复过了', 'info');
        return;
      }
      this.selectedMessage = message;
      this.adminReply = ''; // 清空回复框
    },

    // 取消回复
    cancelReply() {
      this.selectedMessage = null;
      this.adminReply = '';
    },

    // 发送消息（包括回复和新消息）
    async sendMessage() {
      if (this.isSending || !this.adminReply.trim()) return;
      if (!this.selectedUser && !this.selectedMessage) {
        this.showMessage('请先选择用户或要回复的消息', 'error');
        return;
      }

      this.isSending = true;

      try {
        if (this.selectedMessage) {
          // 回复已有消息
          await axios.put(`${BASE_URL}/api/canteen/feedback/${this.selectedMessage.id}/reply`, {
            admin_reply: this.adminReply.trim()
          });
        } else {
          // 发送新消息，使用与用户提交留言相同的接口
          await axios.post(`${BASE_URL}/api/canteen/feedback`, {
            user_id: this.selectedUser.id,
            message: this.adminReply.trim()
          });
        }

        this.showMessage('发送成功', 'success');
        this.adminReply = '';  // 清空输入框
        this.selectedMessage = null; // 清除选中的消息
        await this.fetchChatMessages(this.selectedUser?.id);  // 重新获取聊天记录
      } catch (error) {
        console.error('发送失败:', error);
        this.showMessage('发送失败，请稍后重试', 'error');
      } finally {
        this.isSending = false;
      }
    },

    // 获取聊天记录
    async fetchChatMessages(userId = null) {
      try {
        let response;
        if (userId) {
          // 如果选择了特定用户，获取该用户的消息
          response = await axios.get(`${BASE_URL}/api/canteen/feedbacks?user_id=${userId}`);
          this.chatMessages = response.data.feedbacks || [];
        } else {
          // 否则获取所有消息
          response = await axios.get(`${BASE_URL}/api/canteen/feedback`);
          this.chatMessages = response.data || [];
        }

        // 处理消息，标记是否为管理员消息
        this.chatMessages = this.chatMessages.map(msg => ({
          ...msg,
          isAdmin: msg.admin_reply !== null
        }));
      } catch (error) {
        console.error('获取聊天记录失败:', error);
        this.showMessage('获取聊天记录失败，请稍后重试', 'error');
      }
    },

    // 格式化时间戳
    formatTimestamp(timestamp) {
      const date = new Date(timestamp);
      return `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
    }
  }
};
</script>

<style scoped>
.chat-container {
  display: flex;
  justify-content: space-between;
  padding: 20px;
  height: calc(100vh - 100px);
}

.user-list {
  width: 25%;
  border-right: 1px solid #ddd;
  padding-right: 20px;
}

.user-list ul {
  list-style-type: none;
  padding: 0;
}

.user-list li {
  padding: 10px;
  cursor: pointer;
  border-bottom: 1px solid #eee;
  transition: all 0.3s ease;
}

.user-list li:hover {
  background-color: #f5f5f5;
}

.user-list li.active {
  background-color: #e3f2fd;
  border-radius: 4px;
}

.chat-box {
  width: 70%;
  display: flex;
  flex-direction: column;
  padding-left: 20px;
}

.messages {
  flex: 1;
  overflow-y: auto;
  margin-bottom: 20px;
  padding: 10px;
}

.message {
  padding: 15px;
  border-radius: 8px;
  margin-bottom: 15px;
  max-width: 80%;
  cursor: pointer;
  transition: all 0.3s ease;
}

.message:hover {
  transform: translateX(5px);
}

.message.admin {
  background-color: #e3f2fd;
  margin-left: auto;
}

.message.user {
  background-color: #f5f5f5;
  margin-right: auto;
}

.message-content {
  font-size: 14px;
  margin-bottom: 5px;
}

.message-reply {
  font-size: 14px;
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid #ddd;
}

.timestamp {
  font-size: 12px;
  color: #888;
  margin-top: 5px;
}

.reply-area {
  background-color: #f8f9fa;
  padding: 15px;
  border-radius: 8px;
  margin-top: 10px;
}

.selected-message {
  font-size: 14px;
  color: #666;
  margin-bottom: 10px;
  padding: 8px;
  background-color: #fff;
  border-radius: 4px;
}

.input-area {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

textarea {
  width: 100%;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  margin-bottom: 10px;
  resize: vertical;
  font-size: 14px;
}

.button-group {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

button {
  padding: 8px 16px;
  background-color: #4CAF50;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-right: 10px;
}

button:hover:not(:disabled) {
  background-color: #45a049;
  transform: translateY(-1px);
}

button:disabled {
  background-color: #cccccc;
  cursor: not-allowed;
}

.cancel-btn {
  background-color: #f44336;
}

.cancel-btn:hover {
  background-color: #d32f2f;
}

.cancel-btn.small {
  padding: 4px 8px;
  font-size: 12px;
  margin-left: 10px;
}

.message-toast {
  position: fixed;
  top: 20px;
  right: 20px;
  padding: 12px 24px;
  border-radius: 4px;
  color: white;
  animation: slideIn 0.3s ease-out;
  z-index: 1000;
  box-shadow: 0 2px 5px rgba(0,0,0,0.2);
}

.message-toast.success {
  background-color: #4CAF50;
}

.message-toast.error {
  background-color: #f44336;
}

.message-toast.info {
  background-color: #2196F3;
}

@keyframes slideIn {
  from {
    transform: translateX(100%);
    opacity: 0;
  }

  to {
    transform: translateX(0);
    opacity: 1;
  }
}
</style>
