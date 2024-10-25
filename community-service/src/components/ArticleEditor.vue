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
  max-width: 600px;
  margin: 0 auto;
  background-color: #ffffff;
  border-radius: 10px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

h2 {
  text-align: center;
  color: #333;
  margin-bottom: 20px;
}

.form-group {
  margin-bottom: 60px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: bold;
  color: #555;
}

.form-group label.required::after {
  content: '*';
  color: #e74c3c;
  margin-left: 5px;
}

input[type="text"],
textarea,
select {
  width: 100%;
  padding: 10px;
  font-size: 16px;
  border: 1px solid #ddd;
  border-radius: 5px;
  box-sizing: border-box;
  transition: border-color 0.3s ease;
}

input[type="text"]:focus,
textarea:focus,
select:focus {
  border-color: #42b983;
  outline: none;
}

textarea {
  resize: vertical;
  height: 120px;
}

button {
  width: 100%;
  background-color: #42b983;
  color: white;
  border: none;
  padding: 12px 0;
  border-radius: 5px;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  transition: background-color 0.3s;
  margin-top: 15px;
}

button:disabled {
  background-color: #bdc3c7;
  cursor: not-allowed;
}

button:not(:disabled):hover {
  background-color: #369d73;
}

@media (max-width: 768px) {
  .article-editor {
    padding: 15px;
  }
  
  button {
    font-size: 14px;
    padding: 10px 0;
    margin-top: 15px;
  }
}
</style>