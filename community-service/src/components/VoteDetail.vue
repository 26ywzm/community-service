<template>
  <div class="vote-detail">
    <div v-if="loading" class="loading">
      <span>加载中...</span>
    </div>
    <div v-else class="vote-content">
      <div class="vote-header">
        <h2>{{ vote.title }}</h2>
        <p class="description">{{ vote.description }}</p>
      </div>

      <div v-if="!hasVoted" class="vote-options">
        <h3>请选择您的选项：</h3>
        <div class="options-list">
          <div 
            v-for="(option, index) in vote.options" 
            :key="index"
            class="option-item"
          >
            <button 
              @click="submitVote(option)"
              class="option-button"
            >
              {{ option }}
            </button>
          </div>
        </div>
      </div>

      <div v-else class="vote-result">
        <div class="result-message">
          <i class="el-icon-check"></i>
          <span>您已完成投票</span>
        </div>
        <div class="vote-stats">
          <h3>当前投票结果：</h3>
          <div class="stats-list">
            <div 
              v-for="(count, option) in vote.results" 
              :key="option" 
              class="stat-item"
            >
              <div class="stat-label">{{ option }}</div>
              <div class="stat-bar-container">
                <div 
                  class="stat-bar" 
                  :style="{ width: ((count / vote.totalVotes) * 100) + '%' }"
                ></div>
                <span class="stat-value">{{ count }}票 ({{ ((count / vote.totalVotes) * 100).toFixed(1) }}%)</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="vote-actions">
        <router-link to="/votelist" class="back-button">
          返回投票列表
        </router-link>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';
import { ElMessage } from 'element-plus';
const API = process.env.VUE_APP_BASE_URL;

export default {
  name: 'VoteDetail',
  data() {
    return {
      vote: {
        title: '',
        description: '',
        options: [],
        results: {},
        totalVotes: 0
      },
      hasVoted: false,
      loading: true
    };
  },
  mounted() {
    this.fetchVoteDetails();
  },
  methods: {
    async fetchVoteDetails() {
      const voteId = this.$route.params.id;
      try {
        const response = await axios.get(`${API}/api/canteen/votes/${voteId}`);
        this.vote = {
          ...response.data,
          results: response.data.results || {},
          totalVotes: response.data.totalVotes || 0
        };
        
        // 检查用户是否已投票
        const userId = localStorage.getItem('userId');
        const voteResponse = await axios.get(`${API}/api/canteen/votes/${voteId}/user/${userId}`);
        this.hasVoted = voteResponse.data.hasVoted;
      } catch (error) {
        console.error('获取投票详情失败:', error);
        ElMessage.error('获取投票详情失败');
      } finally {
        this.loading = false;
      }
    },

    async submitVote(option) {
      const voteId = this.$route.params.id;
      
      try {
        await axios.post(`${API}/api/canteen/votes/${voteId}/vote`, 
          { option },
          {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            }
          }
        );
        ElMessage.success('投票成功');
        this.hasVoted = true;
        await this.fetchVoteDetails(); // 刷新投票结果
      } catch (error) {
        console.error('投票失败:', error);
        if (error.response?.status === 401) {
          ElMessage.error('请先登录后再投票');
        } else if (error.response?.data?.message) {
          ElMessage.error(error.response.data.message);
        } else {
          ElMessage.error('投票失败，请稍后重试');
        }
      }
    },
  },
};
</script>

<style scoped>
.vote-detail {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

.loading {
  text-align: center;
  padding: 40px;
  color: #666;
}

.vote-content {
  background: white;
  border-radius: 8px;
  padding: 30px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.vote-header {
  text-align: center;
  margin-bottom: 30px;
}

.vote-header h2 {
  color: #333;
  margin: 0 0 15px 0;
}

.description {
  color: #666;
  line-height: 1.6;
}

.vote-options {
  margin: 30px 0;
}

.vote-options h3 {
  color: #333;
  margin-bottom: 20px;
}

.options-list {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 15px;
}

.option-button {
  width: 100%;
  padding: 15px 20px;
  background-color: #409EFF;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s;
  font-size: 1em;
}

.option-button:hover {
  background-color: #66b1ff;
  transform: translateY(-2px);
}

.vote-result {
  margin: 30px 0;
}

.result-message {
  text-align: center;
  color: #67C23A;
  margin-bottom: 30px;
  font-size: 1.1em;
}

.vote-stats h3 {
  color: #333;
  margin-bottom: 20px;
}

.stats-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 10px;
}

.stat-label {
  width: 120px;
  color: #333;
}

.stat-bar-container {
  flex: 1;
  height: 24px;
  background: #f5f7fa;
  border-radius: 12px;
  position: relative;
  overflow: hidden;
}

.stat-bar {
  height: 100%;
  background: #409EFF;
  border-radius: 12px;
  transition: width 0.3s ease;
}

.stat-value {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  color: #333;
  font-size: 0.9em;
}

.vote-actions {
  margin-top: 30px;
  text-align: center;
}

.back-button {
  display: inline-block;
  padding: 10px 20px;
  background-color: #909399;
  color: white;
  text-decoration: none;
  border-radius: 4px;
  transition: background-color 0.3s;
}

.back-button:hover {
  background-color: #a6a9ad;
}
</style>