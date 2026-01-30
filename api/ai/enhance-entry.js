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

async function getUserApiKey(userId) {
  const result = await query(
    'SELECT api_key_encrypted FROM user_api_keys WHERE user_id = $1 AND provider = $2',
    [userId, 'anthropic']
  );

  if (result.rows.length === 0) {
    return null;
  }

  return decrypt(result.rows[0].api_key_encrypted);
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
    const { token, briefDescription, task, category } = req.body;

    if (!token) {
      return res.status(401).json({ error: '未提供认证令牌' });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return res.status(401).json({ error: '无效的认证令牌' });
    }

    if (!briefDescription) {
      return res.status(400).json({ error: '请提供简要描述' });
    }

    // 获取用户的 API Key
    const apiKey = await getUserApiKey(decoded.userId);
    if (!apiKey) {
      return res.status(400).json({ error: '请先在设置中配置 Claude API Key' });
    }

    // 调用 Claude API
    const prompt = `你是一个专业的工作日志助手。用户正在记录他们的工作日志。

任务类别：${category || '未指定'}
任务名称：${task || '未指定'}
简要描述：${briefDescription}

请基于用户的简要描述，生成一段详细、专业的工作日志描述。要求：

1. 保持客观、专业的语气
2. 扩展细节，但不要脱离原意
3. 突出关键要点和成果
4. 长度在100-300字之间
5. 使用第一人称（"我"）
6. 不要添加多余的总结或标题

直接输出优化后的描述内容即可。`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 1024,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Claude API error:', errorData);
      return res.status(response.status).json({
        error: 'AI 服务调用失败：' + (errorData.error?.message || '未知错误')
      });
    }

    const data = await response.json();
    const enhancedDescription = data.content[0].text;

    return res.status(200).json({
      success: true,
      enhancedDescription: enhancedDescription
    });

  } catch (error) {
    console.error('AI enhance error:', error);
    return res.status(500).json({ error: 'AI 辅助失败，请重试' });
  }
};
