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
  res.setHeader('Access-Control-Allow-Methods', 'DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'DELETE') {
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

  } catch (error) {
    console.error('Delete entry error:', error);
    return res.status(500).json({ error: '删除日志失败，请重试' });
  }
}
