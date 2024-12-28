<template>
  <div class="vote-list-container">
    <h2>投票列表</h2>
    <div v-if="loading" class="loading">
      <span>加载中...</span>
    </div>
    <div v-else-if="votes.length === 0" class="empty-state">
      暂无投票
    </div>
    <div v-else class="vote-list">
      <div v-for="vote in votes" :key="vote.id" class="vote-card">
        <h3 class="vote-title">{{ vote.title }}</h3>
        <p class="vote-description">{{ vote.description }}</p>
        <div class="vote-status">
          <span class="vote-count">{{ vote.totalVotes || 0 }} 人已投票</span>
        </div>
        <router-link 
          :to="{ name: 'VoteDetail', params: { id: vote.id } }"
          class="vote-link"
        >
          参与投票
        </router-link>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';
const API = process.env.VUE_APP_BASE_URL;
export default {
  name: 'VoteList',
  data() {
    return {
      votes: [],
      loading: false,
    };
  },
  mounted() {
    this.fetchVotes();
  },
  methods: {
    async fetchVotes() {
      this.loading = true;
      try {
        const response = await axios.get(`${API}/api/canteen/votes`);
        this.votes = response.data;
      } catch (error) {
        console.error('获取投票失败:', error);
      } finally {
        this.loading = false;
      }
    },
  },
};
</script>

<style scoped>
.vote-list-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

h2 {
  color: #333;
  text-align: center;
  margin-bottom: 30px;
}

.loading {
  text-align: center;
  padding: 40px;
  color: #666;
}

.empty-state {
  text-align: center;
  padding: 40px;
  color: #666;
  background: #f8f8f8;
  border-radius: 8px;
}

.vote-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
}

.vote-card {
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s;
}

.vote-card:hover {
  transform: translateY(-5px);
}

.vote-title {
  color: #333;
  margin: 0 0 10px 0;
  font-size: 1.2em;
}

.vote-description {
  color: #666;
  margin: 0 0 15px 0;
  line-height: 1.5;
}

.vote-status {
  margin-bottom: 15px;
}

.vote-count {
  color: #409EFF;
  font-size: 0.9em;
}

.vote-link {
  display: inline-block;
  padding: 8px 16px;
  background-color: #409EFF;
  color: white;
  text-decoration: none;
  border-radius: 4px;
  transition: background-color 0.3s;
}

.vote-link:hover {
  background-color: #66b1ff;
}
</style>