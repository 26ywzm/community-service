<template>
  <div class="submit-feedback">
    <h2>提交您的建议或留言</h2>

    <!-- 显示历史留言 -->
    <div class="feedback-history" v-if="feedbacks.length > 0">
      <h3>我的留言历史</h3>
      <div v-for="feedback in feedbacks" :key="feedback.id" class="feedback-item">
        <div class="feedback-header">
          <span class="feedback-time">{{ formatTime(feedback.created_at) }}</span>
          <button class="delete-btn" @click="deleteFeedback(feedback)">删除</button>
        </div>
        <div class="feedback-content">
          <p><strong>留言：</strong>{{ feedback.message }}</p>
          <p v-if="feedback.admin_reply" class="admin-reply">
            <strong>管理员回复：</strong>{{ feedback.admin_reply }}
          </p>
        </div>
      </div>
    </div>

    <!-- 留言输入框 -->
    <textarea v-model="feedbackMessage" placeholder="请填写您的留言" rows="4" required></textarea>

    <!-- 提交按钮 -->
    <button @click="submitFeedback">提交留言</button>

    <!-- 提交后提示 -->
    <div v-if="feedbackSubmitted" class="submit-success">
      <p>留言提交成功！</p>
    </div>
  </div>
</template>

<script>
import axios from 'axios';
const BASE_URL = process.env.VUE_APP_BASE_URL;

export default {
  data() {
    return {
      feedbackMessage: '', // 用户输入的留言内容
      feedbacks: [], // 留言和回复的历史记录
      feedbackSubmitted: false, // 提交留言成功标志
      message: {
        show: false,
        content: '',
        type: ''
      }
    };
  },
  mounted() {
    this.loadFeedbacks(); // 页面加载时，获取用户的留言历史
  },
  methods: {
    getAuthHeaders() {
      const token = localStorage.getItem('authToken');
      return token ? { 'Authorization': `Bearer ${token}` } : {};
    },

    // 获取用户的留言和回复历史
    async loadFeedbacks() {
      const userId = localStorage.getItem('userId');
      const token = localStorage.getItem('authToken');
      
      if (!userId || !token) {
        this.showMessage('请先登录', 'error');
        return;
      }
      
      try {
        const response = await axios.get(`${BASE_URL}/api/canteen/feedbacks`, {
          params: { user_id: userId },
          headers: this.getAuthHeaders()
        });
        this.feedbacks = response.data.feedbacks; // 设置留言历史
      } catch (error) {
        console.error('加载留言历史失败:', error);
        this.showMessage('加载留言历史失败，请稍后重试', 'error');
      }
    },

    // 提交留言
    async submitFeedback() {
      const userId = localStorage.getItem('userId');
      const token = localStorage.getItem('authToken');

      if (!userId || !token) {
        this.showMessage('请先登录', 'error');
        return;
      }

      if (!this.feedbackMessage.trim()) {
        this.showMessage('留言内容不能为空', 'error');
        return;
      }

      try {
        await axios.post(`${BASE_URL}/api/canteen/feedback`, {
          user_id: userId,
          message: this.feedbackMessage,
        }, {
          headers: this.getAuthHeaders()
        });

        this.showMessage('留言提交成功');
        this.feedbackMessage = ''; // 清空留言内容

        this.feedbackSubmitted = true; // 显示提交成功提示
        setTimeout(() => {
          this.feedbackSubmitted = false;
        }, 2000);

        // 重新加载留言历史，显示新的留言和可能的回复
        await this.loadFeedbacks();
      } catch (error) {
        console.error('提交留言失败:', error);
        this.showMessage('提交留言失败，请稍后重试', 'error');
      }
    },

    // 删除留言
    async deleteFeedback(feedback) {
      if (!confirm('确定要删除这条留言吗？')) return;

      const userId = localStorage.getItem('userId');
      const token = localStorage.getItem('authToken');
      
      if (!userId || !token) {
        this.showMessage('请先登录', 'error');
        return;
      }

      try {
        await axios.delete(`${BASE_URL}/api/canteen/feedback/${feedback.id}`, {
          headers: this.getAuthHeaders(),
          data: {
            user_id: userId,
            is_admin: localStorage.getItem('userRole') === 'admin'
          }
        });
        
        this.showMessage('留言已删除');
        await this.loadFeedbacks(); // 重新获取留言列表
      } catch (error) {
        console.error('删除留言失败:', error);
        this.showMessage(error.response?.data?.message || '删除失败，请稍后重试', 'error');
      }
    },

    // 显示提示消息
    showMessage(content, type = 'success') {
      this.message = {
        show: true,
        content,
        type
      };
      setTimeout(() => {
        this.message.show = false;
      }, 3000);
    },

    // 格式化时间
    formatTime(time) {
      return new Date(time).toLocaleString();
    }
  },
};
</script>

<style scoped>
.submit-feedback {
  padding: 20px;
}

textarea {
  width: 100%;
  margin-bottom: 10px;
  padding: 10px;
}

button {
  padding: 10px 20px;
  background-color: #4CAF50;
  color: white;
  border: none;
  cursor: pointer;
}

button:hover {
  background-color: #45a049;
}

.feedback-item {
  margin-bottom: 20px;
  border: 1px solid #ddd;
  padding: 10px;
}

.feedback-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.feedback-time {
  color: #666;
  font-size: 0.9em;
}

.delete-btn {
  padding: 4px 8px;
  font-size: 12px;
  background-color: #ff5252;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.delete-btn:hover {
  background-color: #ff1744;
  transform: translateY(-1px);
}

.submit-success {
  background-color: #d4edda;
  padding: 10px;
  margin-top: 10px;
  border-radius: 5px;
  color: #155724;
}
</style>