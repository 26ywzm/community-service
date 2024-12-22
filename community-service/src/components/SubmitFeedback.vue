<template>
    <div class="submit-feedback">
      <h2>提交您的建议或留言</h2>
  
      <!-- 显示留言和回复历史 -->
      <div v-if="feedbacks.length">
        <div v-for="(feedback, index) in feedbacks" :key="index" class="feedback-item">
          <p><strong>留言：</strong>{{ feedback.message }}</p>
          <p v-if="feedback.admin_reply"><strong>管理员回复：</strong>{{ feedback.admin_reply }}</p>
          <p v-else><i>等待管理员回复...</i></p>
        </div>
      </div>
  
      <!-- 留言输入框 -->
      <textarea v-model="message" placeholder="请填写您的留言" rows="4" required></textarea>
  
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
        message: '', // 用户输入的留言内容
        feedbacks: [], // 留言和回复的历史记录
        feedbackSubmitted: false, // 提交留言成功标志
      };
    },
    mounted() {
      this.loadFeedbacks(); // 页面加载时，获取用户的留言历史
    },
    methods: {
      // 获取用户的留言和回复历史
      async loadFeedbacks() {
        const userId = localStorage.getItem('userId');
        if (!userId) {
          alert('未登录');
          return;
        }
        
        try {
          const response = await axios.get(`${BASE_URL}/api/canteen/feedbacks`, {
            params: { user_id: userId },
          });
          this.feedbacks = response.data.feedbacks; // 设置留言历史
        } catch (error) {
          console.error('加载留言历史失败:', error);
          alert('加载留言历史失败，请稍后重试');
        }
      },
  
      // 提交留言
      async submitFeedback() {
        const userId = localStorage.getItem('userId');
  
        if (!userId) {
          alert('未登录');
          return;
        }
  
        if (!this.message.trim()) {
          alert('留言内容不能为空');
          return;
        }
  
        try {
          const response = await axios.post(`${BASE_URL}/api/canteen/feedback`, {
            user_id: userId,
            message: this.message,
          });
  
          alert(response.data.message);
          this.message = ''; // 清空留言内容
  
          this.feedbackSubmitted = true; // 显示提交成功提示
          setTimeout(() => {
            this.feedbackSubmitted = false;
          }, 2000);
  
          // 重新加载留言历史，显示新的留言和可能的回复
          this.loadFeedbacks();
        } catch (error) {
          console.error('提交留言失败:', error);
          alert('提交留言失败，请稍后重试');
        }
      },
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
  
  .feedback-item p {
    margin: 5px 0;
  }
  
  .submit-success {
    background-color: #d4edda;
    padding: 10px;
    margin-top: 10px;
    border-radius: 5px;
    color: #155724;
  }
  </style>
  