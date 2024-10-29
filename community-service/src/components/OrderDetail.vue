<template>
    <div class="order-detail">
        <h2>订单详细信息</h2>

        <div v-if="order">
            <h3>订单 ID: {{ order.id }}</h3>
            <p>用户邮箱: {{ order.email }}</p> <!-- 确认 order.email 是否存在 -->
            <p>订单状态: {{ order.status }}</p> <!-- 确认 order.status 是否存在 -->
            <p>总价格: {{ order.total_price }} 元</p>
            <p>创建时间: {{ formatDate(order.created_at) }}</p>
            <h4>订单内容:</h4>
            <ul>
                <li v-for="detail in order.details" :key="detail.menu_item.id">
                    {{ detail.menu_item.name }} ({{ detail.quantity }}): {{ detail.total_price }} 元
                </li>
            </ul>
        </div>

        <div v-else>
            <p>正在加载订单信息...</p>
        </div>

        <button @click="goBack">返回</button>
    </div>
</template>

<script>
import axios from 'axios';

export default {
    data() {
        return {
            order: null, // 存储订单详情
        };
    },
    created() {
        const orderId = this.$route.params.orderId; // 从路由获取订单 ID
        console.log('获取的 orderId:', orderId); // 打印 orderId
        if (orderId && orderId !== ':orderId') {
            this.fetchOrderDetails(orderId); // 获取订单详细信息
        } else {
            alert('订单 ID 无效');
        }
    },
    methods: {
        async fetchOrderDetails(orderId) {
            try {
                const response = await axios.get(`http://localhost:3000/api/auth/canteen/order/${orderId}`, {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('authToken')}`,
                    },
                });

                console.log('获取的订单信息:', response.data); // 打印订单信息

                this.order = response.data; // 保存订单信息

                console.log('order email:', this.order.email); // 详细日志
                console.log('order status:', this.order.status); // 详细日志

            } catch (error) {
                console.error('获取订单详细信息失败:', error);
                alert('获取订单信息失败，请重试。');
            }
        },

        formatDate(dateString) {
            const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
            return new Date(dateString).toLocaleDateString('zh-CN', options); // 格式化日期
        },

        goBack() {
            this.$router.push('/discover'); // 返回到点餐页面
        }
    }
};
</script>

<style scoped>
.order-detail {
    padding: 20px;
}

button {
    background-color: #4CAF50;
    color: white;
    border: none;
    padding: 10px;
    cursor: pointer;
    border-radius: 5px;
}

button:hover {
    background-color: #45a049;
}
</style>
