// middleware/auth.js
const jwt = require('jsonwebtoken');
const { pool } = require('../db');
const dotenv = require('dotenv');

dotenv.config();

async function authenticateToken(req, res, next) {
  const token = req.headers['authorization'] && req.headers['authorization'].split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ message: '未提供认证令牌' });
  }

  try {
    // 验证 token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('解码后的token信息:', decoded);
    
    // 从数据库验证用户信息和角色
    const [rows] = await pool.query('SELECT id, email, role FROM users WHERE id = ?', [decoded.id]);
    console.log('数据库中的用户信息:', rows[0]);
    
    if (rows.length === 0) {
      return res.status(403).json({ message: '用户不存在' });
    }

    const user = rows[0];
    
    // 验证 token 中的角色是否与数据库中的一致
    console.log('比较角色 - token中的角色:', decoded.role, '数据库中的角色:', user.role);
    if (decoded.role !== user.role) {
      return res.status(403).json({ message: '用户权限已变更，请重新登录' });
    }

    // 将验证后的用户信息存储到请求对象中
    req.user = {
      id: user.id,
      email: user.email,
      role: user.role
    };
    console.log('验证通过，用户信息:', req.user);
    
    next();
  } catch (error) {
    console.error('Token验证失败:', error);
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: '认证令牌已过期' });
    }
    return res.status(403).json({ message: '无效的认证令牌' });
  }
}

module.exports = authenticateToken;
