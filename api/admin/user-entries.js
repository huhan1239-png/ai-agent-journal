import { query } from '../db.js';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

export default async function handler(req, res) {
  // 设置 CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // 从 query 或 header 获取 token
    const token = req.query.token || req.headers.authorization?.replace('Bearer ', '');

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

    const userId = req.query.userId;

    if (!userId) {
      return res.status(400).json({ error: '缺少用户ID' });
    }

    // 获取指定用户的信息
    const userResult = await query(
      'SELECT id, username, created_at FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: '用户不存在' });
    }

    // 获取该用户的所有日志
    const entriesResult = await query(
      'SELECT id, date, category, task, description, duration, images, created_at FROM entries WHERE user_id = $1 ORDER BY date DESC, created_at DESC',
      [userId]
    );

    return res.status(200).json({
      success: true,
      user: userResult.rows[0],
      entries: entriesResult.rows
    });

  } catch (error) {
    console.error('Get user entries error:', error);
    return res.status(500).json({ error: '获取用户日志失败，请重试' });
  }
}
