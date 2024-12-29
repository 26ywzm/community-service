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

// 基础中间件
// Helmet 配置，优化安全策略
app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    crossOriginEmbedderPolicy: false,
    contentSecurityPolicy: false
}));

// CORS 配置
const allowedOrigins = [
    'https://sheqv.26ywzm.icu',  // 生产环境
    'https://api.26ywzm.icu',   // 生产环境
    'https://localhost:8080',    // 本地开发环境
    'https://127.0.0.1:8080'    // 本地开发环境
];

const corsOptions = {
    origin: function (origin, callback) {
        if (allowedOrigins.indexOf(origin) !== -1 || !origin) {
            callback(null, true);  // 允许请求来自 allowedOrigins 中的域
        } else {
            callback(new Error('Not allowed by CORS'));  // 拒绝跨域请求
        }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Cache-Control', 'Pragma'],
    exposedHeaders: ['Content-Length', 'Content-Type'],
    credentials: true,  // 允许发送 cookie
    preflightContinue: false,  // 不传递预检请求到下一个路由
    optionsSuccessStatus: 200,
    maxAge: 86400  // 预检请求的结果可以缓存24小时
};

// 应用 CORS 中间件
app.use(cors(corsOptions));

// 解析 JSON 和 URL 编码数据，限制大小
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// 处理预检请求 (OPTIONS)
app.use((req, res, next) => {
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    next();
});

app.use(compression()); // 压缩中间件
app.use(morgan('dev')); // 日志中间件

// 静态文件服务
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// 路由
const authRoutes = require('./routes/auth');
app.use('/api/auth', authRoutes);
const canteenRoutes = require('./routes/canteen');
app.use('/api/canteen', canteenRoutes);

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
        app.listen(PORT, '0.0.0.0', () => {
            console.log(`\n=== 服务器启动成功 ===`);
            console.log(`时间: ${new Date().toISOString()}`);
            console.log(`端口: ${PORT}`);
            console.log(`环境: ${process.env.NODE_ENV || 'development'}`);
            console.log(`CORS origin: ${allowedOrigins.join(', ')}`);
            console.log(`===================\n`);
        });
    } catch (error) {
        console.error('服务器启动失败:', error);
        process.exit(1);
    }
}

// 优雅退出
process.on('SIGTERM', () => {
    console.log('收到 SIGTERM 信号，准备关闭服务器...');
    server.close(() => {
        console.log('服务器已安全关闭');
        process.exit(0);
    });
});

startServer();
