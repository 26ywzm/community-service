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

// // 请求调试中间件
// app.use((req, res, next) => {
//     console.log('\n--- 收到新请求 ---');
//     console.log('时间:', new Date().toISOString());
//     console.log('方法:', req.method);
//     console.log('URL:', req.url);
//     console.log('原始URL:', req.originalUrl);
//     console.log('基础URL:', req.baseUrl);
//     console.log('路径:', req.path);
//     console.log('协议:', req.protocol);
//     console.log('主机:', req.hostname);
//     console.log('IP:', req.ip);
//     console.log('头部:', JSON.stringify(req.headers, null, 2));
//     console.log('查询参数:', req.query);
//     console.log('请求体:', req.body);
//     console.log('---------------\n');
//     next();
// });

// 基础中间件
// Helmet 配置
app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    crossOriginEmbedderPolicy: false,
    contentSecurityPolicy: false
})); // 安全中间件
app.use(cors()); // 跨域中间件
app.options('*', cors());
app.use(compression()); // 压缩中间件
app.use(morgan('dev')); // 日志中间件
app.use(express.json()); // JSON解析
app.use(express.urlencoded({ extended: true })); // URL编码解析


// 静态文件服务
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// 路由
const authRoutes = require('./routes/auth');
app.use('/api/auth', authRoutes);
const canteenRoutes = require('./routes/canteen');
app.use('/api/canteen', canteenRoutes);

// 请求日志中间件
// app.use((req, res, next) => {
//     console.log('\n=== 收到新请求 ===');
//     console.log('时间:', new Date().toISOString());
//     console.log('方法:', req.method);
//     console.log('协议:', req.protocol);
//     console.log('主机:', req.hostname);
//     console.log('原始URL:', req.originalUrl);
//     console.log('路径:', req.path);
//     console.log('查询:', req.query);
//     console.log('头部:', req.headers);
//     console.log('==================\n');
//     next();
// });

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

// 启动服务器
async function startServer() {
    try {
        await testConnection();
        // console.log('数据库连接成功！');
        
        await initDatabase();
        // console.log('数据库表初始化成功！');
        
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
