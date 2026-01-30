const { query } = require('../db.js');
const jwt = require('jsonwebtoken');
const { decrypt } = require('../utils/encryption.js');

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
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
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

    // 查询 API Key
    const result = await query(
      'SELECT api_key_encrypted, provider, created_at FROM user_api_keys WHERE user_id = $1 AND provider = $2',
      [decoded.userId, provider]
    );

    if (result.rows.length === 0) {
      return res.status(200).json({
        success: true,
        hasApiKey: false,
        apiKey: null
      });
    }

    // 解密 API Key
    const encryptedKey = result.rows[0].api_key_encrypted;
    const apiKey = decrypt(encryptedKey);

    // 返回部分隐藏的 API Key
    const maskedKey = apiKey.substring(0, 10) + '...' + apiKey.substring(apiKey.length - 4);

    return res.status(200).json({
      success: true,
      hasApiKey: true,
      apiKey: maskedKey,
      provider: result.rows[0].provider,
      createdAt: result.rows[0].created_at
    });

  } catch (error) {
    console.error('Get API key error:', error);
    return res.status(500).json({ error: '获取失败，请重试' });
  }
};
