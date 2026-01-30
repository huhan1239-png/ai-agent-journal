const { query } = require('./db.js');
const jwt = require('jsonwebtoken');
const { decrypt } = require('./utils/encryption.js');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

// 获取用户的API Key和默认provider
async function getUserApiKey(userId, preferredProvider = null) {
  // 如果指定了provider，尝试获取该provider的key
  if (preferredProvider) {
    const result = await query(
      'SELECT api_key_encrypted, provider FROM user_api_keys WHERE user_id = $1 AND provider = $2',
      [userId, preferredProvider]
    );
    if (result.rows.length > 0) {
      return {
        apiKey: decrypt(result.rows[0].api_key_encrypted),
        provider: result.rows[0].provider
      };
    }
  }

  // 否则，按优先级获取第一个可用的key
  const result = await query(
    'SELECT api_key_encrypted, provider FROM user_api_keys WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1',
    [userId]
  );

  if (result.rows.length === 0) {
    return null;
  }

  return {
    apiKey: decrypt(result.rows[0].api_key_encrypted),
    provider: result.rows[0].provider
  };
}

// 调用 Claude API
async function callClaudeAPI(apiKey, prompt, maxTokens = 1024) {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: maxTokens,
      messages: [{ role: 'user', content: prompt }]
    })
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error('Claude API 调用失败：' + (errorData.error?.message || '未知错误'));
  }

  const data = await response.json();
  return data.content[0].text;
}

// 调用 OpenAI API
async function callOpenAIAPI(apiKey, prompt, maxTokens = 1024) {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'gpt-4-turbo-preview',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: maxTokens
    })
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error('OpenAI API 调用失败：' + (errorData.error?.message || '未知错误'));
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

// 调用 Google Gemini API
async function callGeminiAPI(apiKey, prompt, maxTokens = 1024) {
  const response = await fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      contents: [{
        parts: [{ text: prompt }]
      }],
      generationConfig: {
        maxOutputTokens: maxTokens
      }
    })
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error('Gemini API 调用失败：' + (errorData.error?.message || '未知错误'));
  }

  const data = await response.json();
  return data.candidates[0].content.parts[0].text;
}

// 调用 Ollama 本地模型
async function callOllamaAPI(baseUrl, prompt, maxTokens = 1024) {
  // Ollama默认运行在 http://localhost:11434
  const url = baseUrl || 'http://localhost:11434';

  const response = await fetch(`${url}/api/generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'llama2',  // 默认使用 llama2，用户可以改成其他模型
      prompt: prompt,
      stream: false,
      options: {
        num_predict: maxTokens
      }
    })
  });

  if (!response.ok) {
    throw new Error('Ollama API 调用失败：请确保 Ollama 正在运行');
  }

  const data = await response.json();
  return data.response;
}

// 调用 DeepSeek API
async function callDeepSeekAPI(apiKey, prompt, maxTokens = 1024) {
  const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: maxTokens
    })
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error('DeepSeek API 调用失败：' + (errorData.error?.message || '未知错误'));
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

// 统一的AI调用接口
async function callAI(provider, apiKey, prompt, maxTokens = 1024) {
  switch (provider) {
    case 'anthropic':
      return await callClaudeAPI(apiKey, prompt, maxTokens);
    case 'openai':
      return await callOpenAIAPI(apiKey, prompt, maxTokens);
    case 'google':
      return await callGeminiAPI(apiKey, prompt, maxTokens);
    case 'ollama':
      return await callOllamaAPI(apiKey, prompt, maxTokens);
    case 'deepseek':
      return await callDeepSeekAPI(apiKey, prompt, maxTokens);
    default:
      throw new Error(`不支持的AI提供商: ${provider}`);
  }
}

// 功能1：增强日志描述
async function enhanceEntry(req, res, decoded) {
  const { briefDescription, task, category, provider } = req.body;

  if (!briefDescription) {
    return res.status(400).json({ error: '请提供简要描述' });
  }

  const keyInfo = await getUserApiKey(decoded.userId, provider);
  if (!keyInfo) {
    return res.status(400).json({ error: '请先在设置中配置 API Key' });
  }

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

  const enhancedDescription = await callAI(keyInfo.provider, keyInfo.apiKey, prompt, 1024);

  return res.status(200).json({
    success: true,
    enhancedDescription: enhancedDescription,
    usedProvider: keyInfo.provider
  });
}

// 功能2：生成周报
async function generateReport(req, res, decoded) {
  const { startDate, endDate, provider } = req.body;

  if (!startDate || !endDate) {
    return res.status(400).json({ error: '请提供日期范围' });
  }

  const keyInfo = await getUserApiKey(decoded.userId, provider);
  if (!keyInfo) {
    return res.status(400).json({ error: '请先在设置中配置 API Key' });
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

  const weeklyReport = await callAI(keyInfo.provider, keyInfo.apiKey, prompt, 4096);

  return res.status(200).json({
    success: true,
    report: weeklyReport,
    usedProvider: keyInfo.provider,
    stats: {
      totalHours,
      totalEntries: entries.length,
      categoryStats
    }
  });
}

// 功能3：工作分析
async function analyzeWork(req, res, decoded) {
  const { days = 30, provider } = req.body;

  const keyInfo = await getUserApiKey(decoded.userId, provider);
  if (!keyInfo) {
    return res.status(400).json({ error: '请先在设置中配置 API Key' });
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

  const analysis = await callAI(keyInfo.provider, keyInfo.apiKey, prompt, 4096);

  return res.status(200).json({
    success: true,
    analysis: analysis,
    usedProvider: keyInfo.provider,
    stats: analysisData
  });
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
    const { token, action } = req.body;

    if (!token) {
      return res.status(401).json({ error: '未提供认证令牌' });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return res.status(401).json({ error: '无效的认证令牌' });
    }

    // 根据 action 参数调用不同的功能
    switch (action) {
      case 'enhance':
        return await enhanceEntry(req, res, decoded);
      case 'generate-report':
        return await generateReport(req, res, decoded);
      case 'analyze':
        return await analyzeWork(req, res, decoded);
      default:
        return res.status(400).json({ error: '无效的操作类型' });
    }

  } catch (error) {
    console.error('AI API error:', error);
    return res.status(500).json({ error: error.message || 'AI 服务失败，请重试' });
  }
};
