// routes/auth.js
const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
const authenticateToken = require('../middleware/auth'); // 导入中间件

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
// router.get('/carousel-images', async (req, res) => {
//   try {
//     const [rows] = await pool.query('SELECT * FROM carousel_images');
//     res.status(200).json(rows);
//   } catch (error) {
//     console.error('获取轮播图失败:', error);
//     res.status(500).json({ message: '服务器错误' });
//   }
// });

// 获取热门新闻 API
// router.get('/hot-news', async (req, res) => {
//   try {
//     const [rows] = await pool.query('SELECT * FROM hot_news');
//     res.status(200).json(rows);
//   } catch (error) {
//     console.error('获取热门新闻失败:', error);
//     res.status(500).json({ message: '服务器错误' });
//   }
// });

// 获取新闻列表 API
// router.get('/news-list', async (req, res) => {
//   try {
//     const [rows] = await pool.query('SELECT * FROM news_list');
//     res.status(200).json(rows);
//   } catch (error) {
//     console.error('获取新闻列表失败:', error);
//     res.status(500).json({ message: '服务器错误' });
//   }
// });

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

// 获取所有可用的菜品
router.get('/canteen/menu', async (req, res) => {
  try {
    const [menuItems] = await pool.query('SELECT * FROM menu_items WHERE available = TRUE');
    res.status(200).json(menuItems);
  } catch (error) {
    console.error('获取菜单失败:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 添加菜品
router.post('/canteen/menu', async (req, res) => {
  const { name, price, image_url, description } = req.body;

  try {
    await pool.query('INSERT INTO menu_items (name, price, image_url, description) VALUES (?, ?, ?, ?)',
      [name, price, image_url, description]);
    res.status(201).json({ message: '菜品添加成功' });
  } catch (error) {
    console.error('添加菜品失败:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 更新菜品
router.put('/canteen/menu/:id', async (req, res) => {
  const menuItemId = req.params.id;
  const { name, price, image_url, description } = req.body;

  try {
    await pool.query('UPDATE menu_items SET name = ?, price = ?, image_url = ?, description = ? WHERE id = ?',
      [name, price, image_url, description, menuItemId]);
    res.status(200).json({ message: '菜品更新成功' });
  } catch (error) {
    console.error('更新菜品失败:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 删除菜品
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

// 添加订单
router.post('/canteen/order', authenticateToken, async (req, res) => {
  const { items } = req.body;
  const userId = req.user.id; // 获取用户ID

  if (!items || items.length === 0) {
    return res.status(400).json({ message: '订单不能为空' });
  }

  try {
    // 开始一个事务
    await pool.query('START TRANSACTION');

    // 计算总价格
    const totalPrice = items.reduce((total, item) => total + (parseFloat(item.price) * item.quantity), 0);

    // 创建订单记录
    const [orderResult] = await pool.query('INSERT INTO orders (user_id, total_price) VALUES (?, ?)', [
      userId,
      totalPrice
    ]);

    const orderId = orderResult.insertId;

    // 添加每个菜品到订单项
    for (const item of items) {
      const itemTotalPrice = parseFloat(item.price) * item.quantity; // 计算总价
      await pool.query('INSERT INTO order_details (order_id, menu_item_id, quantity, price, total_price) VALUES (?, ?, ?, ?, ?)', [
        orderId,
        item.menu_item_id,
        item.quantity,
        parseFloat(item.price), // 确保价格是数值类型
        itemTotalPrice // 传入菜品总价
      ]);
    }

    // 提交事务
    await pool.query('COMMIT');
    res.status(201).json({ message: '订单创建成功', orderId });
  } catch (error) {
    console.error('创建订单失败:', error);
    await pool.query('ROLLBACK'); // 回滚事务
    res.status(500).json({ message: '服务器错误' });
  }
});



// 获取订单详情
router.get('/canteen/order/:id', authenticateToken, async (req, res) => {
  const orderId = req.params.id;
  const userId = req.user.id; // 获取用户ID

  // console.log(`Fetching details for orderId: ${orderId} for userId: ${userId}`); // 添加调试日志

  try {
    const [orderDetails] = await pool.query(
      `SELECT o.id, o.created_at, o.total_price, 
              u.email, o.status,           -- 添加用户邮箱和订单状态
              oi.menu_item_id, oi.quantity, oi.total_price AS item_total, 
              m.name AS menu_item_name, m.price AS menu_item_price 
       FROM orders o
       JOIN order_details oi ON o.id = oi.order_id
       JOIN menu_items m ON oi.menu_item_id = m.id
       JOIN users u ON o.user_id = u.id  -- 关联用户表
       WHERE o.id = ? AND o.user_id = ?`,
      [orderId, userId]
    );

    if (orderDetails.length === 0) {
      return res.status(404).json({ message: '订单未找到' });
    }

    // 格式化返回数据
    const formattedOrder = {
      id: orderDetails[0].id,
      email: orderDetails[0].email, // 添加用户邮箱
      status: orderDetails[0].status, // 添加订单状态
      created_at: orderDetails[0].created_at,
      total_price: orderDetails[0].total_price,
      details: orderDetails.map(item => ({
        menu_item: {
          id: item.menu_item_id,
          name: item.menu_item_name,
          price: item.menu_item_price
        },
        quantity: item.quantity,
        total_price: item.item_total // 使用 item.item_total
      }))
    };

    // console.log('formattedOrder:', formattedOrder); // 增加日志，详细查看返回的数据结构

    res.status(200).json(formattedOrder);
  } catch (error) {
    console.error('获取订单详情失败:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 获取用户所有订单
router.get('/orders/user', authenticateToken, async (req, res) => {
  const userId = req.user.id;
  try {
    const [orders] = await pool.query(
      'SELECT o.id, o.total_price, o.created_at FROM orders o WHERE o.user_id = ?',
      [userId]
    );

    if (orders.length === 0) {
      return res.status(404).json({ message: '没有找到订单' });
    }

    res.status(200).json(orders);
  } catch (error) {
    console.error('获取订单失败:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});


// 获取所有订单
router.get('/canteen/orders', authenticateToken, async (req, res) => {
  const userRole = req.user.role;

  if (userRole !== 'admin' && userRole !== 'super_admin') {
    return res.status(403).json({ message: '无权访问' });
  }

  try {
    const [orders] = await pool.query(
      `SELECT o.id, o.total_price, o.created_at, o.status, u.username, u.email,
              oi.menu_item_id, oi.quantity, oi.total_price AS item_total,
              m.name AS menu_item_name, m.price AS menu_item_price
       FROM orders o
       JOIN order_details oi ON o.id = oi.order_id
       JOIN menu_items m ON oi.menu_item_id = m.id
       JOIN users u ON o.user_id = u.id`
    );

    if (orders.length === 0) {
      return res.status(404).json({ message: '没有找到订单' });
    }

    // 格式化数据，使每个订单包含详细菜品信息
    const formattedOrders = [];
    const orderMap = new Map();

    for (const row of orders) {
      if (!orderMap.has(row.id)) {
        orderMap.set(row.id, {
          id: row.id,
          total_price: row.total_price,
          created_at: row.created_at,
          status: row.status,
          username: row.username,
          email: row.email,
          items: []
        });
        formattedOrders.push(orderMap.get(row.id));
      }

      orderMap.get(row.id).items.push({
        menu_item_id: row.menu_item_id,
        name: row.menu_item_name,
        price: row.menu_item_price,
        quantity: row.quantity,
        total: row.item_total
      });
    }

    // console.log('Formatted Orders:', JSON.stringify(formattedOrders, null, 2)); // 打印格式化后的订单数据

    res.status(200).json(formattedOrders);
  } catch (error) {
    console.error('获取订单失败:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 更新订单状态
router.put('/canteen/orders/:id', authenticateToken, async (req, res) => {
  const orderId = req.params.id;
  const { status } = req.body;
  const userRole = req.user.role;

  if (userRole !== 'admin' && userRole !== 'super_admin') {
    return res.status(403).json({ message: '无权访问' });
  }

  try {
    await pool.query('UPDATE orders SET status = ? WHERE id = ?', [status, orderId]);
    res.status(200).json({ message: '订单状态已更新' });
  } catch (error) {
    console.error('更新订单状态失败:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 删除订单
router.delete('/canteen/orders/:id', authenticateToken, async (req, res) => {
  const orderId = req.params.id;
  const userRole = req.user.role;

  if (userRole !== 'admin' && userRole !== 'super_admin') {
    return res.status(403).json({ message: '无权访问' });
  }

  try {
    await pool.query('DELETE FROM orders WHERE id = ?', [orderId]);
    res.status(200).json({ message: '订单已删除' });
  } catch (error) {
    console.error('删除订单失败:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});
module.exports = router;
