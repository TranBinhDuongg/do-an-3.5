const jwt = require('jsonwebtoken');

module.exports = function authMiddleware(roles = []) {
  return (req, res, next) => {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer '))
      return res.status(401).json({ message: 'Chưa đăng nhập' });

    const token = header.split(' ')[1];
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      if (roles.length && !roles.includes(decoded.role))
        return res.status(403).json({ message: 'Không có quyền truy cập' });
      req.user = decoded;
      next();
    } catch {
      return res.status(401).json({ message: 'Token không hợp lệ' });
    }
  };
};
