<template>
    <div class="article-editor">
      <h2>编写文章</h2>
      <form @submit.prevent="submitArticle">
        <div>
          <label>标题：</label>
          <input type="text" v-model="title" required />
        </div>
        <div>
          <label>内容：</label>
          <textarea v-model="content" required></textarea>
        </div>
        <div>
          <label>图片链接：</label>
          <input type="text" v-model="imageUrl" />
        </div>
        <div>
          <label>选择发布位置：</label>
          <select v-model="category" required>
            <option value="carousel">轮播图</option>
            <option value="hotNews">热门新闻</option>
            <option value="newsList">新闻列表</option>
          </select>
        </div>
        <button type="submit">发布文章</button>
      </form>
    </div>
  </template>
  
  <script>
  import axios from 'axios';
  
  export default {
    data() {
      return {
        title: '',
        content: '',
        imageUrl: '',
        category: 'newsList', // 默认选择新闻列表
      };
    },
    methods: {
      async submitArticle() {
        try {
          const response = await axios.post('http://localhost:3000/api/auth/articles', {
            title: this.title,
            content: this.content,
            image_url: this.imageUrl,
            category: this.category,
          });
          alert(response.data.message);
          this.resetForm();
        } catch (error) {
          console.error('发布文章失败:', error);
          alert('发布失败，请重试。');
        }
      },
      resetForm() {
        this.title = '';
        this.content = '';
        this.imageUrl = '';
        this.category = 'newsList';
      }
    }
  };
  </script>
  
  <style scoped>
  .article-editor {
    padding: 20px;
  }
  </style>
  