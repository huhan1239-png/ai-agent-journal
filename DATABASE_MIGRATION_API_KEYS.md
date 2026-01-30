# 数据库更新：添加 API Key 存储

## 在 Neon SQL Editor 中执行以下 SQL：

```sql
-- 创建 API Key 存储表
CREATE TABLE IF NOT EXISTS user_api_keys (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    api_key_encrypted TEXT NOT NULL,
    provider VARCHAR(50) DEFAULT 'anthropic',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, provider)
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_user_api_keys_user_id ON user_api_keys(user_id);

-- 添加更新时间触发器
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_api_keys_updated_at
    BEFORE UPDATE ON user_api_keys
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
```

## 说明

- `api_key_encrypted`: 加密后的 API Key（使用 AES 加密）
- `provider`: API 提供商（支持: anthropic, openai, google, ollama, deepseek）
- `user_id`: 关联用户 ID
- 每个用户每个提供商只能有一个 API Key（UNIQUE 约束）

## 支持的 AI 提供商

1. **anthropic** - Claude (claude-3-5-sonnet, claude-3-opus 等)
2. **openai** - ChatGPT (gpt-4, gpt-3.5-turbo 等)
3. **google** - Gemini (gemini-pro, gemini-ultra 等)
4. **ollama** - 本地模型 (llama2, mistral 等)
5. **deepseek** - DeepSeek (deepseek-chat, deepseek-coder 等)
