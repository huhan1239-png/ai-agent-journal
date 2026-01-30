const { query } = require('./db.js');
const jwt = require('jsonwebtoken');
const { encrypt, decrypt } = require('./utils/encryption.js');

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
    // GET: 获取 API Key
    if (req.method === 'GET') {
      const token = req.query.token;
      const provider = req.query.provider;
      const action = req.query.action;

      if (!token) {
        return res.status(401).json({ error: '未提供认证令牌' });
      }

      const decoded = verifyToken(token);
      if (!decoded) {
        return res.status(401).json({ error: '无效的认证令牌' });
      }

      // 如果action=list，返回所有已配置的provider
      if (action === 'list') {
        const result = await query(
          'SELECT provider, created_at FROM user_api_keys WHERE user_id = $1 ORDER BY created_at DESC',
          [decoded.userId]
        );

        return res.status(200).json({
          success: true,
          providers: result.rows.map(row => ({
            provider: row.provider,
            createdAt: row.created_at
          }))
        });
      }

      // 否则查询特定provider的API Key
      if (!provider) {
        return res.status(400).json({ error: '请指定provider' });
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
      const maskedKey = apiKey.length > 14
        ? apiKey.substring(0, 10) + '...' + apiKey.substring(apiKey.length - 4)
        : '***' + apiKey.substring(apiKey.length - 4);

      return res.status(200).json({
        success: true,
        hasApiKey: true,
        apiKey: maskedKey,
        provider: result.rows[0].provider,
        createdAt: result.rows[0].created_at
      });
    }

    // POST: 保存 API Key
    if (req.method === 'POST') {
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

      // 验证不同provider的API Key格式
      if (provider === 'anthropic' && !apiKey.startsWith('sk-ant-')) {
        return res.status(400).json({ error: 'Claude API Key 格式错误（应以 sk-ant- 开头）' });
      }

      if (provider === 'openai' && !apiKey.startsWith('sk-')) {
        return res.status(400).json({ error: 'OpenAI API Key 格式错误（应以 sk- 开头）' });
      }

      if (provider === 'deepseek' && !apiKey.startsWith('sk-')) {
        return res.status(400).json({ error: 'DeepSeek API Key 格式错误（应以 sk- 开头）' });
      }

      // google 和 ollama 不需要特殊格式验证
      // ollama 的 apiKey 存储的是 base URL (如 http://localhost:11434)

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
    }

    // DELETE: 删除 API Key
    if (req.method === 'DELETE') {
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
    }

    return res.status(405).json({ error: 'Method not allowed' });

  } catch (error) {
    console.error('Settings API error:', error);
    return res.status(500).json({ error: '操作失败，请重试' });
  }
};
