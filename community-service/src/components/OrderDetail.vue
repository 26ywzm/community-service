<template>
    <div class="order-detail">
        <el-card>
            <template #header>
                <div class="card-header">
                    <el-page-header @back="goBack" title="返回" content="订单详情" />
                </div>
            </template>

            <div v-if="order" class="order-content">
                <div class="info-list">
                    <div class="info-item">订单编号：{{ order.id }}</div>
                    <div class="info-item">用户名：{{ order.username }}</div>
                    <div class="info-item">邮箱：{{ order.email }}</div>
                    <div class="info-item">
                        订单状态：
                        <el-tag :type="getStatusType(order.status)">
                            {{ statusText[order.status] || '未知状态' }}
                        </el-tag>
                    </div>
                    <div class="info-item">总价格：<span class="price">¥{{ order.total_price }}</span></div>
                </div>

                <div v-if="order.items && order.items.length" class="order-items">
                    <h3>订单商品</h3>
                    <div class="items-list">
                        <div v-for="item in order.items" 
                             :key="item.menu_item_id" 
                             class="item">
                            <div class="item-name">{{ item.name }}</div>
                            <div class="item-info">
                                <span>数量：{{ item.quantity }}</span>
                                <span>单价：¥{{ item.price }}</span>
                                <span class="subtotal">小计：¥{{ (item.quantity * item.price).toFixed(2) }}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div v-else-if="loading" class="loading-wrapper">
                <el-empty description="正在加载订单信息..." />
            </div>
        </el-card>
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
        getStatusType(status) {
            const typeMap = {
                0: 'info',    // 待处理
                1: 'warning', // 处理中
                2: 'success', // 已完成
                3: 'danger'   // 已取消
            };
            return typeMap[status] || 'info';
        },
        async fetchOrderDetails() {
            const orderId = this.$route.params.orderId;
            try {
                const response = await axios.get(`${API}/canteen/order/${orderId}`, {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('authToken')}`
                    }
                });
                const orderData = response.data;
                
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
            this.$router.push('/discover');
        }
    }
};
</script>

<style scoped>
.order-detail {
    max-width: 800px;
    margin: 20px auto;
    padding: 0 20px;
}

.order-content {
    padding: 20px 0;
}

.info-list {
    display: flex;
    flex-direction: column;
    gap: 16px;
}

.info-item {
    padding: 12px 0;
    border-bottom: 1px solid #ebeef5;
    color: #606266;
}

.info-item:last-child {
    border-bottom: none;
}

.price {
    color: #f56c6c;
    font-weight: 500;
}

.order-items {
    margin-top: 30px;
}

.order-items h3 {
    margin-bottom: 20px;
    color: #303133;
}

.items-list {
    display: flex;
    flex-direction: column;
    gap: 16px;
}

.item {
    padding: 16px;
    background: #f8f9fa;
    border-radius: 4px;
}

.item-name {
    font-size: 16px;
    color: #303133;
    margin-bottom: 8px;
}

.item-info {
    display: flex;
    gap: 24px;
    color: #606266;
}

.subtotal {
    color: #409EFF;
    font-weight: 500;
}

.loading-wrapper {
    padding: 40px;
    text-align: center;
}
</style>
