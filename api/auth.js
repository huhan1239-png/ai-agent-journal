const { query } = require('./db.js');
const bcrypt = require('bcryptjs');
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

  try {
    const action = req.query.action || req.body?.action;

    // GET /api/auth?action=verify&token=xxx - 验证token
    if (req.method === 'GET' && action === 'verify') {
      const token = req.query.token;

      if (!token) {
        return res.status(401).json({ error: '未提供认证令牌' });
      }

      const decoded = verifyToken(token);
      if (!decoded) {
        return res.status(401).json({ error: '无效的认证令牌' });
      }

      return res.status(200).json({
        success: true,
        user: {
          id: decoded.userId,
          username: decoded.username,
          isAdmin: decoded.isAdmin
        }
      });
    }

    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    // POST /api/auth with action=login - 登录
    if (action === 'login') {
      const { username, password } = req.body;

      if (!username || !password) {
        return res.status(400).json({ error: '用户名和密码不能为空' });
      }

      const result = await query(
        'SELECT id, username, password_hash, is_admin FROM users WHERE username = $1',
        [username]
      );

      if (result.rows.length === 0) {
        return res.status(401).json({ error: '用户名或密码错误' });
      }

      const user = result.rows[0];
      const isValidPassword = await bcrypt.compare(password, user.password_hash);

      if (!isValidPassword) {
        return res.status(401).json({ error: '用户名或密码错误' });
      }

      const token = jwt.sign(
        {
          userId: user.id,
          username: user.username,
          isAdmin: user.is_admin
        },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      return res.status(200).json({
        success: true,
        token,
        user: {
          id: user.id,
          username: user.username,
          isAdmin: user.is_admin
        }
      });
    }

    // POST /api/auth with action=register - 注册
    if (action === 'register') {
      const { username, password } = req.body;

      if (!username || !password) {
        return res.status(400).json({ error: '用户名和密码不能为空' });
      }

      if (username.length < 3 || username.length > 20) {
        return res.status(400).json({ error: '用户名长度必须在3-20个字符之间' });
      }

      if (password.length < 6) {
        return res.status(400).json({ error: '密码长度至少为6个字符' });
      }

      const existingUser = await query(
        'SELECT id FROM users WHERE username = $1',
        [username]
      );

      if (existingUser.rows.length > 0) {
        return res.status(400).json({ error: '用户名已存在' });
      }

      const passwordHash = await bcrypt.hash(password, 10);

      const result = await query(
        'INSERT INTO users (username, password_hash, is_admin) VALUES ($1, $2, false) RETURNING id, username, is_admin, created_at',
        [username, passwordHash]
      );

      const user = result.rows[0];

      return res.status(200).json({
        success: true,
        user: {
          id: user.id,
          username: user.username,
          isAdmin: user.is_admin
        }
      });
    }

    // POST /api/auth with action=change-password - 修改密码
    if (action === 'change-password') {
      const { token, oldPassword, newPassword } = req.body;

      if (!token) {
        return res.status(401).json({ error: '未提供认证令牌' });
      }

      const decoded = verifyToken(token);
      if (!decoded) {
        return res.status(401).json({ error: '无效的认证令牌' });
      }

      if (!oldPassword || !newPassword) {
        return res.status(400).json({ error: '旧密码和新密码不能为空' });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({ error: '新密码长度至少为6个字符' });
      }

      if (oldPassword === newPassword) {
        return res.status(400).json({ error: '新密码不能与旧密码相同' });
      }

      const userResult = await query(
        'SELECT id, username, password_hash FROM users WHERE id = $1',
        [decoded.userId]
      );

      if (userResult.rows.length === 0) {
        return res.status(404).json({ error: '用户不存在' });
      }

      const user = userResult.rows[0];
      const isValidOldPassword = await bcrypt.compare(oldPassword, user.password_hash);

      if (!isValidOldPassword) {
        return res.status(401).json({ error: '旧密码错误' });
      }

      const newPasswordHash = await bcrypt.hash(newPassword, 10);

      await query(
        'UPDATE users SET password_hash = $1 WHERE id = $2',
        [newPasswordHash, decoded.userId]
      );

      return res.status(200).json({
        success: true,
        message: '密码修改成功'
      });
    }

    return res.status(400).json({ error: '无效的操作类型' });

  } catch (error) {
    console.error('Auth API error:', error);
    return res.status(500).json({ error: '操作失败，请重试' });
  }
};
