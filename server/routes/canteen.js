const express = require('express');
const router = express.Router();
const { pool } = require('../db');

// 获取所有用户列表
router.get('/users', async (req, res) => {
  try {
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
router.get('/feedback/:userId', async (req, res) => {
  const userId = req.params.userId;
  
  try {
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
router.post('/feedback', async (req, res) => {
  const { user_id, message } = req.body;
  
  if (!user_id || !message) {
    return res.status(400).json({ message: '用户 ID 和留言内容不能为空' });
  }
  
  try {
    // 插入留言到数据库
    await pool.query('INSERT INTO feedback (user_id, message, status, created_at) VALUES (?, ?, "pending", NOW())', 
      [user_id, message]);
    res.status(201).json({ message: '留言提交成功' });
  } catch (error) {
    console.error('留言提交失败:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 获取指定用户的留言和回复（用户查看自己的留言）
router.get('/feedbacks', async (req, res) => {
  const { user_id } = req.query; // 用户ID作为查询参数传入
  
  if (!user_id) {
    return res.status(400).json({ message: '用户 ID 不能为空' });
  }
  
  try {
    const [feedbacks] = await pool.query(`
      SELECT f.id, u.username, f.message, f.admin_reply, f.status, f.created_at, f.updated_at
      FROM feedback f
      JOIN users u ON f.user_id = u.id
      WHERE f.user_id = ?
      ORDER BY f.created_at DESC
    `, [user_id]);
    
    res.status(200).json({ feedbacks });
  } catch (error) {
    console.error('获取留言失败:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 获取所有留言（管理员查看）
router.get('/feedback', async (req, res) => {
  try {
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
router.put('/feedback/:id', async (req, res) => {
  const feedbackId = req.params.id;
  const { status } = req.body;
  
  if (!status) {
    return res.status(400).json({ message: '状态不能为空' });
  }

  try {
    await pool.query('UPDATE feedback SET status = ? WHERE id = ?', [status, feedbackId]);
    res.status(200).json({ message: '留言状态已更新' });
  } catch (error) {
    console.error('更新留言状态失败:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 管理员回复留言
router.put('/feedback/:id/reply', async (req, res) => {
  const feedbackId = req.params.id;
  const { admin_reply } = req.body;
  
  if (!admin_reply) {
    return res.status(400).json({ message: '回复内容不能为空' });
  }
  
  try {
    await pool.query(
      'UPDATE feedback SET admin_reply = ?, status = "processed", updated_at = NOW() WHERE id = ?',
      [admin_reply, feedbackId]
    );
    res.status(200).json({ message: '回复成功' });
  } catch (error) {
    console.error('回复留言失败:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 管理员发送新消息
router.post('/feedback/admin-message', async (req, res) => {
  const { user_id, message } = req.body;
  
  if (!user_id || !message) {
    return res.status(400).json({ message: '用户ID和消息内容不能为空' });
  }
  
  try {
    await pool.query(`
      INSERT INTO feedback (user_id, message, admin_reply, status, created_at)
      VALUES (?, ?, NULL, 'admin_sent', NOW())
    `, [user_id, message]);
    
    res.status(201).json({ message: '消息发送成功' });
  } catch (error) {
    console.error('发送消息失败:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

module.exports = router;
