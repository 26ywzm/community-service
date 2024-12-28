<template>
  <div>
    <h2>管理投票</h2>
    <div v-if="loading" class="loading">
      <span>加载中...</span>
    </div>
    <div v-else>
      <div class="create-vote-section" v-if="showCreateForm">
        <h3>创建新投票</h3>
        <div class="form-group">
          <label>标题：</label>
          <input v-model="newVote.title" class="form-input" placeholder="请输入投票标题">
        </div>
        <div class="form-group">
          <label>描述：</label>
          <textarea v-model="newVote.description" class="form-input" placeholder="请输入投票描述"></textarea>
        </div>
        <div class="form-group">
          <label>选项：</label>
          <div v-for="(option, index) in newVote.options" :key="index" class="option-input">
            <input v-model="newVote.options[index]" class="form-input" :placeholder="'选项 ' + (index + 1)">
            <button @click="removeOption(index)" class="remove-option-btn">删除</button>
          </div>
          <button @click="addOption" class="add-option-btn">添加选项</button>
        </div>
        <div class="form-actions">
          <button @click="submitNewVote" class="submit-btn">创建投票</button>
          <button @click="cancelCreate" class="cancel-btn">取消</button>
        </div>
      </div>

      <div v-else class="vote-list">
        <div v-for="vote in votes" :key="vote.id" class="vote-item">
          <div class="vote-info">
            <h3>{{ vote.title }}</h3>
            <p>{{ vote.description }}</p>
            <div class="vote-options">
              <h4>投票选项：</h4>
              <div class="options-list">
                <div v-for="(option, index) in vote.options" :key="index" class="option-result">
                  <div class="option-label">
                    {{ option }}
                    <span class="vote-count">({{ vote.results[option] || 0 }}票)</span>
                  </div>
                  <div class="result-bar-container">
                    <div 
                      class="result-bar" 
                      :style="{ 
                        width: getPercentage(vote.results[option], vote.totalVotes) + '%',
                        backgroundColor: getBarColor(index)
                      }"
                    ></div>
                    <span class="result-count">
                      {{ ((vote.results[option] || 0) / (vote.totalVotes || 1) * 100).toFixed(1) }}%
                    </span>
                  </div>
                </div>
              </div>
              <p class="total-votes">总投票数：{{ vote.totalVotes || 0 }}</p>
            </div>
          </div>
          <div class="vote-actions">
            <button class="delete-btn" @click="deleteVote(vote.id)">删除投票</button>
          </div>
        </div>
      </div>
      
      <div class="action-bar">
        <button v-if="!showCreateForm" class="create-btn" @click="showCreateForm = true">创建新投票</button>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';
import { ElMessage } from 'element-plus';
import { adminAuth } from '@/mixins/adminAuth';
const API = process.env.VUE_APP_BASE_URL;

export default {
  name: 'AdminManageVotes',
  mixins: [adminAuth],
  data() {
    return {
      votes: [],
      loading: false,
      showCreateForm: false,
      newVote: {
        title: '',
        description: '',
        options: ['', '']
      }
    };
  },
  mounted() {
    if (this.checkAdminAuth()) {
      this.fetchVotes();
    }
  },
  methods: {
    async fetchVotes() {
      this.loading = true;
      try {
        console.log('开始获取投票列表');
        const response = await axios.get(`${API}/api/canteen/votes`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`
          }
        });
        console.log('获取到的投票数据:', response.data);
        
        // 确保每个投票都有选项数组
        this.votes = response.data.map(vote => ({
          ...vote,
          options: Array.isArray(vote.options) ? vote.options : []
        }));
        console.log('处理后的投票数据:', this.votes);
      } catch (error) {
        console.error('获取投票失败:', error);
        console.error('错误详情:', error.response?.data || error.message);
        ElMessage.error('获取投票列表失败');
      } finally {
        this.loading = false;
      }
    },

    async deleteVote(voteId) {
      if (!confirm('确定要删除这个投票吗？此操作不可恢复，所有投票记录都将被删除。')) {
        return;
      }

      try {
        console.log(`开始删除投票 ID: ${voteId}`);
        await axios.delete(`${API}/api/canteen/votes/${voteId}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`
          }
        });
        
        ElMessage.success('投票删除成功');
        // 从列表中移除已删除的投票
        this.votes = this.votes.filter(vote => vote.id !== voteId);
      } catch (error) {
        console.error('删除投票失败:', error);
        console.error('错误详情:', error.response?.data || error.message);
        
        if (error.response?.status === 401) {
          ElMessage.error('权限不足，请确保您已登录并具有管理员权限');
        } else if (error.response?.data?.message) {
          ElMessage.error(error.response.data.message);
        } else {
          ElMessage.error('删除投票失败，请稍后重试');
        }
      }
    },

    addOption() {
      this.newVote.options.push('');
    },

    removeOption(index) {
      if (this.newVote.options.length > 2) {
        this.newVote.options.splice(index, 1);
      } else {
        ElMessage.warning('至少需要两个选项');
      }
    },

    async submitNewVote() {
      if (!this.validateForm()) {
        return;
      }

      try {
        console.log('准备提交的投票数据:', this.newVote);
        const response = await axios.post(`${API}/api/canteen/votes`, {
          ...this.newVote,
          options: this.newVote.options.filter(opt => opt.trim()) // 过滤空选项
        }, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`
          }
        });
        console.log('创建投票响应:', response.data);
        ElMessage.success('投票创建成功');
        this.showCreateForm = false;
        this.resetForm();
        this.fetchVotes();
      } catch (error) {
        console.error('创建投票失败:', error);
        console.error('错误详情:', error.response?.data || error.message);
        ElMessage.error(error.response?.data?.message || '创建投票失败');
      }
    },

    validateForm() {
      if (!this.newVote.title.trim()) {
        ElMessage.warning('请输入投票标题');
        return false;
      }
      if (!this.newVote.description.trim()) {
        ElMessage.warning('请输入投票描述');
        return false;
      }
      if (this.newVote.options.some(option => !option.trim())) {
        ElMessage.warning('请填写所有选项');
        return false;
      }
      return true;
    },

    resetForm() {
      this.newVote = {
        title: '',
        description: '',
        options: ['', '']
      };
    },

    cancelCreate() {
      this.showCreateForm = false;
      this.resetForm();
    },

    getPercentage(count, total) {
      if (!total) return 0;
      return (count / total) * 100;
    },

    getBarColor(index) {
      // 预定义一些好看的颜色
      const colors = [
        '#409EFF', // 蓝色
        '#67C23A', // 绿色
        '#E6A23C', // 橙色
        '#F56C6C', // 红色
        '#909399', // 灰色
      ];
      return colors[index % colors.length];
    },
  }
};
</script>

<style scoped>
.vote-list {
  margin: 20px 0;
}

.vote-item {
  background: #fff;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 15px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.vote-info h3 {
  margin: 0 0 10px 0;
  color: #333;
}

.vote-info p {
  color: #666;
  margin-bottom: 15px;
}

.vote-options {
  margin-top: 20px;
}

.vote-options h4 {
  margin: 0 0 10px 0;
  color: #333;
}

.options-list {
  margin-top: 10px;
}

.option-result {
  margin-bottom: 10px;
}

.option-label {
  font-weight: 500;
  margin-bottom: 5px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.vote-count {
  color: #666;
  font-size: 0.9em;
  margin-left: 10px;
}

.result-bar-container {
  background: #f5f7fa;
  border-radius: 4px;
  height: 24px;
  position: relative;
  display: flex;
  align-items: center;
  margin-bottom: 10px;
}

.result-bar {
  height: 100%;
  transition: width 0.3s ease;
  min-width: 2%;
  border-radius: 4px;
}

.result-count {
  position: absolute;
  right: 10px;
  color: #333;
  font-size: 0.9em;
  z-index: 1;
}

.total-votes {
  margin-top: 15px;
  color: #666;
  font-weight: 500;
}

.vote-actions {
  margin-top: 15px;
  display: flex;
  justify-content: flex-end;
}

.delete-btn {
  padding: 8px 15px;
  background: #f56c6c;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.delete-btn:hover {
  background: #f78989;
}

.action-bar {
  margin-top: 20px;
  text-align: right;
}

.create-btn {
  padding: 10px 20px;
  background-color: #409eff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s;
}

.create-btn:hover {
  background-color: #66b1ff;
}

.loading {
  text-align: center;
  padding: 20px;
  color: #666;
}

.create-vote-section {
  background: white;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  color: #333;
  font-weight: 500;
}

.form-input {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  margin-bottom: 8px;
  font-size: 14px;
}

textarea.form-input {
  min-height: 100px;
  resize: vertical;
}

.option-input {
  display: flex;
  gap: 10px;
  margin-bottom: 10px;
}

.option-input .form-input {
  margin-bottom: 0;
}

.remove-option-btn {
  padding: 8px 16px;
  background-color: #f56c6c;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.add-option-btn {
  padding: 8px 16px;
  background-color: #67c23a;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  margin-top: 10px;
}

.form-actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
  margin-top: 20px;
}

.submit-btn {
  padding: 10px 20px;
  background-color: #409eff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.cancel-btn {
  padding: 10px 20px;
  background-color: #909399;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}
</style>