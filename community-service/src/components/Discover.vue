<template>
    <div class="discover-container">
      <h2>发现</h2>
      <section class="recommendations">
        <h3>推荐活动</h3>
        <div class="activity" v-for="activity in activities" :key="activity.id">
          <img :src="activity.image" alt="活动图片" />
          <h4>{{ activity.title }}</h4>
          <p>{{ activity.description }}</p>
        </div>
      </section>
    </div>
  </template>
  
  <script>
  export default {
    name: 'UserDiscover',
    data() {
      return {
        activities: [
          { id: 1, title: '社区义诊', description: '为居民提供免费的身体检查和健康咨询服务。', image: 'discover1.jpg' },
          { id: 2, title: '环保讲座', description: '如何有效进行垃圾分类，保护环境。', image: 'discover2.jpg' },
          { id: 3, title: '邻里运动会', description: '丰富多彩的社区运动会，拉近居民之间的关系。', image: 'discover3.jpg' },
        ],
      };
    },
  };
  </script>
  
  <style scoped>
  .discover-container {
    padding: 20px;
    max-width: 1200px;
    margin: 0 auto;
  }
  
  .activity {
    margin-bottom: 20px;
  }
  
  .activity img {
    width: 100%;
    height: auto;
    border-radius: 5px;
    object-fit: cover;
  }
  
  .activity h4 {
    margin-top: 10px;
  }
  
  .activity p {
    font-size: 14px;
    color: #666;
  }
  </style>
  