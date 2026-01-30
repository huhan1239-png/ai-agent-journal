# 多模型AI支持 - 前端更新指南

## 已完成的后端功能

✅ **API支持的AI模型：**
1. **Claude (Anthropic)** - claude-3-5-sonnet
2. **ChatGPT (OpenAI)** - gpt-4-turbo-preview
3. **Gemini (Google)** - gemini-pro
4. **Ollama (本地)** - llama2 等
5. **DeepSeek** - deepseek-chat

## 需要更新的前端部分

### 1. AI设置页面 (ai-settings.html)

当前页面只支持单个Claude API Key。需要改为：

**UI 结构：**
```
┌─ AI 模型配置 ─────────────────────┐
│                                   │
│ 选择 AI 模型:                      │
│ [下拉选择框]                       │
│ • Claude (Anthropic)              │
│ • ChatGPT (OpenAI)                │
│ • Gemini (Google)                 │
│ • Ollama (本地)                   │
│ • DeepSeek                        │
│                                   │
│ API Key / Base URL:               │
│ [输入框]                          │
│ [保存按钮]                        │
│                                   │
│ ─── 已配置的模型 ───               │
│ ✓ Claude: sk-ant-...xyz (已配置)  │
│   [删除]                          │
│ ✓ ChatGPT: sk-...abc (已配置)     │
│   [删除]                          │
└───────────────────────────────────┘
```

**API Key 格式说明：**
- Claude: `sk-ant-api03-...`
- OpenAI: `sk-proj-...` 或 `sk-...`
- Gemini: `AIzaSy...` (Google API Key)
- Ollama: `http://localhost:11434` (本地URL)
- DeepSeek: `sk-...`

### 2. API 调用

**获取已配置的providers：**
```javascript
const response = await fetch(`${API_BASE_URL}/api/settings?action=list&token=${token}`);
const data = await response.json();
// data.providers = [{provider: 'anthropic', createdAt: '...'}, ...]
```

**获取特定provider的key：**
```javascript
const response = await fetch(`${API_BASE_URL}/api/settings?provider=openai&token=${token}`);
```

**保存API Key：**
```javascript
const response = await fetch(`${API_BASE_URL}/api/settings`, {
  method: 'POST',
  body: JSON.stringify({
    token: token,
    apiKey: 'sk-...',
    provider: 'openai'  // 或 'google', 'ollama', 'deepseek'
  })
});
```

**删除API Key：**
```javascript
const response = await fetch(`${API_BASE_URL}/api/settings?provider=openai&token=${token}`, {
  method: 'DELETE'
});
```

### 3. AI功能调用（可选指定provider）

前端调用AI功能时，可以传入 `provider` 参数来指定使用哪个模型：

```javascript
// AI辅助写日志
const response = await fetch(`${API_BASE_URL}/api/ai`, {
  method: 'POST',
  body: JSON.stringify({
    token: token,
    action: 'enhance',
    briefDescription: '...',
    provider: 'openai'  // 可选，不传则使用最近配置的provider
  })
});
```

## 实现建议

### 方案A：简单实现（推荐快速上线）
1. 在当前AI设置页面添加一个provider选择下拉框
2. 根据选择显示对应的提示信息
3. 保存时传入provider参数
4. 显示所有已配置的provider列表

### 方案B：完整实现
1. 创建独立的provider配置卡片
2. 每个provider显示配置状态
3. 支持同时配置多个provider
4. 在使用AI功能时，可以选择用哪个模型

## 快速测试

部署后，你可以这样测试多模型：

1. **配置 Claude**：保存 `sk-ant-...` 到 provider=anthropic
2. **配置 OpenAI**：保存 `sk-...` 到 provider=openai
3. **使用AI功能**：系统会自动使用最后配置的provider
4. **手动选择**：在前端传入 `provider` 参数指定模型

## 注意事项

- Ollama 需要本地运行，URL 通常是 `http://localhost:11434`
- Gemini 需要在 Google AI Studio 获取 API Key
- DeepSeek 的 API 格式与 OpenAI 兼容
- 如果不传 provider，系统会使用最近配置的那个

## 下一步

由于当前文件较大且时间有限，建议：

1. ✅ **后端已完成** - 多模型支持已部署
2. ⏳ **前端待更新** - 按照上述指南更新 ai-settings.html
3. 📝 **可选优化** - 添加provider选择器到主界面

如果需要我帮助实现前端部分，请告诉我！
