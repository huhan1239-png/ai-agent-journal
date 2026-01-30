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
    const { token, days = 30 } = req.body;

    if (!token) {
      return res.status(401).json({ error: '未提供认证令牌' });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return res.status(401).json({ error: '无效的认证令牌' });
    }

    // 获取用户的 API Key
    const apiKey = await getUserApiKey(decoded.userId);
    if (!apiKey) {
      return res.status(400).json({ error: '请先在设置中配置 Claude API Key' });
    }

    // 获取最近N天的日志
    const entriesResult = await query(
      `SELECT date, category, task, description, duration, created_at
       FROM entries
       WHERE user_id = $1 AND date >= CURRENT_DATE - $2
       ORDER BY date DESC`,
      [decoded.userId, days]
    );

    const entries = entriesResult.rows;

    if (entries.length === 0) {
      return res.status(400).json({ error: '没有足够的数据进行分析' });
    }

    // 统计数据
    const totalHours = entries.reduce((sum, entry) => sum + parseFloat(entry.duration || 0), 0);
    const avgHoursPerDay = totalHours / days;

    const categoryStats = {};
    const dateStats = {};

    entries.forEach(entry => {
      // 按分类统计
      if (!categoryStats[entry.category]) {
        categoryStats[entry.category] = { count: 0, hours: 0 };
      }
      categoryStats[entry.category].count++;
      categoryStats[entry.category].hours += parseFloat(entry.duration || 0);

      // 按日期统计
      if (!dateStats[entry.date]) {
        dateStats[entry.date] = 0;
      }
      dateStats[entry.date] += parseFloat(entry.duration || 0);
    });

    // 找出最忙和最闲的日子
    const sortedDates = Object.entries(dateStats).sort((a, b) => b[1] - a[1]);
    const busiestDay = sortedDates[0];
    const quietestDay = sortedDates[sortedDates.length - 1];

    // 构建分析数据
    const analysisData = {
      period: `最近${days}天`,
      totalHours: totalHours.toFixed(1),
      avgHoursPerDay: avgHoursPerDay.toFixed(1),
      totalEntries: entries.length,
      categories: Object.entries(categoryStats).map(([name, stats]) => ({
        name,
        count: stats.count,
        hours: stats.hours.toFixed(1),
        percentage: ((stats.hours / totalHours) * 100).toFixed(1)
      })).sort((a, b) => parseFloat(b.hours) - parseFloat(a.hours)),
      busiestDay: { date: busiestDay[0], hours: busiestDay[1].toFixed(1) },
      quietestDay: { date: quietestDay[0], hours: quietestDay[1].toFixed(1) }
    };

    const prompt = `你是一个专业的工作效率分析师。请基于以下用户的工作数据，提供深入的分析和改进建议。

## 分析周期
${analysisData.period}（${analysisData.totalEntries}条日志）

## 工作量统计
- 总工作时长：${analysisData.totalHours}小时
- 日均工作时长：${analysisData.avgHoursPerDay}小时
- 最忙碌的一天：${analysisData.busiestDay.date}（${analysisData.busiestDay.hours}小时）
- 最轻松的一天：${analysisData.quietestDay.date}（${analysisData.quietestDay.hours}小时）

## 工作类型分布
${analysisData.categories.map(cat =>
  `- ${cat.name}：${cat.hours}小时（${cat.percentage}%），${cat.count}条记录`
).join('\n')}

## 最近的工作内容（前10条）
${entries.slice(0, 10).map((entry, index) =>
  `${index + 1}. [${entry.date}] ${entry.category} - ${entry.task} (${entry.duration}h)`
).join('\n')}

## 要求
请生成一份专业的工作分析报告，包括：

1. **工作强度分析**（基于总时长和日均时长，评估工作强度是否合理）
2. **时间分配评估**（分析各类工作的时间占比是否合理）
3. **工作模式洞察**（发现工作规律、高效时段等）
4. **潜在问题识别**（如时间分配不均、某类工作过度占用时间等）
5. **改进建议**（提供3-5条具体的、可执行的改进建议）

使用专业但友好的语气，提供有价值的洞察。使用markdown格式，包含适当的强调和列表。`;

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
    const analysis = data.content[0].text;

    return res.status(200).json({
      success: true,
      analysis: analysis,
      stats: analysisData
    });

  } catch (error) {
    console.error('AI analysis error:', error);
    return res.status(500).json({ error: 'AI 分析失败，请重试' });
  }
};
