const { query } = require('./db.js');
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
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
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

    // GET: 获取日志列表
    if (req.method === 'GET') {
      const result = await query(
        'SELECT id, date, category, task, description, duration, images, created_at FROM entries WHERE user_id = $1 ORDER BY date DESC, created_at DESC',
        [decoded.userId]
      );

      return res.status(200).json({
        success: true,
        entries: result.rows
      });
    }

    // POST: 创建日志
    if (req.method === 'POST') {
      const { date, category, task, description, duration, images } = req.body;

      // 验证必填字段
      if (!date || !category || !task || !description || !duration) {
        return res.status(400).json({ error: '缺少必填字段' });
      }

      // 创建日志
      const result = await query(
        'INSERT INTO entries (user_id, date, category, task, description, duration, images) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id, date, category, task, description, duration, images, created_at',
        [decoded.userId, date, category, task, description, duration, JSON.stringify(images || [])]
      );

      return res.status(200).json({
        success: true,
        entry: result.rows[0]
      });
    }

    // DELETE: 删除日志
    if (req.method === 'DELETE') {
      const entryId = req.query.id;

      if (!entryId) {
        return res.status(400).json({ error: '缺少日志ID' });
      }

      // 删除日志（只能删除自己的）
      const result = await query(
        'DELETE FROM entries WHERE id = $1 AND user_id = $2 RETURNING id',
        [entryId, decoded.userId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: '日志不存在或无权删除' });
      }

      return res.status(200).json({
        success: true,
        message: '删除成功'
      });
    }

    return res.status(405).json({ error: 'Method not allowed' });

  } catch (error) {
    console.error('Entries API error:', error);
    return res.status(500).json({ error: '操作失败，请重试' });
  }
};
