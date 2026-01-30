const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

module.exports = async function handler(req, res) {
  // 设置 CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // 从 query 或 body 获取 token
    const token = req.query.token || req.body?.token;

    if (!token) {
      return res.status(401).json({ error: '未提供认证令牌' });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return res.status(401).json({ error: '无效的认证令牌' });
    }

    // 返回用户信息
    return res.status(200).json({
      success: true,
      user: {
        id: decoded.userId,
        username: decoded.username,
        isAdmin: decoded.isAdmin
      }
    });

  } catch (error) {
    console.error('Verify token error:', error);
    return res.status(500).json({ error: '验证失败，请重试' });
  }
};
