<template>
    <div class="order-detail">
        <h2>订单详细信息</h2>

        <div v-if="order">
            <h3>订单 ID: {{ order.id }}</h3>
            <p>用户邮箱: {{ order.email }}</p>
            <p>用户名: {{ order.username }}</p>
            <p>订单状态: {{ statusText[order.status] || '未知状态' }}</p>
            <p>总价格: {{ order.total_price }} 元</p>
            <h4>订单内容:</h4>
            <div v-if="order.items && order.items.length" class="order-items">
                <div v-for="item in order.items" :key="item.menu_item_id" class="order-item">
                    <div class="item-info">
                        <span class="item-name">{{ item.name }}</span>
                        <div class="item-details">
                            <span class="item-quantity">数量: {{ item.quantity }}</span>
                            <span class="item-price">单价: ¥{{ item.price }}</span>
                            <span class="item-total">小计: ¥{{ item.quantity * item.price }}</span>
                        </div>
                    </div>
                </div>
            </div>
            <p v-else>暂无订单详情</p>
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
            loading: true,
            statusText: {
                0: '待处理',
                1: '处理中',
                2: '已完成',
                3: '已取消'
            }
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
                const orderData = response.data;
                
                // 打印完整的订单数据
                // console.log('完整的订单数据:', JSON.stringify(orderData, null, 2));
                // console.log('订单对象的所有键:', Object.keys(orderData));
                
                if (orderData && orderData.user) {
                    this.order = {
                        ...orderData,
                        email: orderData.user.email,
                        username: orderData.user.username
                    };
                } else {
                    this.order = orderData;
                }
                this.loading = false;
            } catch (error) {
                console.error('获取订单详情失败:', error);
                handleApiError(error);
            }
        },
        formatDate(dateString) {
            if (!dateString) return '暂无日期';
            try {
                const date = new Date(dateString);
                if (isNaN(date.getTime())) return '无效日期';
                
                const options = { 
                    year: 'numeric', 
                    month: '2-digit', 
                    day: '2-digit', 
                    hour: '2-digit', 
                    minute: '2-digit',
                    hour12: false 
                };
                return date.toLocaleString('zh-CN', options).replace(/\//g, '-');
            } catch (error) {
                console.error('日期格式化错误:', error);
                return '日期格式错误';
            }
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
