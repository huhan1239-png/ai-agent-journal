const { query } = require('../db.js');
const jwt = require('jsonwebtoken');
const { encrypt } = require('../utils/encryption.js');

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
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { token, apiKey, provider = 'anthropic' } = req.body;

    if (!token) {
      return res.status(401).json({ error: '未提供认证令牌' });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return res.status(401).json({ error: '无效的认证令牌' });
    }

    // 验证 API Key 格式
    if (!apiKey || apiKey.trim().length === 0) {
      return res.status(400).json({ error: 'API Key 不能为空' });
    }

    // Anthropic API Key 格式验证
    if (provider === 'anthropic' && !apiKey.startsWith('sk-ant-')) {
      return res.status(400).json({ error: 'Claude API Key 格式错误（应以 sk-ant- 开头）' });
    }

    // 加密 API Key
    const encryptedKey = encrypt(apiKey);

    // 保存到数据库（如果存在则更新）
    await query(
      `INSERT INTO user_api_keys (user_id, api_key_encrypted, provider)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id, provider)
       DO UPDATE SET api_key_encrypted = $2, updated_at = CURRENT_TIMESTAMP`,
      [decoded.userId, encryptedKey, provider]
    );

    return res.status(200).json({
      success: true,
      message: 'API Key 保存成功'
    });

  } catch (error) {
    console.error('Save API key error:', error);
    return res.status(500).json({ error: '保存失败，请重试' });
  }
};
