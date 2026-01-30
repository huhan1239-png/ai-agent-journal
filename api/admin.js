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
    // 从不同位置获取 token
    const token = req.body?.token || req.query.token || req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ error: '未提供认证令牌' });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return res.status(401).json({ error: '无效的认证令牌' });
    }

    // 检查是否是管理员
    if (!decoded.isAdmin) {
      return res.status(403).json({ error: '无管理员权限' });
    }

    // GET /api/admin?action=users - 获取用户列表
    if (req.method === 'GET' && req.query.action === 'users') {
      const usersResult = await query(
        `SELECT u.id, u.username, u.created_at, COUNT(e.id) as entry_count
         FROM users u
         LEFT JOIN entries e ON u.id = e.user_id
         WHERE u.is_admin = false
         GROUP BY u.id, u.username, u.created_at
         ORDER BY u.created_at DESC`
      );

      const statsResult = await query('SELECT COUNT(*) as total_entries FROM entries');

      return res.status(200).json({
        success: true,
        users: usersResult.rows,
        stats: {
          totalUsers: usersResult.rows.length,
          totalEntries: parseInt(statsResult.rows[0].total_entries)
        }
      });
    }

    // GET /api/admin?action=user-entries&userId=X - 获取指定用户的日志
    if (req.method === 'GET' && req.query.action === 'user-entries') {
      const userId = req.query.userId;

      if (!userId) {
        return res.status(400).json({ error: '缺少用户ID' });
      }

      const userResult = await query(
        'SELECT id, username, created_at FROM users WHERE id = $1',
        [userId]
      );

      if (userResult.rows.length === 0) {
        return res.status(404).json({ error: '用户不存在' });
      }

      const entriesResult = await query(
        'SELECT id, date, category, task, description, duration, images, created_at FROM entries WHERE user_id = $1 ORDER BY date DESC, created_at DESC',
        [userId]
      );

      return res.status(200).json({
        success: true,
        user: userResult.rows[0],
        entries: entriesResult.rows
      });
    }

    // POST /api/admin - 重置用户密码
    if (req.method === 'POST') {
      const { userId, newPassword } = req.body;

      if (!userId || !newPassword) {
        return res.status(400).json({ error: '用户ID和新密码不能为空' });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({ error: '新密码长度至少为6个字符' });
      }

      const userResult = await query(
        'SELECT id, username FROM users WHERE id = $1',
        [userId]
      );

      if (userResult.rows.length === 0) {
        return res.status(404).json({ error: '目标用户不存在' });
      }

      const targetUser = userResult.rows[0];
      const newPasswordHash = await bcrypt.hash(newPassword, 10);

      await query(
        'UPDATE users SET password_hash = $1 WHERE id = $2',
        [newPasswordHash, userId]
      );

      return res.status(200).json({
        success: true,
        message: `已成功为用户 "${targetUser.username}" 重置密码`
      });
    }

    return res.status(400).json({ error: '无效的请求' });

  } catch (error) {
    console.error('Admin API error:', error);
    return res.status(500).json({ error: '操作失败，请重试' });
  }
};
