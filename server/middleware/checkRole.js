// middleware/checkRole.js
function checkRole(allowedRoles) {
  return (req, res, next) => {
    // 确保用户信息存在
    if (!req.user) {
      return res.status(401).json({ message: '未授权访问' });
    }

    // 验证用户角色是否在允许的角色列表中
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: '没有权限执行此操作' });
    }

    next();
  };
}

module.exports = checkRole;
