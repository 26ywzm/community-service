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

// 详细的请求日志
morgan.token('body', (req) => JSON.stringify(req.body));
app.use(morgan(':method :url :status :response-time ms - :res[content-length] :body'));

// 请求调试中间件
app.use((req, res, next) => {
    console.log('\n--- 收到新请求 ---');
    console.log('时间:', new Date().toISOString());
    console.log('方法:', req.method);
    console.log('URL:', req.url);
    console.log('原始URL:', req.originalUrl);
    console.log('基础URL:', req.baseUrl);
    console.log('路径:', req.path);
    console.log('协议:', req.protocol);
    console.log('主机:', req.hostname);
    console.log('IP:', req.ip);
    console.log('头部:', JSON.stringify(req.headers, null, 2));
    console.log('查询参数:', req.query);
    console.log('请求体:', req.body);
    console.log('---------------\n');
    next();
});

// CORS 配置
app.use(cors({
    origin: 'https://sheqv.26ywzm.icu',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
    credentials: true,
    maxAge: 86400
}));

// 基础中间件
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(compression());

// Helmet 配置
app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    crossOriginEmbedderPolicy: false,
    contentSecurityPolicy: false
}));

// 静态文件服务
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// 测试路由
app.get('/test', (req, res) => {
    console.log('测试路由被访问');
    res.json({ 
        message: 'Server is running',
        time: new Date().toISOString(),
        headers: req.headers,
        url: req.url
    });
});

// API 路由
const authRoutes = require('./routes/auth');
app.use('/api/auth', authRoutes);

// 路由日志中间件
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    console.log('Headers:', JSON.stringify(req.headers, null, 2));
    if (req.body) {
        console.log('Body:', JSON.stringify(req.body, null, 2));
    }
    next();
});

// 404 处理
app.use((req, res, next) => {
    console.log('404 错误:', {
        时间: new Date().toISOString(),
        方法: req.method,
        URL: req.url,
        原始URL: req.originalUrl,
        头部: req.headers
    });
    res.status(404).json({
        success: false,
        message: '404 Not Found - ' + req.url,
        path: req.url,
        method: req.method,
        time: new Date().toISOString()
    });
});

// 错误处理
app.use((err, req, res, next) => {
    console.error('服务器错误:', {
        错误: err,
        堆栈: err.stack,
        时间: new Date().toISOString(),
        URL: req.url,
        方法: req.method
    });
    res.status(500).json({
        success: false,
        message: '服务器错误',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// 启动服务器
async function startServer() {
    try {
        await testConnection();
        console.log('数据库连接成功！');
        
        await initDatabase();
        console.log('数据库表初始化成功！');
        
        const PORT = process.env.PORT || 3000;
        app.listen(PORT, '0.0.0.0', () => {
            console.log(`\n=== 服务器启动成功 ===`);
            console.log(`时间: ${new Date().toISOString()}`);
            console.log(`端口: ${PORT}`);
            console.log(`环境: ${process.env.NODE_ENV || 'development'}`);
            console.log(`CORS origin: https://sheqv.26ywzm.icu`);
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
