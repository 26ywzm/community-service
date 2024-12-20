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

// Helmet 配置
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://api.26ywzm.icu", "https://sheqv.26ywzm.icu"],
    },
  },
}));

// CORS 配置
app.use(cors({
  origin: ['https://sheqv.26ywzm.icu', 'https://api.26ywzm.icu'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  preflightContinue: false,
  optionsSuccessStatus: 204
}));

// 处理 OPTIONS 请求
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
