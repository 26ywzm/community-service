const express = require('express');
const mysql = require('mysql2');
const authRoutes = require('./routes/auth');
const dotenv = require('dotenv');
const cors = require('cors');
const path = require('path');

// 初始化 dotenv 配置
require('dotenv').config();
dotenv.config();

const app = express(); // 初始化 app

app.use(cors()); // 在 app 初始化后调用 cors
app.use(express.json()); // 解析 JSON 请求体

// 允许访问uploads目录中的文件
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// 配置 MySQL 连接
const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

// 测试数据库连接
db.connect(err => {
  if (err) {
    console.error('数据库连接失败: ', err);
    return;
  }
  console.log('成功连接到 MySQL 数据库');
});

// 使用 auth 路由
app.use('/api/auth', authRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
