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

        <div v-else-if="loading">
            <p>正在加载订单信息...</p>
        </div>

        <button @click="goBack">返回</button>
    </div>
</template>

<script>
import axios from 'axios';
import { handleApiError } from '../utils/errorHandler';
const API = process.env.VUE_APP_API_URL;

export default {
    name: 'OrderDetail',
    data() {
        return {
            order: null,
            loading: true
        };
    },
    async created() {
        await this.fetchOrderDetails();
    },
    methods: {
        async fetchOrderDetails() {
            const orderId = this.$route.params.orderId;
            try {
                const response = await axios.get(`${API}/canteen/order/${orderId}`, {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('authToken')}`
                    }
                });
                this.order = response.data;
                this.loading = false;
            } catch (error) {
                handleApiError(error);
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
