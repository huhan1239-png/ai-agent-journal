# 📋 空间智能部-Agent实战之路 更新日志

## 🎨 Version 2.1.0 - AI多模型支持与UI优化 (2026-01-31)

### 🚀 重大更新

#### AI 多模型支持
- **新功能**：支持5个AI模型，用户可自由选择
  - Claude (Anthropic) - claude-3-5-sonnet
  - ChatGPT (OpenAI) - gpt-4-turbo-preview
  - Gemini (Google) - gemini-pro
  - Ollama (本地) - llama2 等本地模型
  - DeepSeek - deepseek-chat

#### 统一的 AI 设置中心
- **新页面**：`ai-settings.html` - 集中管理所有AI模型配置
- **功能**：
  - 下拉选择器切换不同AI提供商
  - 每个模型显示独立的配置说明和获取API Key步骤
  - 可同时配置多个AI模型
  - 显示已配置模型列表，带彩色徽章标识
  - 独立删除功能
- **API Key 安全**：所有密钥使用AES加密存储在云端数据库

### ✨ UI/UX 优化

#### 1. 移除AI智能提取功能
- **改进**：删除"添加记录"页面顶部的"AI智能提取"配置区域
- **原因**：
  - 旧功能使用localStorage存储API Key，不安全
  - 与新的多模型架构不兼容
  - 用户体验不佳，配置过于复杂

#### 2. 统一AI按钮视觉样式
- **改进**："生成标题"按钮采用与"AI辅助"按钮相同的渐变紫色样式
- **设计**：
  - 背景：`linear-gradient(135deg, #667eea 0%, #764ba2 100%)`
  - 图标：✨ sparkles emoji
  - 效果：视觉一致性更好，用户能快速识别AI功能

#### 3. 生成标题功能升级
- **改进**：接入多模型后端API
- **变化前**：直接在前端调用Claude API，需要本地配置API Key
- **变化后**：调用后端 `/api/ai` 的 `generate-title` action
- **优势**：
  - 支持多种AI模型
  - 与其他AI功能（AI辅助、生成周报、工作分析）使用同一套配置
  - 更安全（API Key不在前端暴露）
  - 更灵活（可随时切换模型）

### 🔧 技术改进

#### 后端API扩展
- **新增**：`POST /api/ai` 的 `generate-title` action
- **功能**：基于工作描述智能生成任务标题
- **特点**：
  - 支持所有已配置的AI模型
  - 自动选择用户最近配置的模型（或指定provider）
  - 标题长度严格控制在50个汉字以内
  - 智能清理格式（去除引号、标点等）

#### API整合优化
- **改进**：Gemini API模型名称修复
- **修复历程**：
  - 尝试1：`gemini-1.5-flash` (v1) ❌
  - 尝试2：`gemini-1.5-flash-latest` (v1beta) ❌
  - 最终：`gemini-pro` (v1beta) ✅
- **结果**：Gemini API现在可以正常工作

#### 前端代码清理
- **删除**：`extractTaskFromDescription()` 函数（76行废弃代码）
- **原因**：已被新的后端API替代，不再需要前端直接调用Claude API

### 📦 数据库更新

#### 新增表：user_api_keys
```sql
CREATE TABLE user_api_keys (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    api_key_encrypted TEXT NOT NULL,
    provider VARCHAR(50) DEFAULT 'anthropic',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, provider)
);
```

- **字段说明**：
  - `api_key_encrypted`：AES加密的API密钥
  - `provider`：AI提供商标识（anthropic/openai/google/ollama/deepseek）
  - 唯一约束：每个用户每个提供商只能有一个API Key

### 🔒 安全增强

1. **API Key 加密存储**
   - 使用AES-256-CBC加密
   - 加密密钥存储在环境变量中
   - 从不在前端直接存储或传输明文API Key

2. **密钥验证**
   - 不同提供商使用不同的格式验证规则
   - Claude: `sk-ant-*`
   - OpenAI/DeepSeek: `sk-*`
   - Gemini: `AIzaSy*`
   - Ollama: URL格式验证

### 📚 新增文档

1. **AI_FEATURES_GUIDE.md**
   - AI功能使用指南
   - 各个AI模型的特点对比
   - API获取方法

2. **MULTI_MODEL_GUIDE.md**
   - 多模型支持的实现指南
   - 前后端API文档
   - 配置和测试方法

3. **DATABASE_MIGRATION_API_KEYS.md**
   - 数据库迁移SQL脚本
   - user_api_keys表结构说明

### 🐛 Bug 修复

#### 修复1：Gemini API模型兼容性
- **问题**：Gemini API返回"model not found"错误
- **尝试**：测试了多个模型名称和API版本
- **解决方案**：使用 `gemini-pro` 模型 + `v1beta` API版本
- **状态**：✅ 已修复

#### 修复2：DeepSeek余额不足错误处理
- **问题**："Insufficient Balance"错误
- **说明**：这不是代码问题，是用户账户余额不足
- **改进**：错误信息更清晰，提示用户充值

### 🔄 API 变更

#### 新增端点
- `POST /api/ai?action=generate-title` - 生成任务标题
- `POST /api/settings` - 保存AI模型API Key
- `GET /api/settings?action=list` - 获取已配置的AI模型列表
- `GET /api/settings?provider=xxx` - 获取特定模型的API Key（部分隐藏）
- `DELETE /api/settings?provider=xxx` - 删除特定模型的API Key

#### 修改端点
- `/api/ai` 的所有action现在都支持 `provider` 参数
- 如果不指定provider，自动使用最近配置的模型

### 📱 用户体验改进

1. **AI设置页面**
   - 响应式设计，移动端友好
   - 彩色徽章区分不同AI模型
   - 实时显示配置状态
   - 清晰的步骤指引

2. **按钮样式统一**
   - 所有AI功能按钮使用相同的渐变紫色
   - 添加sparkles图标增强视觉识别
   - hover效果优化

3. **错误提示优化**
   - 更清晰的错误信息
   - 区分配置错误和余额不足等不同场景

### ⚠️ 破坏性变更

#### localStorage API Key 不再支持
- **影响**：旧版本在localStorage中存储的Claude API Key将不再使用
- **迁移**：
  1. 访问新的AI设置页面
  2. 重新配置你的AI模型API Key
  3. API Key将安全地存储在云端数据库中

### 🎯 性能优化

1. **减少前端代码体积**
   - 删除76行废弃的AI调用代码
   - 移除不再使用的CSS样式

2. **API调用优化**
   - 统一的AI调用接口
   - 减少重复代码
   - 更好的错误处理

### 🚀 下一步计划

#### 即将推出（下个版本）
- [ ] AI设置页面UI进一步优化
- [ ] 支持为不同AI功能指定不同的默认模型
- [ ] AI使用统计和成本追踪
- [ ] 更多AI模型支持（Anthropic Claude 3 Opus, GPT-4等）

---

## 🎉 Version 2.0.0 - 云端数据库版本 (2026-01-30)

### 🚀 重大更新

#### 架构升级：从本地存储到云端数据库
- **重大变更**：从 localStorage 迁移到 PostgreSQL 云数据库（Neon）
- **目的**：解决多用户数据隔离问题，实现真正的多用户系统
- **影响**：管理员现在可以查看所有用户的数据

#### 后端 API 实现
- 使用 Vercel Serverless Functions 构建完整后端
- 7个核心API端点：
  - `POST /api/auth/register` - 用户注册
  - `POST /api/auth/login` - 用户登录
  - `GET /api/auth/verify` - 验证token并获取用户信息
  - `GET /api/entries/list` - 获取日志列表
  - `POST /api/entries/create` - 创建日志
  - `DELETE /api/entries/delete` - 删除日志
  - `GET /api/admin/users` - 管理员获取用户列表
  - `GET /api/admin/user-entries` - 管理员查看用户日志

#### 数据库设计
- **users 表**：用户信息（id, username, password_hash, is_admin, created_at）
- **entries 表**：日志记录（id, user_id, date, category, task, description, duration, images, created_at）
- 使用 bcryptjs 加密存储密码
- JWT token 认证机制

---

### ✨ 新增功能

#### 1. 密码管理系统
- **修改密码**（所有用户）
  - 位置：页面右上角蓝色"修改密码"按钮
  - 功能：用户可以自行修改密码，需要验证旧密码
  - API：`POST /api/auth/change-password`

- **重置密码**（仅管理员）
  - 位置：管理员面板红色"重置密码"按钮
  - 功能：管理员可以为任何用户重置密码
  - API：`POST /api/admin/reset-password`

#### 2. 数据导入工具升级
- 文件：`import.html`
- **新特性**：
  - 支持登录认证
  - 通过API导入数据到云端数据库
  - 实时显示导入进度条
  - 自动检测已登录状态
- **修复**：从 localStorage 版本升级为 API 版本

#### 3. 密码哈希生成工具
- 文件：`password-tool.html`
- **功能**：
  - 浏览器端生成 bcrypt 密码哈希
  - 自动生成 SQL 更新语句
  - 一键复制到剪贴板
- **用途**：管理员直接在数据库中修改用户密码

#### 4. 真正的多用户管理
- **管理员功能增强**：
  - 查看所有注册用户列表
  - 查看每个用户的日志数量
  - 切换查看不同用户的数据
  - 为任何用户重置密码
  - 导出指定用户或所有用户的数据

---

### 🐛 Bug 修复

#### 修复1：bcrypt 兼容性问题
- **问题**：`bcrypt` 原生模块在 Vercel 部署时失败
- **错误**：`Error: /var/task/node_modules/bcrypt/lib/binding/napi-v3/bcrypt_lib.node: invalid ELF header`
- **解决方案**：替换为 `bcryptjs`（纯 JavaScript 实现）
- **文件**：
  - `package.json` - 依赖更新
  - `api/auth/register.js` - 引用更新
  - `api/auth/login.js` - 引用更新

#### 修复2：ES模块兼容性问题
- **问题**：Vercel Functions 无法识别 ES 模块语法（import/export）
- **错误**：API 返回 HTML 错误页面而非 JSON
- **解决方案**：将所有 API 文件从 ES 模块转换为 CommonJS
- **影响文件**：
  - `api/db.js`
  - `api/auth/*.js`
  - `api/entries/*.js`
  - `api/admin/*.js`

#### 修复3：自动登录用户名不显示
- **问题**：页面刷新后自动登录，但用户名显示为空
- **原因**：只验证了 token，未获取用户信息
- **解决方案**：
  - 新增 `api/auth/verify.js` 验证 API
  - 修改 `initAuth()` 函数，自动登录时先获取用户信息
  - 正确设置 `currentUser` 和 `isAdmin` 变量

#### 修复4：数据导入工具无法使用
- **问题**：`import.html` 仍使用 localStorage，与新架构不兼容
- **解决方案**：完全重写导入工具
- **新特性**：
  - 需要先登录
  - 通过 API 逐条导入日志
  - 显示实时进度

---

### 📦 依赖更新

#### 新增依赖
```json
{
  "pg": "^8.11.3",           // PostgreSQL 客户端
  "bcryptjs": "^2.4.3",      // 密码加密（替代bcrypt）
  "jsonwebtoken": "^9.0.2"   // JWT token 生成和验证
}
```

#### 移除依赖
- `bcrypt`: 原生模块，Vercel 不兼容

---

### 🔧 配置更新

#### Vercel 配置
- 文件：`vercel.json`
```json
{
  "functions": {
    "api/**/*.js": {
      "memory": 1024,
      "maxDuration": 10
    }
  }
}
```

#### 环境变量（必需）
- `DATABASE_URL` - Neon PostgreSQL 连接字符串
- `JWT_SECRET` - JWT 签名密钥

---

### 📚 新增文档

1. **PASSWORD_MANAGEMENT_GUIDE.md**
   - 密码管理功能完整使用指南
   - 用户和管理员操作说明
   - API 接口文档
   - 安全建议

2. **TEST_CASES.md**
   - 35+ 个测试用例
   - 8 个测试阶段
   - 核心测试路径
   - 测试结果记录表

3. **NEON_SETUP.md**
   - Neon 数据库设置指南
   - SQL 初始化脚本
   - 环境变量配置

4. **VERCEL_SETUP.md**
   - Vercel 部署完整指南
   - 数据库连接配置

5. **QUICKSTART.md**
   - 快速开始指南
   - 部署步骤

---

### 🏗️ 技术栈

#### 前端
- 纯 HTML + CSS + JavaScript（无框架）
- Chart.js - 数据可视化
- 响应式设计

#### 后端
- Node.js + Vercel Serverless Functions
- PostgreSQL (Neon)
- bcryptjs - 密码加密
- jsonwebtoken - JWT 认证

#### 部署
- Vercel - 应用托管
- Neon - PostgreSQL 数据库托管
- GitHub - 代码仓库

---

### 📊 性能优化

1. **API 响应优化**
   - 使用数据库连接池
   - 减少不必要的查询
   - 适当的索引策略

2. **前端性能**
   - 按需加载数据
   - 避免重复API调用
   - 优化DOM操作

---

### 🔒 安全增强

1. **密码安全**
   - bcrypt 加密存储（10轮盐值）
   - 密码长度验证（至少6个字符）
   - 防止密码重用

2. **API 安全**
   - JWT token 认证
   - CORS 配置
   - 输入验证和消毒
   - SQL 注入防护（参数化查询）

3. **权限管理**
   - 基于角色的访问控制
   - 管理员权限验证
   - 用户数据隔离

---

### ⚠️ 重要变更

#### 破坏性变更
1. **不再支持 localStorage**
   - 旧版本使用 localStorage 存储数据
   - 新版本使用云端数据库
   - **需要迁移**：使用 `import.html` 工具导入旧数据

2. **用户需要重新注册**
   - 之前在浏览器本地注册的用户不会自动迁移
   - 管理员需要在数据库中手动创建（已在初始化脚本中创建）

#### 管理员账号
- **默认管理员**：
  - 用户名：`admin`
  - 密码：`admin123`
  - **强烈建议**：首次登录后立即修改密码

---

### 🔄 迁移指南

#### 从 v1.x 迁移到 v2.0

**步骤1：导出旧数据**
1. 在旧版本中，点击"导出数据"
2. 保存 JSON 文件

**步骤2：在新版本中注册**
1. 访问新网站
2. 注册你的账号（使用与旧版本相同的用户名）

**步骤3：导入数据**
1. 访问 `你的网站/import.html`
2. 登录你的账号
3. 上传步骤1导出的 JSON 文件
4. 等待导入完成

---

### 📱 功能对比

| 功能 | v1.x (localStorage) | v2.0 (数据库) |
|------|---------------------|---------------|
| 用户注册 | ✅ | ✅ |
| 用户登录 | ✅ | ✅ |
| 日志管理 | ✅ | ✅ |
| 周报生成 | ✅ | ✅ |
| 管理员查看所有用户 | ❌ | ✅ |
| 多设备同步 | ❌ | ✅ |
| 修改密码 | ❌ | ✅ |
| 重置密码 | ❌ | ✅ |
| 数据导入 | ✅ | ✅ |
| 数据导出 | ✅ | ✅ |
| 云端存储 | ❌ | ✅ |
| 真正的多用户 | ❌ | ✅ |

---

### 🎯 已解决的问题

#### 原始问题（用户反馈）
> "这个网站，刚才有两个同事注册了新账号分别是bushanshan和liuyang，但管理员账号看不到他们，看看是怎么回事"

**原因**：
- v1.x 使用 localStorage，每个用户的数据只存储在自己的浏览器中
- 管理员在自己的浏览器中看不到其他用户的数据

**解决方案**：
- v2.0 使用云端数据库，所有数据集中存储
- 管理员可以通过管理面板查看所有用户
- bushanshan 和 liuyang 重新注册后，管理员可以在下拉框中看到他们

---

### 🚀 未来计划

#### 短期（近期更新）
- [ ] 邮箱验证和邮箱重置密码
- [ ] 用户个人资料编辑
- [ ] 日志搜索功能
- [ ] 日志标签系统
- [ ] 更详细的统计图表

#### 中期
- [ ] 移动端 App
- [ ] 团队协作功能
- [ ] 日志模板
- [ ] 自定义分类

#### 长期
- [ ] AI 自动生成周报
- [ ] 数据分析和洞察
- [ ] 集成第三方工具（Slack, 钉钉等）

---

### 💡 已知问题

目前没有已知的重大问题。如有问题，请访问 GitHub Issues 反馈。

---

### 🙏 致谢

感谢所有测试用户的反馈，特别是：
- bushanshan
- liuyang

他们的问题反馈促成了这次重大架构升级。

---

### 📞 获取帮助

- **文档**：查看项目根目录下的 .md 文件
- **问题反馈**：通过 GitHub Issues
- **紧急问题**：联系系统管理员

---

## 📜 历史版本

### Version 1.x - localStorage 版本
- 基于浏览器 localStorage 的单机版本
- 支持基本的日志记录和周报生成
- 用户数据隔离在各自浏览器中

---

**最后更新**: 2026-01-30
**版本**: v2.0.0
**状态**: ✅ 稳定版本
