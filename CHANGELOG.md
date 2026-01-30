# 📋 AI Agent Journal 更新日志

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
