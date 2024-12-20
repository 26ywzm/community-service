const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const path = require('path');
const compression = require('compression');
const morgan = require('morgan');
const helmet = require('helmet');
const { testConnection, initDatabase } = require('./db');

// 初始化 dotenv 配置
dotenv.config();

const app = express();

// CORS 配置 - 必须在其他中间件之前
app.use(cors({
  origin: true, // 允许所有来源，或者使用具体域名 ['https://sheqv.26ywzm.icu']
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  credentials: true,
  maxAge: 86400 // 预检请求缓存24小时
}));

// 处理 OPTIONS 请求
app.options('*', cors());

// Helmet 配置
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: false // 暂时禁用 CSP 以排查问题
}));

app.use(compression()); // 压缩中间件
app.use(morgan('dev')); // 日志中间件
app.use(express.json()); // JSON解析
app.use(express.urlencoded({ extended: true })); // URL编码解析

// 静态文件服务
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// 路由
const authRoutes = require('./routes/auth');
app.use('/api/auth', authRoutes);

// 错误处理中间件
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: '服务器错误' });
});

// 初始化数据库并启动服务器
async function startServer() {
    try {
        // 测试数据库连接
        await testConnection();
        
        // 初始化数据库表
        await initDatabase();
        
        // 启动服务器
        const PORT = process.env.PORT || 3000;
        app.listen(PORT, () => {
            console.log(`服务器运行在端口 ${PORT}`);
        });
    } catch (error) {
        console.error('服务器启动失败:', error);
        process.exit(1);
    }
}

startServer();
