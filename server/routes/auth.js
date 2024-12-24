// routes/auth.js
const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');
const { pool } = require('../db');
const authenticateToken = require('../middleware/auth');
const rateLimit = require('express-rate-limit');

// 配置文件上传
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../uploads');
    // 确保上传目录存在
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

// 错误处理中间件
const uploadErrorHandler = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({ message: '文件大小超过限制（最大50MB）' });
    }
  }
  next(err);
};

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB
    files: 1 // 一次只允许上传一个文件
  },
  fileFilter: function (req, file, cb) {
    const allowedTypes = /jpeg|jpg|png/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) {
      cb(null, true);
    } else {
      cb(new Error('只允许上传图片文件!'));
    }
  }
});

// 图片压缩中间件
const compressImage = async (req, res, next) => {
  if (!req.file) {
    return next();
  }

  try {
    const filePath = req.file.path;
    const compressedFilePath = path.join(
      path.dirname(filePath),
      'compressed-' + path.basename(filePath)
    );

    await sharp(filePath)
      .resize(1000, 1000, {
        fit: 'inside',
        withoutEnlargement: true
      })
      .jpeg({
        quality: 80,
        progressive: true
      })
      .toFile(compressedFilePath);

    // 删除原始文件
    fs.unlinkSync(filePath);
    // 将压缩后的文件移动到原始文件位置
    fs.renameSync(compressedFilePath, filePath);
    
    next();
  } catch (error) {
    console.error('图片压缩失败:', error);
    next(error);
  }
};

// 登录频率限制
const loginLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 15分钟
  max: 5, // 限制5次尝试
  message: { message: '尝试次数过多，请15分钟后再试' }
});

// 邮箱验证函数
const validateEmail = (email) => {
  const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
  return emailRegex.test(email);
};

// 验证管理员权限的中间件
const verifyAdmin = async (req, res, next) => {
  try {
    // 验证用户角色
    const [rows] = await pool.query('SELECT role FROM users WHERE id = ?', [req.user.id]);
    
    if (rows.length === 0) {
      return res.status(404).json({ message: '用户不存在' });
    }

    const userRole = rows[0].role;
    if (userRole !== 'admin' && userRole !== 'super_admin') {
      return res.status(403).json({ message: '权限不足，需要管理员权限' });
    }

    req.userRole = userRole; // 将数据库中的角色存储到请求对象中
    next();
  } catch (error) {
    console.error('验证管理员权限失败:', error);
    res.status(500).json({ message: '服务器错误' });
  }
};

// 用户注册
router.post('/register', async (req, res) => {
  const { username, email, password } = req.body;
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    // 验证输入
    if (!username || !email || !password) {
      throw new Error('请提供完整的注册信息');
    }

    // 验证邮箱格式
    if (!validateEmail(email)) {
      throw new Error('邮箱格式不正确');
    }

    // 检查用户名是否已存在
    const [existingUsername] = await connection.query(
      'SELECT id FROM users WHERE username = ?',
      [username]
    );
    if (existingUsername.length > 0) {
      throw new Error('用户名已被使用');
    }

    // 检查邮箱是否已存在
    const [existingEmail] = await connection.query(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );
    if (existingEmail.length > 0) {
      throw new Error('邮箱已被注册');
    }

    // 加密密码
    const hashedPassword = await bcrypt.hash(password, 10);

    // 插入新用户
    const [result] = await connection.query(
      `INSERT INTO users (username, email, password, role) 
       VALUES (?, ?, ?, 'user')`,
      [username, email, hashedPassword]
    );

    await connection.commit();

    // 生成JWT令牌
    const token = jwt.sign(
      { 
        id: result.insertId,
        username,
        email,
        role: 'user'
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      message: '注册成功',
      user: {
        id: result.insertId,
        username,
        email,
        role: 'user'
      },
      token
    });

  } catch (error) {
    await connection.rollback();
    console.error('用户注册失败:', error);
    res.status(400).json({ message: error.message || '注册失败' });
  } finally {
    connection.release();
  }
});

// 用户登录
router.post('/login', loginLimiter, async (req, res) => {
  const { email, password } = req.body;
  const connection = await pool.getConnection();

  try {
    // 验证输入
    if (!email || !password) {
      throw new Error('请提供邮箱和密码');
    }

    // 验证邮箱格式
    if (!validateEmail(email)) {
      throw new Error('邮箱格式不正确');
    }

    // 查找用户
    const [users] = await connection.query(
      'SELECT id, username, email, password, role FROM users WHERE email = ?',
      [email]
    );

    if (users.length === 0) {
      throw new Error('邮箱或密码错误');
    }

    const user = users[0];

    // 验证密码
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      throw new Error('邮箱或密码错误');
    }

    // 生成JWT令牌
    const token = jwt.sign(
      { 
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      message: '登录成功',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role
      },
      token
    });

  } catch (error) {
    console.error('用户登录失败:', error);
    res.status(401).json({ message: error.message || '登录失败' });
  } finally {
    connection.release();
  }
});

// 获取当前用户信息
router.get('/me', authenticateToken, async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const [users] = await connection.query(
      'SELECT id, username, email, role FROM users WHERE id = ?',
      [req.user.id]
    );

    if (users.length === 0) {
      return res.status(404).json({ message: '用户不存在' });
    }

    res.json(users[0]);
  } catch (error) {
    console.error('获取用户信息失败:', error);
    res.status(500).json({ message: '获取用户信息失败' });
  } finally {
    connection.release();
  }
});

// 更新用户信息
router.put('/me', authenticateToken, async (req, res) => {
  const { username, email, currentPassword, newPassword } = req.body;
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    // 获取当前用户信息
    const [user] = await connection.query(
      'SELECT password FROM users WHERE id = ? FOR UPDATE',
      [req.user.id]
    );

    if (user.length === 0) {
      throw new Error('用户不存在');
    }

    let updates = [];
    let values = [];

    // 更新用户名
    if (username) {
      // 检查用户名是否已被使用
      const [existingUsername] = await connection.query(
        'SELECT id FROM users WHERE username = ? AND id != ?',
        [username, req.user.id]
      );
      if (existingUsername.length > 0) {
        throw new Error('用户名已被使用');
      }
      updates.push('username = ?');
      values.push(username);
    }

    // 更新邮箱
    if (email) {
      // 验证邮箱格式
      if (!validateEmail(email)) {
        throw new Error('邮箱格式不正确');
      }
      // 检查邮箱是否已被使用
      const [existingEmail] = await connection.query(
        'SELECT id FROM users WHERE email = ? AND id != ?',
        [email, req.user.id]
      );
      if (existingEmail.length > 0) {
        throw new Error('邮箱已被注册');
      }
      updates.push('email = ?');
      values.push(email);
    }

    // 更新密码
    if (currentPassword && newPassword) {
      // 验证当前密码
      const validPassword = await bcrypt.compare(currentPassword, user[0].password);
      if (!validPassword) {
        throw new Error('当前密码错误');
      }

      // 加密新密码
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      updates.push('password = ?');
      values.push(hashedPassword);
    }

    if (updates.length > 0) {
      // 更新用户信息
      updates.push('updated_at = CURRENT_TIMESTAMP');
      const updateQuery = `UPDATE users SET ${updates.join(', ')} WHERE id = ?`;
      await connection.query(updateQuery, [...values, req.user.id]);

      await connection.commit();

      // 获取更新后的用户信息
      const [updatedUser] = await connection.query(
        'SELECT id, username, email, role FROM users WHERE id = ?',
        [req.user.id]
      );

      // 生成新的JWT令牌
      const token = jwt.sign(
        {
          id: updatedUser[0].id,
          username: updatedUser[0].username,
          email: updatedUser[0].email,
          role: updatedUser[0].role
        },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );

      res.status(200).json({
        message: '用户信息更新成功',
        user: updatedUser[0],
        token
      });
    } else {
      res.status(400).json({ message: '没有提供要更新的信息' });
    }

  } catch (error) {
    await connection.rollback();
    console.error('更新用户信息失败:', error);
    res.status(400).json({ message: error.message || '更新失败' });
  } finally {
    connection.release();
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

// 删除用户或管理员
router.delete('/users/:id', async (req, res) => {
  const userId = req.params.id;

  try {
    await pool.query('DELETE FROM users WHERE id = ?', [userId]);
    res.status(200).json({ message: '用户已删除' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 获取用户列表
router.get('/users', authenticateToken, verifyAdmin, async (req, res) => {
  try {
    // 分页参数
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    // 搜索参数
    const search = req.query.search || '';
    const role = req.query.role || 'user';

    // 构建查询条件
    let whereClause = 'WHERE role = ?';
    let queryParams = [role];

    if (search) {
      whereClause += ' AND (username LIKE ? OR email LIKE ?)';
      queryParams.push(`%${search}%`, `%${search}%`);
    }

    // 获取总用户数
    const [countResult] = await pool.query(
      `SELECT COUNT(*) as total FROM users ${whereClause}`,
      queryParams
    );
    const totalUsers = countResult[0].total;

    // 获取分页后的用户列表
    const [users] = await pool.query(
      `SELECT id, username, email, role FROM users ${whereClause} 
       ORDER BY id DESC 
       LIMIT ? OFFSET ?`,
      [...queryParams, limit, offset]
    );

    // 格式化用户数据
    const formattedUsers = users.map(user => ({
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role
    }));

    res.status(200).json({
      users: formattedUsers,
      pagination: {
        current_page: page,
        total_pages: Math.ceil(totalUsers / limit),
        total_users: totalUsers,
        per_page: limit
      }
    });
  } catch (error) {
    console.error('获取用户列表失败:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 获取管理员列表
router.get('/admins', authenticateToken, verifyAdmin, async (req, res) => {
  try {
    // 只允许超级管理员查看管理员列表
    if (req.userRole !== 'super_admin') {
      return res.status(403).json({ message: '权限不足' });
    }

    // 分页参数
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    // 搜索参数
    const search = req.query.search || '';

    // 构建查询条件
    let whereClause = "WHERE role = 'admin'";
    let queryParams = [];

    if (search) {
      whereClause += ' AND (username LIKE ? OR email LIKE ?)';
      queryParams.push(`%${search}%`, `%${search}%`);
    }

    // 获取总管理员数
    const [countResult] = await pool.query(
      `SELECT COUNT(*) as total FROM users ${whereClause}`,
      queryParams
    );
    const totalAdmins = countResult[0].total;

    // 获取分页后的管理员列表
    const [admins] = await pool.query(
      `SELECT id, username, email FROM users ${whereClause}
       ORDER BY id DESC 
       LIMIT ? OFFSET ?`,
      [...queryParams, limit, offset]
    );

    res.status(200).json({
      admins: admins.map(admin => ({
        id: admin.id,
        username: admin.username,
        email: admin.email
      })),
      pagination: {
        current_page: page,
        total_pages: Math.ceil(totalAdmins / limit),
        total_admins: totalAdmins,
        per_page: limit
      }
    });
  } catch (error) {
    console.error('获取管理员列表失败:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 升级用户为管理员
router.post('/promote/:id', authenticateToken, verifyAdmin, async (req, res) => {
  const userId = req.params.id;
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    // 只允许超级管理员进行角色升级
    if (req.userRole !== 'super_admin') {
      throw new Error('权限不足');
    }
    // 检查要升级的用户是否存在
    const [user] = await connection.query(
      'SELECT role FROM users WHERE id = ? FOR UPDATE',
      [userId]
    );
    if (user.length === 0) {
      throw new Error('用户不存在');
    }
    // 检查用户当前角色
    if (user[0].role !== 'user') {
      throw new Error('只能升级普通用户为管理员');
    }
    // 更新用户角色
    await connection.query(
      'UPDATE users SET role = "admin" WHERE id = ?',
      [userId]
    );
    await connection.commit();
    // 记录到系统日志
    console.log(`用户角色变更: ID ${userId} 从 user 升级为 admin, 操作者 ID: ${req.user.id}`);
    res.status(200).json({ 
      message: '用户已成功升级为管理员',
      user_id: userId
    });
  } catch (error) {
    await connection.rollback();
    console.error('升级用户角色失败:', error);
    res.status(error.message === '权限不足' ? 403 : 500)
      .json({ message: error.message || '服务器错误' });
  } finally {
    connection.release();
  }
});

// 降级管理员为普通用户
router.post('/demote/:id', authenticateToken, verifyAdmin, async (req, res) => {
  const userId = req.params.id;
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    // 只允许超级管理员进行角色降级
    if (req.userRole !== 'super_admin') {
      throw new Error('权限不足');
    }
    // 检查要降级的用户是否存在
    const [user] = await connection.query(
      'SELECT role FROM users WHERE id = ? FOR UPDATE',
      [userId]
    );
    if (user.length === 0) {
      throw new Error('用户不存在');
    }
    // 检查用户当前角色
    if (user[0].role !== 'admin') {
      throw new Error('只能降级管理员为普通用户');
    }
    // 更新用户角色
    await connection.query(
      'UPDATE users SET role = "user" WHERE id = ?',
      [userId]
    );
    await connection.commit();
    // 记录到系统日志
    console.log(`用户角色变更: ID ${userId} 从 admin 降级为 user, 操作者 ID: ${req.user.id}`);
    res.status(200).json({ 
      message: '管理员已成功降级为普通用户',
      user_id: userId
    });
  } catch (error) {
    await connection.rollback();
    console.error('降级用户角色失败:', error);
    res.status(error.message === '权限不足' ? 403 : 500)
      .json({ message: error.message || '服务器错误' });
  } finally {
    connection.release();
  }
});

// 删除用户
router.delete('/users/:id', authenticateToken, verifyAdmin, async (req, res) => {
  const userId = req.params.id;

  try {
    // 检查要删除的用户是否存在
    const [user] = await pool.query('SELECT role FROM users WHERE id = ?', [userId]);
    if (user.length === 0) {
      return res.status(404).json({ message: '用户不存在' });
    }

    // 防止删除超级管理员
    if (user[0].role === 'super_admin') {
      return res.status(403).json({ message: '不能删除超级管理员账户' });
    }

    // 如果是管理员，禁止删除其他管理员
    if (req.userRole === 'admin' && user[0].role === 'admin') {
      return res.status(403).json({ message: '管理员不能删除其他管理员账户' });
    }

    // 删除用户
    await pool.query('DELETE FROM users WHERE id = ?', [userId]);

    // 记录到系统日志
    console.log(`用户删除: ID ${userId} 被删除, 操作者 ID: ${req.user.id}`);

    res.status(200).json({ message: '用户已成功删除' });
  } catch (error) {
    console.error('删除用户失败:', error);
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
    console.error('获取新闻详情失败:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 发布文章
router.post('/articles', authenticateToken, verifyAdmin, upload.single('image'), compressImage, async (req, res) => {
  const { title, content, category, image_url } = req.body;
  const uploadedImageUrl = req.file ? `/uploads/${req.file.filename}` : image_url;

  if (category === 'carousel' && !uploadedImageUrl) {
    return res.status(400).json({ message: '轮播图必须有图片' });
  }

  try {
    await pool.query('INSERT INTO articles (title, content, image_url, category) VALUES (?, ?, ?, ?)',
      [title, content, uploadedImageUrl, category]);
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
    console.error('获取文章详情失败:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 修改文章
router.put('/articles/:id', authenticateToken, verifyAdmin, upload.single('image'), compressImage, async (req, res) => {
  const articleId = req.params.id;
  const { title, content, category, image_url } = req.body;

  try {
    console.log('当前用户信息:', req.user);
    // 检查用户权限
    if (req.userRole !== 'admin' && req.userRole !== 'super_admin') {
      console.log('权限检查失败 - 用户角色:', req.userRole);
      return res.status(403).json({ message: '权限不足，只有管理员可以修改文章' });
    }
    console.log('权限检查通过');

    // 检查文章是否存在
    const [existingArticle] = await pool.query('SELECT * FROM articles WHERE id = ?', [articleId]);
    if (existingArticle.length === 0) {
      return res.status(404).json({ message: '文章未找到' });
    }

    // 验证必填字段
    if (!title || !content || !category) {
      return res.status(400).json({ message: '标题、内容和分类都是必填项' });
    }

    // 处理图片
    let finalImageUrl = existingArticle[0].image_url; // 默认保持原有图片
    if (req.file) {
      // 如果上传了新图片
      finalImageUrl = `/uploads/${req.file.filename}`;
      
      // 删除旧图片
      if (existingArticle[0].image_url) {
        const oldImagePath = path.join(__dirname, '../uploads', path.basename(existingArticle[0].image_url));
        if (fs.existsSync(oldImagePath)) {
          fs.unlink(oldImagePath, (err) => {
            if (err) {
              console.error('删除旧图片失败:', err);
            }
          });
        }
      }
    } else if (image_url) {
      // 如果提供了新的图片URL但没有上传文件
      finalImageUrl = image_url;
    }

    // 如果是轮播图类别，确保有图片
    if (category === 'carousel' && !finalImageUrl) {
      return res.status(400).json({ message: '轮播图文章必须包含图片' });
    }

    // 更新文章
    const [result] = await pool.query(
      `UPDATE articles 
       SET title = ?, 
           content = ?, 
           category = ?, 
           image_url = ?, 
           updated_at = CURRENT_TIMESTAMP 
       WHERE id = ?`,
      [title, content, category, finalImageUrl, articleId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: '文章更新失败' });
    }

    // 获取更新后的文章信息
    const [updatedArticle] = await pool.query('SELECT * FROM articles WHERE id = ?', [articleId]);

    res.status(200).json({
      message: '文章更新成功',
      article: updatedArticle[0]
    });

  } catch (error) {
    console.error('修改文章失败:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 删除文章
router.delete('/articles/:id', authenticateToken, verifyAdmin, async (req, res) => {
  const articleId = req.params.id;
  try {
    // 检查用户权限
    if (req.userRole !== 'admin' && req.userRole !== 'super_admin') {
      return res.status(403).json({ message: '权限不足，只有管理员可以删除文章' });
    }

    // 首先查找文章以获取图片路径
    const [rows] = await pool.query('SELECT image_url FROM articles WHERE id = ?', [articleId]);
    if (rows.length === 0) {
      return res.status(404).json({ message: '文章未找到' });
    }

    // 获取图片文件名
    const imageUrl = rows[0].image_url;
    if (imageUrl) {
      const imagePath = path.join(__dirname, '../uploads', path.basename(imageUrl)); // 确保路径正确
      if (fs.existsSync(imagePath)) {
        fs.unlink(imagePath, (err) => {
          if (err) {
            console.error('删除图片失败:', err);
          } else {
            console.log('图片删除成功');
          }
        });
      }
    }

    // 删除文章
    const [result] = await pool.query('DELETE FROM articles WHERE id = ?', [articleId]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: '文章未找到' });
    }
    res.status(200).json({ message: '文章删除成功' });
  } catch (error) {
    console.error('删除文章失败:', error);
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
router.post('/canteen/menu', authenticateToken, verifyAdmin, upload.single('image'), compressImage, async (req, res) => {
  const { name, price, image_url, description } = req.body;
  const uploadedImageUrl = req.file ? `/uploads/${req.file.filename}` : image_url;

  try {
    await pool.query('INSERT INTO menu_items (name, price, image_url, description) VALUES (?, ?, ?, ?)',
      [name, price, uploadedImageUrl, description]);
    res.status(201).json({ message: '菜品添加成功' });
  } catch (error) {
    console.error('添加菜品失败:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 更新菜品
router.put('/canteen/menu/:id', authenticateToken, verifyAdmin, upload.single('image'), compressImage, async (req, res) => {
  const menuItemId = req.params.id;
  const { name, price, image_url, description } = req.body;

  try {
    // 检查菜品是否存在
    const [existingItem] = await pool.query('SELECT * FROM menu_items WHERE id = ?', [menuItemId]);
    if (existingItem.length === 0) {
      return res.status(404).json({ message: '菜品未找到' });
    }

    // 验证必填字段
    if (!name || !price) {
      return res.status(400).json({ message: '菜品名称和价格是必填项' });
    }

    // 验证价格格式
    if (isNaN(parseFloat(price)) || parseFloat(price) <= 0) {
      return res.status(400).json({ message: '价格必须是大于0的数字' });
    }

    // 处理图片
    let finalImageUrl = existingItem[0].image_url; // 默认保持原有图片
    if (req.file) {
      // 如果上传了新图片
      finalImageUrl = `/uploads/${req.file.filename}`;
      
      // 删除旧图片
      if (existingItem[0].image_url) {
        const oldImagePath = path.join(__dirname, '../uploads', path.basename(existingItem[0].image_url));
        if (fs.existsSync(oldImagePath)) {
          fs.unlink(oldImagePath, (err) => {
            if (err) {
              console.error('删除旧图片失败:', err);
            }
          });
        }
      }
    } else if (image_url) {
      // 如果提供了新的图片URL但没有上传文件
      finalImageUrl = image_url;
    }

    // 更新菜品信息
    const [result] = await pool.query(
      `UPDATE menu_items 
       SET name = ?, 
           price = ?, 
           image_url = ?, 
           description = ?,
           updated_at = CURRENT_TIMESTAMP 
       WHERE id = ?`,
      [name, parseFloat(price), finalImageUrl, description || '', menuItemId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: '菜品更新失败' });
    }

    // 获取更新后的菜品信息
    const [updatedItem] = await pool.query('SELECT * FROM menu_items WHERE id = ?', [menuItemId]);

    res.status(200).json({
      message: '菜品更新成功',
      menuItem: updatedItem[0]
    });

  } catch (error) {
    console.error('更新菜品失败:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 删除菜品
router.delete('/canteen/menu/:id', authenticateToken, verifyAdmin, async (req, res) => {
  const menuItemId = req.params.id;

  try {
    // 检查菜品是否存在
    const [existingItem] = await pool.query('SELECT * FROM menu_items WHERE id = ?', [menuItemId]);
    if (existingItem.length === 0) {
      return res.status(404).json({ message: '菜品未找到' });
    }

    // 检查是否有相关订单
    const [orderDetails] = await pool.query(
      'SELECT COUNT(*) as count FROM order_details WHERE menu_item_id = ?',
      [menuItemId]
    );

    if (orderDetails[0].count > 0) {
      // 如果有相关订单，将菜品标记为不可用而不是删除
      await pool.query('UPDATE menu_items SET available = FALSE WHERE id = ?', [menuItemId]);
      return res.status(200).json({ message: '菜品已标记为不可用' });
    }

    // 删除菜品图片
    if (existingItem[0].image_url) {
      const imagePath = path.join(__dirname, '../uploads', path.basename(existingItem[0].image_url));
      if (fs.existsSync(imagePath)) {
        fs.unlink(imagePath, (err) => {
          if (err) {
            console.error('删除图片失败:', err);
          }
        });
      }
    }

    // 删除菜品记录
    await pool.query('DELETE FROM menu_items WHERE id = ?', [menuItemId]);
    res.status(200).json({ message: '菜品已成功删除' });

  } catch (error) {
    console.error('删除菜品失败:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 添加订单
router.post('/canteen/order', authenticateToken, async (req, res) => {
  const { items } = req.body;
  const userId = req.user.id;

  // 输入验证
  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ message: '订单必须包含至少一个菜品' });
  }

  // 验证每个菜品的数据格式
  for (const item of items) {
    if (!item.menuItemId || !item.quantity || item.quantity <= 0) {
      return res.status(400).json({ message: '菜品数据格式不正确' });
    }
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // 检查所有菜品是否存在且可用
    const menuItemIds = items.map(item => item.menuItemId);
    const [menuItems] = await connection.query(
      'SELECT id, price, available FROM menu_items WHERE id IN (?)',
      [menuItemIds]
    );

    const menuItemMap = new Map(menuItems.map(item => [item.id, item]));
    
    // 验证所有菜品是否可用
    for (const item of items) {
      const menuItem = menuItemMap.get(item.menuItemId);
      if (!menuItem) {
        throw new Error(`菜品ID ${item.menuItemId} 不存在`);
      }
      if (!menuItem.available) {
        throw new Error(`菜品ID ${item.menuItemId} 当前不可用`);
      }
    }

    // 计算总价
    let totalPrice = 0;
    const orderDetails = items.map(item => {
      const menuItem = menuItemMap.get(item.menuItemId);
      const itemTotal = menuItem.price * item.quantity;
      totalPrice += itemTotal;
      return {
        menuItemId: item.menuItemId,
        quantity: item.quantity,
        price: menuItem.price,
        totalPrice: itemTotal
      };
    });

    // 创建订单
    const [orderResult] = await connection.query(
      'INSERT INTO orders (user_id, total_price, status) VALUES (?, ?, ?)',
      [userId, totalPrice, 0] // 0: pending
    );
    const orderId = orderResult.insertId;

    // 添加订单详情
    for (const detail of orderDetails) {
      await connection.query(
        'INSERT INTO order_details (order_id, menu_item_id, quantity, price, total_price) VALUES (?, ?, ?, ?, ?)',
        [orderId, detail.menuItemId, detail.quantity, detail.price, detail.totalPrice]
      );
    }

    await connection.commit();

    res.status(201).json({
      message: '订单创建成功',
      orderId,
      totalPrice,
      details: orderDetails
    });

  } catch (error) {
    await connection.rollback();
    console.error('创建订单失败:', error);
    res.status(error.message.includes('不存在') || error.message.includes('不可用') 
      ? 400 
      : 500
    ).json({ message: error.message || '服务器错误' });
  } finally {
    connection.release();
  }
});

// 获取订单详情
router.get('/canteen/order/:id', authenticateToken, async (req, res) => {
  const orderId = req.params.id;
  const userId = req.user.id;
  const userRole = req.user.role;

  try {
    // 构建查询SQL，管理员可以查看所有订单，普通用户只能查看自己的订单
    const orderQuery = `
      SELECT o.id, o.total_price, o.status,
             u.email, u.username,
             oi.menu_item_id, oi.quantity, oi.price, oi.total_price AS item_total,
             m.name AS menu_item_name, m.price AS menu_item_price,
             m.image_url AS menu_item_image
      FROM orders o
      JOIN users u ON o.user_id = u.id
      JOIN order_details oi ON o.id = oi.order_id
      JOIN menu_items m ON oi.menu_item_id = m.id
      WHERE o.id = ? ${userRole !== 'admin' && userRole !== 'super_admin' ? 'AND o.user_id = ?' : ''}
    `;

    const queryParams = userRole === 'admin' || userRole === 'super_admin' 
      ? [orderId] 
      : [orderId, userId];

    const [orderDetails] = await pool.query(orderQuery, queryParams);

    if (orderDetails.length === 0) {
      return res.status(404).json({ message: '订单未找到' });
    }

    // 格式化订单数据
    const formattedOrder = {
      id: orderDetails[0].id,
      status: orderDetails[0].status,
      total_price: orderDetails[0].total_price,
      user: {
        email: orderDetails[0].email,
        username: orderDetails[0].username
      },
      items: orderDetails.map(item => ({
        id: item.menu_item_id,
        name: item.menu_item_name,
        price: item.menu_item_price,
        image_url: item.menu_item_image,
        quantity: item.quantity,
        total_price: item.item_total
      }))
    };

    res.status(200).json(formattedOrder);
  } catch (error) {
    console.error('获取订单详情失败:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 获取用户订单列表
router.get('/orders/user', authenticateToken, async (req, res) => {
  const userId = req.user.id;
  const { page = 1, limit = 10, status } = req.query;
  const offset = (page - 1) * limit;

  try {
    let query = `
      SELECT o.id, o.total_price, o.status
      FROM orders o
      WHERE o.user_id = ?
    `;
    const queryParams = [userId];

    if (status) {
      query += ' AND o.status = ?';
      queryParams.push(status);
    }

    query += ' ORDER BY o.id DESC LIMIT ? OFFSET ?';
    queryParams.push(parseInt(limit), offset);

    const [orders] = await pool.query(query, queryParams);

    // 获取总订单数
    const [totalCount] = await pool.query(
      `SELECT COUNT(*) as total FROM orders WHERE user_id = ? ${status ? 'AND status = ?' : ''}`,
      status ? [userId, status] : [userId]
    );

    res.status(200).json({
      orders,
      pagination: {
        total: totalCount[0].total,
        current_page: parseInt(page),
        per_page: parseInt(limit),
        total_pages: Math.ceil(totalCount[0].total / limit)
      }
    });
  } catch (error) {
    console.error('获取用户订单列表失败:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 获取所有订单（管理员接口）
router.get('/canteen/orders', authenticateToken, verifyAdmin, async (req, res) => {
  const userRole = req.userRole;
  const { page = 1, limit = 10, status, startDate, endDate } = req.query;
  const offset = (page - 1) * limit;

  if (userRole !== 'admin' && userRole !== 'super_admin') {
    return res.status(403).json({ message: '无权访问' });
  }

  try {
    let query = `
      SELECT o.id, o.total_price, o.status, o.created_at,
             u.username, u.email,
             oi.menu_item_id, oi.quantity, oi.price as item_price,
             mi.name as item_name
      FROM orders o
      JOIN users u ON o.user_id = u.id
      LEFT JOIN order_details oi ON o.id = oi.order_id
      LEFT JOIN menu_items mi ON oi.menu_item_id = mi.id
      WHERE 1=1
    `;
    const queryParams = [];

    if (status) {
      query += ' AND o.status = ?';
      queryParams.push(status);
    }

    if (startDate) {
      query += ' AND o.created_at >= ?';
      queryParams.push(startDate);
    }

    if (endDate) {
      query += ' AND o.created_at <= ?';
      queryParams.push(endDate);
    }

    query += ' ORDER BY o.id DESC';
    
    const [rawOrders] = await pool.query(query, queryParams);
    
    // 重组数据结构
    const ordersMap = new Map();
    rawOrders.forEach(row => {
      if (!ordersMap.has(row.id)) {
        ordersMap.set(row.id, {
          id: row.id,
          total_price: row.total_price,
          status: row.status,
          created_at: row.created_at,
          username: row.username,
          email: row.email,
          items: []
        });
      }
      
      if (row.menu_item_id) {
        const order = ordersMap.get(row.id);
        order.items.push({
          menu_item_id: row.menu_item_id,
          name: row.item_name,
          quantity: row.quantity,
          price: row.item_price
        });
      }
    });

    // 转换为数组并分页
    const allOrders = Array.from(ordersMap.values());
    const startIndex = offset;
    const endIndex = startIndex + parseInt(limit);
    const paginatedOrders = allOrders.slice(startIndex, endIndex);

    // 获取总订单数
    const total = allOrders.length;

    res.status(200).json({
      orders: paginatedOrders,
      pagination: {
        total,
        current_page: parseInt(page),
        per_page: parseInt(limit),
        total_pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('获取订单列表失败:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 更新订单状态
router.put('/canteen/orders/:id', authenticateToken, verifyAdmin, async (req, res) => {
  const orderId = req.params.id;
  const { status } = req.body;
  const userRole = req.userRole;

  if (userRole !== 'admin' && userRole !== 'super_admin') {
    return res.status(403).json({ message: '无权访问' });
  }

  // 验证状态值
  const validStatuses = [0, 1, 2, 3];  // 0: pending, 1: confirmed, 2: completed, 3: cancelled
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ 
      message: '无效的状态值',
      valid_statuses: validStatuses
    });
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // 检查订单是否存在
    const [orderExists] = await connection.query(
      'SELECT status FROM orders WHERE id = ?',
      [orderId]
    );

    if (orderExists.length === 0) {
      throw new Error('订单不存在');
    }

    // 检查状态转换是否有效
    const currentStatus = orderExists[0].status;
    if (currentStatus === 2 || currentStatus === 3) {
      throw new Error(`无法更新${currentStatus}状态的订单`);
    }

    // 更新订单状态
    await connection.query(
      'UPDATE orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [status, orderId]
    );

    await connection.commit();

    res.status(200).json({ 
      message: '订单状态已更新',
      order_id: orderId,
      new_status: status
    });

  } catch (error) {
    await connection.rollback();
    console.error('更新订单状态失败:', error);
    res.status(error.message.includes('订单不存在') ? 404 : 400)
      .json({ message: error.message });
  } finally {
    connection.release();
  }
});

// 删除订单
router.delete('/canteen/orders/:id', authenticateToken, verifyAdmin, async (req, res) => {
  const orderId = req.params.id;
  const userRole = req.userRole;

  if (userRole !== 'admin' && userRole !== 'super_admin') {
    return res.status(403).json({ message: '无权访问' });
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // 检查订单是否存在
    const [orderExists] = await connection.query(
      'SELECT id FROM orders WHERE id = ?',
      [orderId]
    );

    if (orderExists.length === 0) {
      throw new Error('订单不存在');
    }

    // 删除订单详情
    await connection.query('DELETE FROM order_details WHERE order_id = ?', [orderId]);
    
    // 删除订单
    await connection.query('DELETE FROM orders WHERE id = ?', [orderId]);

    await connection.commit();
    
    res.status(200).json({ 
      message: '订单已删除',
      order_id: orderId
    });

  } catch (error) {
    await connection.rollback();
    console.error('删除订单失败:', error);
    res.status(error.message.includes('订单不存在') ? 404 : 500)
      .json({ message: error.message || '服务器错误' });
  } finally {
    connection.release();
  }
});

// 验证token和用户角色
router.get('/verify', authenticateToken, async (req, res) => {
  const connection = await pool.getConnection();
  try {
    // 获取存储在token中的用户ID和角色
    const tokenUserId = req.user.id;
    const tokenRole = req.user.role;

    // 从数据库获取最新的用户信息
    const [rows] = await connection.execute(
      'SELECT id, role FROM users WHERE id = ?',
      [tokenUserId]
    );

    if (rows.length === 0) {
      return res.json({ 
        valid: false,
        message: '用户不存在'
      });
    }

    const dbUser = rows[0];
    
    // 验证角色是否匹配
    if (tokenRole !== dbUser.role) {
      return res.json({
        valid: false,
        message: '角色不匹配',
        correctRole: dbUser.role
      });
    }

    // 验证通过
    return res.json({
      valid: true,
      role: dbUser.role
    });

  } catch (error) {
    console.error('验证失败:', error);
    res.status(500).json({ 
      valid: false,
      message: '服务器错误'
    });
  } finally {
    connection.release();
  }
});

module.exports = router;
