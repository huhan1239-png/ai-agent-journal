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
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // 从 body 或 header 获取 token
    const token = req.body.token || req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ error: '未提供认证令牌' });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return res.status(401).json({ error: '无效的认证令牌' });
    }

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

  } catch (error) {
    console.error('Create entry error:', error);
    return res.status(500).json({ error: '创建日志失败，请重试' });
  }
}
