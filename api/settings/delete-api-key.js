const { query } = require('../db.js');
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
  res.setHeader('Access-Control-Allow-Methods', 'DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const token = req.query.token;
    const provider = req.query.provider || 'anthropic';

    if (!token) {
      return res.status(401).json({ error: '未提供认证令牌' });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return res.status(401).json({ error: '无效的认证令牌' });
    }

    // 删除 API Key
    await query(
      'DELETE FROM user_api_keys WHERE user_id = $1 AND provider = $2',
      [decoded.userId, provider]
    );

    return res.status(200).json({
      success: true,
      message: 'API Key 已删除'
    });

  } catch (error) {
    console.error('Delete API key error:', error);
    return res.status(500).json({ error: '删除失败，请重试' });
  }
};
