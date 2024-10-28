// routes/auth.js
const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

dotenv.config();

const router = express.Router();

// MySQL 连接池
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

// 用户注册
router.post('/register', async (req, res) => {
  const { username, email, password, role } = req.body; // 允许传递 role

  if (!username || !email || !password) {
    return res.status(400).json({ message: '请填写所有必填字段' });
  }

  // 确定角色，默认为 'user'
  const userRole = role === 'super_admin' ? 'super_admin' : 'user';

  try {
    const hashedPassword = await bcrypt.hash(password, 10); // 加密密码

    // 插入新用户
    const [rows] = await pool.query('INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)', [username, email, hashedPassword, userRole]);

    res.status(201).json({ message: '注册成功' });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      res.status(400).json({ message: '邮箱已被注册' });
    } else {
      console.error(error);
      res.status(500).json({ message: '服务器错误' });
    }
  }
});

// 用户登录
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: '请填写所有必填字段' });
  }

  try {
    const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);

    if (rows.length === 0) {
      return res.status(400).json({ message: '用户不存在' });
    }

    const user = rows[0];

    // 检查密码是否正确
    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return res.status(400).json({ message: '密码错误' });
    }

    // 生成 JWT，包括用户角色信息
    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1h' });

    res.status(200).json({ message: '登录成功', token, role: user.role });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 获取和更新用户信息的 API

// 获取用户信息
router.get('/profile', async (req, res) => {
  const token = req.headers['authorization'];

  if (!token) {
    return res.status(401).json({ message: '未提供 token' });
  }

  try {
    // 验证 token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.id;

    // 查询用户信息
    const [rows] = await pool.query('SELECT username, email FROM users WHERE id = ?', [userId]);

    if (rows.length === 0) {
      return res.status(404).json({ message: '用户不存在' });
    }

    // 返回用户信息
    const user = rows[0];
    res.status(200).json({ user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 更新用户信息
router.put('/profile', async (req, res) => {
  const token = req.headers['authorization'];

  if (!token) {
    return res.status(401).json({ message: '未提供 token' });
  }

  try {
    // 验证 token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.id;

    const { username, email, password } = req.body;

    // 检查必填字段
    if (!username || !email) {
      return res.status(400).json({ message: '用户名和邮箱是必填字段' });
    }

    // 如果提供了新密码，则加密它
    let hashedPassword = null;
    if (password) {
      hashedPassword = await bcrypt.hash(password, 10);
    }

    // 更新用户信息
    const updateQuery = password
      ? 'UPDATE users SET username = ?, email = ?, password = ? WHERE id = ?'
      : 'UPDATE users SET username = ?, email = ? WHERE id = ?';

    const updateValues = password
      ? [username, email, hashedPassword, userId]
      : [username, email, userId];

    await pool.query(updateQuery, updateValues);

    res.status(200).json({ message: '用户信息已更新' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 获取轮播图 API
router.get('/carousel-images', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM carousel_images');
    res.status(200).json(rows);
  } catch (error) {
    console.error('获取轮播图失败:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 获取热门新闻 API
router.get('/hot-news', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM hot_news');
    res.status(200).json(rows);
  } catch (error) {
    console.error('获取热门新闻失败:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 获取新闻列表 API
router.get('/news-list', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM news_list');
    res.status(200).json(rows);
  } catch (error) {
    console.error('获取新闻列表失败:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 获取用户列表
router.get('/users', async (req, res) => {
  try {
    const [users] = await pool.query('SELECT * FROM users WHERE role = "user"');
    res.status(200).json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 获取管理员列表
router.get('/admins', async (req, res) => {
  try {
    const [admins] = await pool.query('SELECT * FROM users WHERE role = "admin"');
    res.status(200).json(admins);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 升级用户为管理员
router.post('/promote/:id', async (req, res) => {
  const userId = req.params.id;

  try {
    await pool.query('UPDATE users SET role = "admin" WHERE id = ?', [userId]);
    res.status(200).json({ message: '用户已升级为管理员' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 降级管理员为用户
router.post('/demote/:id', async (req, res) => {
  const userId = req.params.id;

  try {
    await pool.query('UPDATE users SET role = "user" WHERE id = ?', [userId]);
    res.status(200).json({ message: '管理员已降级为用户' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 获取新闻详情
router.get('/news/:id', async (req, res) => {
  const newsId = req.params.id;
  try {
    const [rows] = await pool.query('SELECT * FROM news_list WHERE id = ?', [newsId]);
    if (rows.length === 0) {
      return res.status(404).json({ message: '新闻未找到' });
    }
    res.status(200).json(rows[0]); // 返回新闻详情
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 发布文章
router.post('/articles', async (req, res) => {
  const { title, content, image_url, category } = req.body;

  // 确保当选择为轮播图时必须提供图片
  if (category === 'carousel' && !image_url) {
    return res.status(400).json({ message: '轮播图必须有图片' });
  }

  try {
    await pool.query('INSERT INTO articles (title, content, image_url, category) VALUES (?, ?, ?, ?)',
      [title, content, image_url, category]);
    res.status(201).json({ message: '文章发布成功' });
  } catch (error) {
    console.error('发布文章失败:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 获取特定类别的文章
router.get('/articles', async (req, res) => {
  const category = req.query.category; // 从查询参数获取类别
  try {
    const [rows] = await pool.query('SELECT * FROM articles WHERE category = ?', [category]);
    res.status(200).json(rows);
  } catch (error) {
    console.error('获取文章失败:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 获取文章详情
router.get('/articles/:id', async (req, res) => {
  const articleId = req.params.id;
  try {
    const [rows] = await pool.query('SELECT * FROM articles WHERE id = ?', [articleId]);
    if (rows.length === 0) {
      return res.status(404).json({ message: '文章未找到' });
    }
    res.status(200).json(rows[0]); // 返回文章详情
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: '服务器错误' });
  }
});


module.exports = router;
