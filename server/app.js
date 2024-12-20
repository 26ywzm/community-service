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

// 日志中间件
morgan.token('body', (req) => JSON.stringify(req.body));
app.use(morgan(':method :url :status :response-time ms - :res[content-length] :body'));

// 请求调试中间件
app.use((req, res, next) => {
    console.log('收到请求:', {
        时间: new Date().toISOString(),
        方法: req.method,
        URL: req.url,
        头部: req.headers,
        body: req.body
    });
    next();
});

// CORS 配置 - 必须在其他中间件之前
app.use(cors({
  origin: 'https://sheqv.26ywzm.icu',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  credentials: true,
  maxAge: 86400,
  preflightContinue: false, // 不继续处理预检请求
  optionsSuccessStatus: 204
}));

// 基础中间件
app.use(express.json()); // JSON解析
app.use(express.urlencoded({ extended: true })); // URL编码解析
app.use(compression()); // 压缩中间件

// Helmet 配置
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: false
}));

// 静态文件服务
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// 路由
const authRoutes = require('./routes/auth');
app.use('/api/auth', authRoutes);

// 404 处理
app.use((req, res, next) => {
  console.log('404 Not Found:', req.method, req.url);
  res.status(404).json({ 
    success: false, 
    message: '404 Not Found - ' + req.url 
  });
});

// 错误处理中间件
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({ 
      success: false, 
      message: '服务器错误'
    });
});

// 初始化数据库并启动服务器
async function startServer() {
    try {
        // 测试数据库连接
        await testConnection();
        console.log('数据库连接成功！');
        
        // 初始化数据库表
        await initDatabase();
        console.log('数据库表初始化成功！');
        
        // 启动服务器
        const PORT = process.env.PORT || 3000;
        const server = app.listen(PORT, '0.0.0.0', () => {
            const address = server.address();
            console.log(`服务器启动成功！`);
            console.log(`监听地址: ${address.address}`);
            console.log(`监听端口: ${address.port}`);
            console.log(`CORS origin: https://sheqv.26ywzm.icu`);
        });

        // 错误处理
        server.on('error', (error) => {
            if (error.code === 'EADDRINUSE') {
                console.error(`错误：端口 ${PORT} 已被占用！`);
            } else {
                console.error('服务器错误：', error);
            }
            process.exit(1);
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
