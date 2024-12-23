const express = require('express');
const router = express.Router();
const { pool } = require('../db');
const authenticateToken = require('../middleware/auth');

// 验证管理员权限的中间件
const verifyAdmin = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const [rows] = await pool.query('SELECT role FROM users WHERE id = ?', [userId]);
    
    if (rows.length === 0) {
      return res.status(404).json({ message: '用户不存在' });
    }

    const userRole = rows[0].role;
    if (userRole !== 'admin' && userRole !== 'super_admin') {
      return res.status(403).json({ message: '权限不足' });
    }

    req.userRole = userRole; // 将数据库中的角色存储到请求对象中
    next();
  } catch (error) {
    console.error('验证管理员权限失败:', error);
    res.status(500).json({ message: '服务器错误' });
  }
};

// 获取所有用户列表
router.get('/users', authenticateToken, async (req, res) => {
  try {
    // 验证管理员权限
    const [adminCheck] = await pool.query(
      'SELECT role FROM users WHERE id = ?',
      [req.user.id]
    );

    if (!adminCheck.length || (adminCheck[0].role !== 'admin' && adminCheck[0].role !== 'super_admin')) {
      return res.status(403).json({ message: '权限不足' });
    }

    const [users] = await pool.query(`
      SELECT DISTINCT u.id, u.username
      FROM users u
      JOIN feedback f ON u.id = f.user_id
      ORDER BY u.username
    `);
    res.status(200).json(users);
  } catch (error) {
    console.error('获取用户列表失败:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 获取指定用户的留言（用于聊天记录）
router.get('/feedback/:userId', authenticateToken, async (req, res) => {
  const userId = req.params.userId;
  
  try {
    // 验证管理员权限
    const [adminCheck] = await pool.query(
      'SELECT role FROM users WHERE id = ?',
      [req.user.id]
    );

    if (!adminCheck.length || (adminCheck[0].role !== 'admin' && adminCheck[0].role !== 'super_admin')) {
      return res.status(403).json({ message: '权限不足' });
    }

    const [messages] = await pool.query(`
      SELECT f.id, f.user_id, f.message, f.admin_reply, f.status, f.created_at, f.updated_at
      FROM feedback f
      WHERE f.user_id = ?
      ORDER BY f.created_at DESC
    `, [userId]);
    res.status(200).json(messages);
  } catch (error) {
    console.error('获取用户留言失败:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 提交留言或建议
router.post('/feedback', authenticateToken, async (req, res) => {
  const { message } = req.body;
  const userId = req.user.id;
  
  if (!message) {
    return res.status(400).json({ message: '留言内容不能为空' });
  }
  
  try {
    // 插入留言到数据库
    await pool.query('INSERT INTO feedback (user_id, message, status, created_at) VALUES (?, ?, "pending", NOW())', 
      [userId, message]);
    res.status(201).json({ message: '留言提交成功' });
  } catch (error) {
    console.error('留言提交失败:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 获取指定用户的留言和回复（用户查看自己的留言）
router.get('/feedbacks', authenticateToken, async (req, res) => {
  const userId = req.user.id;
  
  try {
    const [feedbacks] = await pool.query(`
      SELECT f.id, u.username, f.message, f.admin_reply, f.status, f.created_at, f.updated_at
      FROM feedback f
      JOIN users u ON f.user_id = u.id
      WHERE f.user_id = ?
      ORDER BY f.created_at DESC
    `, [userId]);
    
    res.status(200).json({ feedbacks });
  } catch (error) {
    console.error('获取留言失败:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 获取所有留言（管理员查看）
router.get('/feedback', authenticateToken, async (req, res) => {
  try {
    // 验证管理员权限
    const [adminCheck] = await pool.query(
      'SELECT role FROM users WHERE id = ?',
      [req.user.id]
    );

    if (!adminCheck.length || (adminCheck[0].role !== 'admin' && adminCheck[0].role !== 'super_admin')) {
      return res.status(403).json({ message: '权限不足' });
    }

    const [feedbacks] = await pool.query(`
      SELECT f.id, u.username, f.message, f.admin_reply, f.status, f.created_at, f.updated_at, f.user_id
      FROM feedback f
      JOIN users u ON f.user_id = u.id
      ORDER BY f.created_at DESC
    `);
    res.status(200).json(feedbacks);
  } catch (error) {
    console.error('获取留言失败:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 更新留言状态（管理员处理）
router.put('/feedback/:id', authenticateToken, async (req, res) => {
  const feedbackId = req.params.id;
  const { status } = req.body;
  
  try {
    // 验证管理员权限
    const [adminCheck] = await pool.query(
      'SELECT role FROM users WHERE id = ?',
      [req.user.id]
    );

    if (!adminCheck.length || (adminCheck[0].role !== 'admin' && adminCheck[0].role !== 'super_admin')) {
      return res.status(403).json({ message: '权限不足' });
    }

    await pool.query('UPDATE feedback SET status = ?, updated_at = NOW() WHERE id = ?', [status, feedbackId]);
    res.status(200).json({ message: '状态更新成功' });
  } catch (error) {
    console.error('更新状态失败:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 管理员回复留言
router.put('/feedback/:id/reply', authenticateToken, async (req, res) => {
  const feedbackId = req.params.id;
  const { admin_reply } = req.body;
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();

    // 验证管理员权限
    const [adminCheck] = await connection.query(
      'SELECT role FROM users WHERE id = ?',
      [req.user.id]
    );

    if (!adminCheck.length || (adminCheck[0].role !== 'admin' && adminCheck[0].role !== 'super_admin')) {
      await connection.rollback();
      return res.status(403).json({ message: '权限不足' });
    }

    // 检查留言是否存在
    const [feedback] = await connection.query(
      'SELECT id FROM feedback WHERE id = ?',
      [feedbackId]
    );

    if (feedback.length === 0) {
      await connection.rollback();
      return res.status(404).json({ message: '留言不存在' });
    }

    // 更新留言
    await connection.query(
      'UPDATE feedback SET admin_reply = ?, status = "processed", updated_at = NOW() WHERE id = ?',
      [admin_reply, feedbackId]
    );

    await connection.commit();
    res.status(200).json({ message: '回复成功' });
  } catch (error) {
    await connection.rollback();
    console.error('回复失败:', error);
    res.status(500).json({ message: error.message || '服务器错误' });
  } finally {
    connection.release();
  }
});

// 删除留言
router.delete('/feedback/:id', authenticateToken, async (req, res) => {
  const feedbackId = req.params.id;
  
  try {
    // 验证管理员权限
    const [adminCheck] = await pool.query(
      'SELECT role FROM users WHERE id = ?',
      [req.user.id]
    );

    if (!adminCheck.length || (adminCheck[0].role !== 'admin' && adminCheck[0].role !== 'super_admin')) {
      return res.status(403).json({ message: '权限不足' });
    }

    // 首先检查留言是否存在
    const [feedbacks] = await pool.query('SELECT user_id FROM feedback WHERE id = ?', [feedbackId]);
    if (feedbacks.length === 0) {
      return res.status(404).json({ message: '留言不存在' });
    }

    // 执行删除操作
    await pool.query('DELETE FROM feedback WHERE id = ?', [feedbackId]);
    res.status(200).json({ message: '留言已删除' });
  } catch (error) {
    console.error('删除留言失败:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 管理员发送新消息
router.post('/feedback/admin-message', authenticateToken, async (req, res) => {
  const { user_id, message } = req.body;
  
  try {
    // 验证管理员权限
    const [adminCheck] = await pool.query(
      'SELECT role FROM users WHERE id = ?',
      [req.user.id]
    );

    if (!adminCheck.length || (adminCheck[0].role !== 'admin' && adminCheck[0].role !== 'super_admin')) {
      return res.status(403).json({ message: '权限不足' });
    }

    if (!user_id || !message) {
      return res.status(400).json({ message: '用户ID和消息内容不能为空' });
    }

    // 插入管理员消息
    await pool.query(
      'INSERT INTO feedback (user_id, message, status, is_admin_message, created_at) VALUES (?, ?, "admin_sent", 1, NOW())',
      [user_id, message]
    );
    res.status(201).json({ message: '消息发送成功' });
  } catch (error) {
    console.error('发送消息失败:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

module.exports = router;
