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

    // 获取所有非管理员用户
    const usersResult = await query(
      `SELECT u.id, u.username, u.created_at, COUNT(e.id) as entry_count
       FROM users u
       LEFT JOIN entries e ON u.id = e.user_id
       WHERE u.is_admin = false
       GROUP BY u.id, u.username, u.created_at
       ORDER BY u.created_at DESC`
    );

    // 获取总日志数
    const statsResult = await query('SELECT COUNT(*) as total_entries FROM entries');

    return res.status(200).json({
      success: true,
      users: usersResult.rows,
      stats: {
        totalUsers: usersResult.rows.length,
        totalEntries: parseInt(statsResult.rows[0].total_entries)
      }
    });

  } catch (error) {
    console.error('Get users error:', error);
    return res.status(500).json({ error: '获取用户列表失败，请重试' });
  }
}
