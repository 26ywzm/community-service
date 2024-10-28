// middleware/auth.js
const jwt = require('jsonwebtoken');

function authenticateToken(req, res, next) {
  console.log('JWT Secret:', process.env.JWT_SECRET);  // 检查 JWT_SECRET
    const token = req.headers['authorization'] && req.headers['authorization'].split(' ')[1];
    console.log('Received Token:', token);
    if (!token) {
      console.log('没有提供 Token');
      return res.sendStatus(401); // 没有 token，返回 401
    }
  
    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
      if (err) {
        console.log('Token 验证失败:', err);
        return res.sendStatus(403); // Token 不合法，返回 403
      }
      console.log('Decoded User:', user);
      req.user = user; // 保存用户信息
      next();
    });
  }
module.exports = authenticateToken;
