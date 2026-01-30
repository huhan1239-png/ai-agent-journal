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
    const { token, startDate, endDate } = req.body;

    if (!token) {
      return res.status(401).json({ error: '未提供认证令牌' });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return res.status(401).json({ error: '无效的认证令牌' });
    }

    if (!startDate || !endDate) {
      return res.status(400).json({ error: '请提供日期范围' });
    }

    // 获取用户的 API Key
    const apiKey = await getUserApiKey(decoded.userId);
    if (!apiKey) {
      return res.status(400).json({ error: '请先在设置中配置 Claude API Key' });
    }

    // 获取指定日期范围的日志
    const entriesResult = await query(
      `SELECT date, category, task, description, duration
       FROM entries
       WHERE user_id = $1 AND date >= $2 AND date <= $3
       ORDER BY date ASC`,
      [decoded.userId, startDate, endDate]
    );

    const entries = entriesResult.rows;

    if (entries.length === 0) {
      return res.status(400).json({ error: '该时间段没有日志记录' });
    }

    // 统计数据
    const totalHours = entries.reduce((sum, entry) => sum + parseFloat(entry.duration || 0), 0);
    const categoryStats = {};
    entries.forEach(entry => {
      if (!categoryStats[entry.category]) {
        categoryStats[entry.category] = { count: 0, hours: 0 };
      }
      categoryStats[entry.category].count++;
      categoryStats[entry.category].hours += parseFloat(entry.duration || 0);
    });

    // 构建日志数据
    const entriesText = entries.map((entry, index) =>
      `${index + 1}. [${entry.date}] ${entry.category} - ${entry.task}\n   ${entry.description} (${entry.duration}小时)`
    ).join('\n\n');

    const prompt = `你是一个专业的工作周报生成助手。请基于以下工作日志，生成一份专业的周报。

## 时间范围
${startDate} 至 ${endDate}

## 统计数据
- 总工作时长：${totalHours}小时
- 日志条数：${entries.length}条
${Object.entries(categoryStats).map(([cat, stats]) =>
  `- ${cat}：${stats.count}条记录，${stats.hours.toFixed(1)}小时`
).join('\n')}

## 详细日志
${entriesText}

## 要求
请生成一份专业的周报，包括以下部分：

1. **本周工作总结**（3-5句话概括主要工作内容和成果）
2. **重点工作详述**（列举2-3项最重要的工作，每项用1段话详细说明）
3. **工作量分析**（基于分类和时长的分析）
4. **遇到的问题和挑战**（如果日志中有体现）
5. **下周计划**（基于本周工作的合理延续）

使用专业、简洁的语言，保持客观。使用markdown格式输出。`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 4096,
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
    const weeklyReport = data.content[0].text;

    return res.status(200).json({
      success: true,
      report: weeklyReport,
      stats: {
        totalHours,
        totalEntries: entries.length,
        categoryStats
      }
    });

  } catch (error) {
    console.error('AI generate report error:', error);
    return res.status(500).json({ error: 'AI 生成周报失败，请重试' });
  }
};
