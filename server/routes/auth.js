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
// 餐厅API
// 获取可用菜单项
router.get('/canteen/menu', async (req, res) => {
  try {
    const [menuItems] = await pool.query('SELECT * FROM menu_items WHERE available = TRUE');
    res.status(200).json(menuItems);
  } catch (error) {
    console.error('获取菜单失败:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 获取所有菜单项（管理员查看）
router.get('/canteen/menu/all', async (req, res) => {
  try {
    const [menuItems] = await pool.query('SELECT * FROM menu_items');
    res.status(200).json(menuItems);
  } catch (error) {
    console.error('获取所有菜单失败:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 提交订单
router.post('/canteen/order', async (req, res) => {
  const { menu_item_id, quantity } = req.body;
  const token = req.headers['authorization'];

  if (!token) {
    return res.status(401).json({ message: '未提供 token' });
  }

  try {
    const decoded = jwt.verify(token.split(' ')[1], process.env.JWT_SECRET);
    const userId = decoded.id;

    // 查询菜单项
    const [menuItem] = await pool.query('SELECT price FROM menu_items WHERE id = ?', [menu_item_id]);
    if (menuItem.length === 0) {
      return res.status(404).json({ message: '菜单项不存在' });
    }

    const totalPrice = menuItem[0].price * quantity;

    // 插入订单
    await pool.query('INSERT INTO orders (user_id, menu_item_id, quantity, total_price) VALUES (?, ?, ?, ?)',
      [userId, menu_item_id, quantity, totalPrice]);

    res.status(201).json({ message: '订单创建成功' });
  } catch (error) {
    console.error('订单创建失败:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 获取所有订单（管理员查看）
router.get('/canteen/orders', async (req, res) => {
  try {
    const [orders] = await pool.query(`
      SELECT o.id, u.username, m.name AS menu_item_name, o.quantity, o.total_price, o.status, o.created_at
      FROM orders o
      JOIN users u ON o.user_id = u.id
      JOIN menu_items m ON o.menu_item_id = m.id
      ORDER BY o.created_at DESC
    `);
    res.status(200).json(orders);
  } catch (error) {
    console.error('获取订单失败:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 更新订单状态
router.put('/canteen/orders/:id/status', async (req, res) => {
  const orderId = req.params.id;
  const { status } = req.body;

  try {
    await pool.query('UPDATE orders SET status = ? WHERE id = ?', [status, orderId]);
    res.status(200).json({ message: '订单状态已更新' });
  } catch (error) {
    console.error('更新订单状态失败:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 后端调试日志
router.put('/canteen/orders/:id/status', async (req, res) => {
  const orderId = req.params.id;
  const { status } = req.body;

  console.log('接收到的订单ID:', orderId);
  console.log('接收到的订单状态:', status);

  if (!status) {
    return res.status(400).json({ message: '订单状态不能为空' });
  }

  try {
    const [result] = await pool.query('UPDATE orders SET status = ? WHERE id = ?', [status, orderId]);

    if (result.affectedRows === 0) {
      console.log('未找到订单:', orderId);
      return res.status(404).json({ message: '订单未找到' });
    }

    console.log('订单状态更新成功:', orderId);
    res.status(200).json({ message: '订单状态已更新' });
  } catch (error) {
    console.error('更新订单状态失败:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 添加菜单项
router.post('/canteen/menu', async (req, res) => {
  const { name, description, price, image_url } = req.body;

  try {
    await pool.query('INSERT INTO menu_items (name, description, price, image_url) VALUES (?, ?, ?, ?)',
      [name, description, price, image_url]);
    res.status(201).json({ message: '菜品添加成功' });
  } catch (error) {
    console.error('添加菜品失败:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 删除菜单项
router.delete('/canteen/menu/:id', async (req, res) => {
  const menuItemId = req.params.id;

  try {
    await pool.query('DELETE FROM menu_items WHERE id = ?', [menuItemId]);
    res.status(200).json({ message: '菜品已删除' });
  } catch (error) {
    console.error('删除菜品失败:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 编辑菜单项
router.put('/canteen/menu/:id', async (req, res) => {
  const menuItemId = req.params.id;
  const { name, description, price, image_url } = req.body;

  try {
    await pool.query('UPDATE menu_items SET name = ?, description = ?, price = ?, image_url = ? WHERE id = ?',
      [name, description, price, image_url, menuItemId]);
    res.status(200).json({ message: '菜品更新成功' });
  } catch (error) {
    console.error('更新菜品失败:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

module.exports = router;
