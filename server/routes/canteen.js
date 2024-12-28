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

// 获取所有投票
router.get('/votes', async (req, res) => {
  const connection = await pool.getConnection();
  try {
    console.log('开始获取投票列表');
    
    // 获取所有投票
    const [votes] = await connection.query(`
      SELECT v.*
      FROM votes v
      ORDER BY v.created_at DESC
    `);
    console.log('数据库返回的原始投票数据:', votes);

    // 获取每个投票的总投票数和选项统计
    const processedVotes = await Promise.all(votes.map(async vote => {
      const voteData = { ...vote };
      
      // 解析选项
      try {
        console.log(`处理投票 ID ${vote.id} 的选项:`, vote.options);
        voteData.options = JSON.parse(vote.options || '[]');
        if (!Array.isArray(voteData.options)) {
          console.warn(`投票 ID ${vote.id} 的选项不是数组:`, voteData.options);
          voteData.options = [];
        }
      } catch (e) {
        console.error(`解析投票 ID ${vote.id} 的选项失败:`, e);
        voteData.options = [];
      }

      // 初始化结果对象
      voteData.results = {};
      voteData.options.forEach(option => {
        voteData.results[option] = 0;
      });

      // 获取该投票的所有结果
      const [results] = await connection.query(`
        SELECT vote_option, COUNT(*) as count
        FROM vote_results
        WHERE vote_id = ?
        GROUP BY vote_option
      `, [vote.id]);
      
      console.log(`投票 ID ${vote.id} 的原始结果:`, results);

      // 填充实际投票数
      results.forEach(result => {
        voteData.results[result.vote_option] = parseInt(result.count, 10);
      });

      // 计算总投票数
      voteData.totalVotes = Object.values(voteData.results).reduce((sum, count) => sum + count, 0);

      console.log(`投票 ID ${vote.id} 的最终结果:`, {
        options: voteData.options,
        results: voteData.results,
        totalVotes: voteData.totalVotes
      });

      return voteData;
    }));

    console.log('处理后的投票数据:', processedVotes);
    res.json(processedVotes);
  } catch (error) {
    console.error('获取投票列表失败:', error);
    res.status(500).json({ message: '服务器错误', error: error.message });
  } finally {
    connection.release();
  }
});

// 获取单个投票详情
router.get('/votes/:id', async (req, res) => {
  const voteId = req.params.id;
  try {
    // 获取投票基本信息
    const [votes] = await pool.query(`
      SELECT v.*, 
        (SELECT COUNT(*) FROM vote_results vr WHERE vr.vote_id = v.id) as totalVotes
      FROM votes v
      WHERE v.id = ?
    `, [voteId]);

    if (votes.length === 0) {
      return res.status(404).json({ message: '投票不存在' });
    }

    const vote = votes[0];
    try {
      vote.options = JSON.parse(vote.options);
    } catch (e) {
      vote.options = [];
      console.error('解析投票选项失败:', e);
    }

    // 获取每个选项的投票数
    const [results] = await pool.query(`
      SELECT vote_option, COUNT(*) as count
      FROM vote_results
      WHERE vote_id = ?
      GROUP BY vote_option
    `, [voteId]);

    vote.results = {};
    vote.options.forEach(option => {
      vote.results[option] = 0;
    });
    results.forEach(result => {
      if (vote.results.hasOwnProperty(result.vote_option)) {
        vote.results[result.vote_option] = result.count;
      }
    });

    res.json(vote);
  } catch (error) {
    console.error('获取投票详情失败:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 检查用户是否已投票
router.get('/votes/:id/user/:userId', async (req, res) => {
  const { id: voteId, userId } = req.params;
  try {
    const [results] = await pool.query(
      'SELECT * FROM vote_results WHERE vote_id = ? AND user_id = ?',
      [voteId, userId]
    );
    res.json({ hasVoted: results.length > 0 });
  } catch (error) {
    console.error('检查投票状态失败:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 创建新投票
router.post('/votes', authenticateToken, verifyAdmin, async (req, res) => {
  const { title, description, options } = req.body;
  console.log('收到创建投票请求:', { title, description, options });
  
  if (!title || !description) {
    console.warn('创建投票失败: 标题或描述为空');
    return res.status(400).json({ message: '标题和描述不能为空' });
  }

  if (!options || !Array.isArray(options)) {
    console.warn('创建投票失败: 选项无效', options);
    return res.status(400).json({ message: '请提供有效的选项数组' });
  }

  if (options.length < 2) {
    console.warn('创建投票失败: 选项数量不足', options);
    return res.status(400).json({ message: '至少需要两个选项' });
  }

  try {
    // 清理选项数据
    const cleanOptions = options
      .map(opt => String(opt).trim())
      .filter(opt => opt);
    
    console.log('清理后的选项:', cleanOptions);

    if (cleanOptions.length < 2) {
      console.warn('创建投票失败: 清理后的有效选项不足', cleanOptions);
      return res.status(400).json({ message: '至少需要两个有效选项' });
    }

    const optionsJson = JSON.stringify(cleanOptions);
    console.log('准备存入数据库的选项 JSON:', optionsJson);

    const [result] = await pool.query(
      'INSERT INTO votes (title, description, options) VALUES (?, ?, ?)',
      [title, description, optionsJson]
    );

    // 获取新创建的投票信息
    const [newVote] = await pool.query(
      'SELECT id, title, description, options, created_at FROM votes WHERE id = ?',
      [result.insertId]
    );

    if (newVote.length > 0) {
      const vote = newVote[0];
      try {
        vote.options = JSON.parse(vote.options);
        console.log('创建投票成功:', vote);
        res.status(201).json(vote);
      } catch (e) {
        console.error('解析新创建投票的选项失败:', e);
        vote.options = cleanOptions; // 使用原始清理后的选项
        res.status(201).json(vote);
      }
    } else {
      console.warn('创建投票成功但无法获取详情');
      res.status(201).json({ 
        id: result.insertId,
        title,
        description,
        options: cleanOptions
      });
    }
  } catch (error) {
    console.error('创建投票失败:', error);
    res.status(500).json({ 
      message: '服务器错误',
      error: error.message,
      details: '创建投票时发生错误'
    });
  }
});

// 提交投票
router.post('/votes/:id/vote', authenticateToken, async (req, res) => {
  const voteId = req.params.id;
  const { option } = req.body;
  const userId = req.user.id;

  if (!option) {
    return res.status(400).json({ message: '请选择一个选项' });
  }

  try {
    // 检查是否已经投票
    const [existing] = await pool.query(
      'SELECT * FROM vote_results WHERE vote_id = ? AND user_id = ?',
      [voteId, userId]
    );

    if (existing.length > 0) {
      return res.status(400).json({ message: '您已经投过票了' });
    }

    // 检查投票是否存在且选项是否有效
    const [votes] = await pool.query('SELECT options FROM votes WHERE id = ?', [voteId]);
    if (votes.length === 0) {
      return res.status(404).json({ message: '投票不存在' });
    }

    const validOptions = JSON.parse(votes[0].options);
    if (!validOptions.includes(option)) {
      return res.status(400).json({ message: '无效的选项' });
    }

    // 记录投票
    await pool.query(
      'INSERT INTO vote_results (vote_id, user_id, vote_option) VALUES (?, ?, ?)',
      [voteId, userId, option]
    );

    res.status(201).json({ message: '投票成功' });
  } catch (error) {
    console.error('提交投票失败:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 删除投票
router.delete('/votes/:id', authenticateToken, verifyAdmin, async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    const voteId = req.params.id;
    console.log(`开始删除投票 ID: ${voteId}`);

    // 检查投票是否存在
    const [voteExists] = await connection.query('SELECT id FROM votes WHERE id = ?', [voteId]);
    if (voteExists.length === 0) {
      await connection.rollback();
      return res.status(404).json({ message: '投票不存在' });
    }

    // 先删除投票结果
    console.log('删除投票结果...');
    await connection.query('DELETE FROM vote_results WHERE vote_id = ?', [voteId]);

    // 再删除投票
    console.log('删除投票...');
    await connection.query('DELETE FROM votes WHERE id = ?', [voteId]);

    await connection.commit();
    console.log('投票删除成功');
    res.json({ message: '投票已删除' });
  } catch (error) {
    await connection.rollback();
    console.error('删除投票失败:', error);
    res.status(500).json({ 
      message: '删除投票失败',
      error: error.message,
      details: '删除投票时发生错误'
    });
  } finally {
    connection.release();
  }
});

module.exports = router;
