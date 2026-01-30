# ✅ AI 功能部署检查清单

## 📋 部署前准备

### 1. 数据库配置
- [ ] 已登录 Neon SQL Editor
- [ ] 执行 `DATABASE_MIGRATION_API_KEYS.md` 中的 SQL 脚本
- [ ] 确认 `user_api_keys` 表创建成功
- [ ] 测试查询：`SELECT * FROM user_api_keys LIMIT 1;`

### 2. 环境变量配置
- [ ] 在 Vercel 中添加 `ENCRYPTION_KEY` 环境变量
- [ ] 验证 `DATABASE_URL` 仍然正常
- [ ] 验证 `JWT_SECRET` 仍然正常
- [ ] 环境选择：Production, Preview, Development 都勾选

### 3. 代码检查
- [ ] 所有新文件已创建
- [ ] `app.js` 已添加 AI 功能函数
- [ ] `index.html` 已添加 AI 按钮
- [ ] `ai-settings.html` 已创建

---

## 🚀 部署步骤

### 步骤 1：提交代码

```bash
cd "/Users/huhan/claudetry/agent journal"

# 查看所有修改
git status

# 添加所有文件
git add .

# 提交
git commit -m "Add AI features: Claude API integration"

# 推送
git push
```

### 步骤 2：配置环境变量

1. **访问 Vercel**
   - https://vercel.com/dashboard
   - 选择你的项目

2. **添加 ENCRYPTION_KEY**
   - Settings → Environment Variables
   - Name: `ENCRYPTION_KEY`
   - Value: 生成一个32位随机字符串

   生成方法（在终端执行）：
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

3. **重新部署**
   - Deployments → 最新部署 → Redeploy

### 步骤 3：执行数据库迁移

1. **登录 Neon Console**
   - https://console.neon.tech/

2. **进入 SQL Editor**

3. **复制并执行以下 SQL**：

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

4. **验证**：
```sql
-- 查看表结构
\d user_api_keys

-- 确认表为空
SELECT COUNT(*) FROM user_api_keys;
```

---

## 🧪 功能测试

### 测试 1：配置 API Key

1. **访问网站**
   - 打开你的网站
   - 使用测试账号登录（或注册新账号）

2. **进入 AI 设置**
   - 点击右上角 **"🤖 AI设置"** 按钮
   - 或直接访问 `/ai-settings.html`

3. **保存 API Key**
   - 输入你的 Claude API Key（sk-ant-...）
   - 点击 **"保存 API Key"**
   - 应该看到 "✅ API Key 保存成功"

4. **验证**
   - 刷新页面
   - 应该显示 "✅ 已配置 API Key"
   - 显示部分掩码的 Key

### 测试 2：AI 辅助写日志

1. **添加日志**
   - 点击 **"添加日志"** 按钮
   - 选择日期和分类
   - 在 **"详细内容"** 中输入：
     ```
     今天修复了一个数据库连接的bug
     ```

2. **使用 AI 辅助**
   - 点击 **"✨ AI 辅助写日志"** 按钮
   - 等待 2-5 秒

3. **验证结果**
   - 描述框应该被填充详细内容
   - 内容应该比原输入更详细
   - 如果失败，检查：
     - 浏览器控制台是否有错误
     - Vercel 函数日志
     - API Key 是否正确

### 测试 3：AI 生成周报

1. **创建一些测试日志**
   - 创建 3-5 条本周的日志
   - 包含不同分类

2. **生成周报**
   - 切换到 **"📊 周报"** 标签
   - 选择当前周
   - 点击 **"🤖 AI 生成周报"** 按钮
   - 等待 5-10 秒

3. **验证结果**
   - 应该显示结构化的周报
   - 包含总结、详述、分析等部分

### 测试 4：AI 智能分析

1. **确保有足够数据**
   - 至少有 10+ 条日志

2. **运行分析**
   - 在周报页面
   - 点击 **"📊 AI 智能分析"** 按钮
   - 等待 10-15 秒

3. **验证结果**
   - 弹出分析报告
   - 包含工作强度、时间分配、改进建议等

---

## 🐛 故障排查

### 问题 1：API Key 保存失败

**可能原因**：
- ENCRYPTION_KEY 未配置
- 数据库表未创建

**解决方案**：
```sql
-- 检查表是否存在
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public' AND table_name = 'user_api_keys';

-- 如果不存在，重新执行创建脚本
```

### 问题 2：AI 功能返回错误

**常见错误**：

1. **"请先在设置中配置 Claude API Key"**
   - 确认已保存 API Key
   - 检查数据库中是否有记录：
     ```sql
     SELECT * FROM user_api_keys WHERE user_id = 你的用户ID;
     ```

2. **"AI 服务调用失败: Invalid API Key"**
   - API Key 格式错误
   - API Key 无效或已过期
   - 重新生成 API Key

3. **"AI 服务调用失败: Insufficient credits"**
   - Anthropic 账户余额不足
   - 前往 Console 充值

### 问题 3：解密失败

**症状**：API 返回 500 错误，日志显示解密错误

**原因**：ENCRYPTION_KEY 不一致

**解决方案**：
1. 删除所有已保存的 API Key
```sql
DELETE FROM user_api_keys;
```
2. 重新配置正确的 ENCRYPTION_KEY
3. 让用户重新保存 API Key

---

## 📊 监控和维护

### 日常检查

1. **Vercel 函数日志**
   - 定期查看 AI API 的调用日志
   - 关注错误率

2. **数据库监控**
   ```sql
   -- 查看 API Key 数量
   SELECT COUNT(*) FROM user_api_keys;

   -- 查看最近配置的用户
   SELECT user_id, provider, created_at
   FROM user_api_keys
   ORDER BY created_at DESC
   LIMIT 10;
   ```

3. **用户反馈**
   - 收集 AI 功能使用反馈
   - 优化 prompt 提示词

### 成本控制

1. **监控 Anthropic 使用量**
   - 访问 https://console.anthropic.com/
   - 查看 Usage 页面
   - 设置预算告警

2. **用户成本分析**
   ```sql
   -- 统计使用 AI 功能的用户数
   SELECT COUNT(DISTINCT user_id) FROM user_api_keys;
   ```

---

## ✅ 部署完成检查

部署完成后，确认以下所有项：

- [ ] 数据库表 `user_api_keys` 创建成功
- [ ] 环境变量 `ENCRYPTION_KEY` 已配置
- [ ] Vercel 部署成功，无错误
- [ ] 测试账号可以保存 API Key
- [ ] AI 辅助写日志功能正常
- [ ] AI 生成周报功能正常
- [ ] AI 智能分析功能正常
- [ ] 文档已阅读：`AI_FEATURES_GUIDE.md`
- [ ] 环境变量已备份到安全位置

---

## 📞 需要帮助？

如果遇到问题：

1. **检查文档**
   - `AI_FEATURES_GUIDE.md` - 使用指南
   - `ENVIRONMENT_VARIABLES.md` - 环境变量说明
   - `DATABASE_MIGRATION_API_KEYS.md` - 数据库迁移

2. **查看日志**
   - Vercel 函数日志
   - 浏览器控制台
   - Neon 数据库日志

3. **常见问题**
   - 参考本文档的故障排查部分

---

**最后更新**: 2026-01-30
**版本**: v2.1.0
**状态**: 准备部署
