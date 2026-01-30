# AI Agent 使用日志

一个优雅的 AI Agent 使用日志记录系统，支持**多用户账号**和**多AI模型**，帮助你追踪和总结每天使用 AI 工具的情况。

## 🌟 最新特性 (v2.1.0)

### 🤖 多AI模型支持
现在支持5种主流AI模型，用户可以自由选择：
- **Claude** (Anthropic) - claude-3-5-sonnet
- **ChatGPT** (OpenAI) - gpt-4-turbo-preview
- **Gemini** (Google) - gemini-pro
- **Ollama** (本地) - 完全免费的本地模型
- **DeepSeek** - 高性价比中文模型

### ⚡ AI功能全面升级
- **AI辅助写日志**：将简短描述扩展为完整专业的工作日志
- **智能生成标题**：自动从详细内容提取精准的任务标题
- **生成周报**：基于日志数据自动生成专业工作周报
- **工作分析**：深度分析工作模式，提供改进建议

所有AI功能现在都支持多模型，在统一的AI设置中心配置，安全加密存储在云端。

## ✨ 功能特性

### 👤 用户系统
- **多用户支持**：独立账号，数据完全隔离
- **云端同步**：PostgreSQL数据库，多设备访问
- **安全认证**：bcrypt密码加密，JWT token认证
- **管理员功能**：查看所有用户，管理用户数据

### 📝 日志记录
- **智能AI辅助**：支持多种AI模型辅助写作
- **多种任务类型**：编码、调试、学习、文档、数据分析、创意设计等
- **时长追踪**：精确记录每个任务的使用时长
- **图片附件**：支持上传多张图片，记录更直观

### 🖼️ 图片功能
- **多图上传**：一次可选择多张图片
- **实时预览**：上传前预览图片，支持单独删除
- **大图查看**：点击图片查看全屏大图
- **云端存储**：图片安全存储在数据库中
- **大小限制**：单张图片限制 5MB

### 📊 智能分析
- **周报生成**：自动统计任务数、总时长、任务分类
- **AI生成周报**：使用AI生成专业的工作周报
- **工作分析**：AI深度分析工作模式和效率
- **数据可视化**：图表展示工作分布

### 💾 数据管理
- **云端存储**：PostgreSQL数据库持久化
- **多用户隔离**：每个用户数据完全独立
- **数据导入导出**：支持JSON格式数据迁移
- **周报导出**：导出纯文本格式周报

### 🎨 设计特点
- **苹果风格**：采用 Apple Design 设计语言
- **响应式**：完美适配桌面和移动端
- **流畅动画**：毛玻璃效果、渐变、动画过渡
- **专业背景**：汽车摄影主题背景

## 🚀 快速开始

### 在线使用（推荐）
访问已部署的网站直接使用：
```
https://your-app.vercel.app
```

### 首次使用
1. 访问网站，点击「注册」
2. 输入用户名（3-20个字符）和密码（至少6个字符）
3. 注册成功后自动登录

### 配置 AI 功能
1. 登录后，点击顶部导航栏的「AI 设置」
2. 选择要使用的AI模型（Claude、ChatGPT、Gemini等）
3. 输入对应的API Key
4. 点击「保存配置」

**获取API Key：**
- **Claude**：访问 [Anthropic Console](https://console.anthropic.com/)
- **ChatGPT**：访问 [OpenAI API Keys](https://platform.openai.com/api-keys)
- **Gemini**：访问 [Google AI Studio](https://aistudio.google.com/app/apikey)
- **Ollama**：本地运行，输入服务地址（默认 http://localhost:11434）
- **DeepSeek**：访问 [DeepSeek Platform](https://platform.deepseek.com/api_keys)

### 使用AI功能
1. **AI辅助写日志**：在详细内容框输入简要描述，点击「✨ AI 辅助写日志」
2. **生成标题**：填写详细内容后，点击「✨ 生成标题」
3. **生成周报**：在周报页面点击「✨ 生成AI周报」
4. **工作分析**：查看AI对你工作模式的深度分析

### 添加记录
1. 选择日期、任务类型、输入时长
2. 在「详细内容」中描述任务详情
3. 使用AI辅助扩展为完整描述（可选）
4. 点击「生成标题」或手动输入标题
5. （可选）上传相关截图
6. 点击「保存记录」

## 🛠️ 技术栈

### 前端
- 纯 HTML + CSS + JavaScript（无框架）
- Chart.js - 数据可视化
- 响应式设计

### 后端
- Node.js + Vercel Serverless Functions
- PostgreSQL (Neon) - 云端数据库
- bcryptjs - 密码加密
- jsonwebtoken - JWT 认证

### AI集成
- Claude API (Anthropic)
- OpenAI API (ChatGPT)
- Google Generative AI API (Gemini)
- Ollama API (本地模型)
- DeepSeek API

### 部署
- Vercel - 应用托管
- Neon - PostgreSQL 数据库托管
- GitHub - 代码仓库

## 📦 本地开发

### 环境要求
- Node.js 18+
- PostgreSQL 数据库（或使用 Neon）

### 安装步骤
```bash
# 克隆仓库
git clone https://github.com/yourusername/ai-agent-journal.git
cd ai-agent-journal

# 安装依赖
npm install

# 配置环境变量
cp .env.example .env
# 编辑 .env 文件，填入数据库连接和JWT密钥

# 初始化数据库
# 运行 NEON_SETUP.md 中的 SQL 脚本

# 启动开发服务器
npm run dev
```

### 环境变量
```env
DATABASE_URL=postgresql://user:password@host:5432/database
JWT_SECRET=your-secret-key-here
ENCRYPTION_KEY=your-32-character-encryption-key
```

## 📋 版本历史

### v2.1.0 (2026-01-31) - 最新版本
- 🤖 **多AI模型支持**：Claude、ChatGPT、Gemini、Ollama、DeepSeek
- 🎨 **UI优化**：移除AI智能提取，统一AI按钮样式
- ⚡ **功能升级**：生成标题接入多模型后端API
- 🔒 **安全增强**：API Key AES加密存储
- 📚 **新增文档**：AI_FEATURES_GUIDE、MULTI_MODEL_GUIDE

### v2.0.0 (2026-01-30)
- 🚀 **架构升级**：从localStorage迁移到PostgreSQL云数据库
- 🔐 **认证系统**：JWT token认证，bcrypt密码加密
- 👥 **多用户管理**：真正的多用户系统，管理员功能
- 💾 **数据导入工具**：支持从本地版本迁移数据

### v1.11 (2026-01-30)
- ✨ 新增管理员功能
- ✨ 管理员可查看所有用户数据
- ✨ 单用户/全部用户数据导出
- ✨ 团队统计信息展示

### v1.9 (2026-01-30)
- ✨ 新增用户注册和登录系统
- ✨ 多用户数据完全隔离
- ✨ 密码加密存储和安全认证
- ✨ 用户信息展示和退出功能
- ✨ 支持多用户无缝切换

### v1.8 (2026-01-30)
- ✨ 新增图片上传功能
- ✨ 支持多图预览和删除
- ✨ 大图查看模态框
- ✨ 图片在历史记录和周报中展示

### v1.7 (2026-01-28)
- ✨ 标题预览功能
- ✨ 工作流优化
- ✨ 提交流程简化

[查看完整版本历史](ai_agent_journal.html)

## 🔒 隐私说明

- 所有数据（包括用户账号、图片、日志）仅保存在浏览器本地 localStorage
- 密码使用 Base64 编码存储在本地
- 每个用户的数据完全隔离，互不干扰
- Claude API 密钥按用户独立存储，不会上传到任何服务器
- 不收集任何用户数据
- 图片转为 base64 格式本地存储

## 🛠️ 技术栈

- 纯 HTML + CSS + JavaScript
- 无需后端服务器
- 使用 localStorage 持久化和数据隔离
- Claude API（可选）用于标题提取
- FileReader API 用于图片处理
- Base64 编码用于密码加密

## 📱 浏览器支持

推荐使用现代浏览器：
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## 💡 使用建议

1. **定期导出数据**：虽然使用 localStorage 持久化，但建议定期导出数据备份
2. **密码安全**：请设置足够复杂的密码（至少6个字符）
3. **图片大小**：单张图片限制5MB，建议压缩后上传
4. **清除数据**：清除浏览器数据会删除所有账号和记录，请谨慎操作
5. **跨设备使用**：导出本地数据，在其他设备/浏览器通过import.html导入

## 📄 许可

MIT License

## 🙋 反馈

如有问题或建议，欢迎提 Issue。

---

Made with ❤️ by AI Agent
