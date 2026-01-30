# ⚙️ 环境变量配置

在 Vercel 项目中需要配置以下环境变量。

## 在 Vercel 中配置

1. 访问 https://vercel.com/dashboard
2. 选择你的项目
3. 点击 **Settings** → **Environment Variables**
4. 添加以下变量

---

## 必需的环境变量

### 1. DATABASE_URL
- **说明**: PostgreSQL 数据库连接字符串
- **来源**: Neon 数据库
- **格式**: `postgresql://user:password@host/database?sslmode=require`
- **环境**: Production, Preview, Development

**获取方式**:
1. 登录 Neon 控制台
2. 选择你的项目
3. 复制 Connection String

### 2. JWT_SECRET
- **说明**: JWT token 签名密钥
- **格式**: 任意 32+ 字符的随机字符串
- **环境**: Production, Preview, Development

**推荐生成方式**:
```bash
# 在终端执行
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

或使用在线工具：https://randomkeygen.com/

### 3. ENCRYPTION_KEY
- **说明**: API Key 加密密钥（AES-256）
- **格式**: 任意 32+ 字符的随机字符串
- **环境**: Production, Preview, Development

**推荐生成方式**:
```bash
# 在终端执行
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

⚠️ **重要**：
- 密钥一旦设置，不要轻易修改
- 修改 ENCRYPTION_KEY 会导致所有已保存的 API Key 无法解密
- 如需修改，请先通知所有用户重新配置 API Key

---

## 配置示例

```env
# 数据库连接
DATABASE_URL=postgresql://user:password@ep-xxx.region.aws.neon.tech/aiagentjournal?sslmode=require

# JWT密钥（用于生成登录token）
JWT_SECRET=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6

# 加密密钥（用于加密用户的API Key）
ENCRYPTION_KEY=z6y5x4w3v2u1t0s9r8q7p6o5n4m3l2k1j0i9h8g7f6e5d4c3b2a1
```

---

## 安全建议

### ✅ 推荐做法

1. **使用强密钥**
   - 至少 32 个字符
   - 包含字母、数字、特殊符号
   - 使用随机生成器生成

2. **定期轮换**
   - 每 3-6 个月更换 JWT_SECRET
   - ENCRYPTION_KEY 一般不需要更换（会影响已存储的数据）

3. **权限最小化**
   - 数据库用户只授予必要权限
   - 不要使用 root/admin 账号

4. **监控使用**
   - 定期检查 Vercel 的部署日志
   - 关注异常的 API 调用

### ❌ 避免做法

1. **不要硬编码**
   - 不要把密钥写在代码中
   - 不要提交到 Git 仓库

2. **不要共享**
   - 不要在文档中写明实际密钥值
   - 不要在聊天、邮件中传递

3. **不要使用弱密钥**
   - 不要使用 `123456`、`password` 等简单密钥
   - 不要使用可预测的密钥

---

## 验证配置

配置完成后，可以通过以下方式验证：

### 1. 部署日志
查看 Vercel 部署日志，确保没有环境变量相关的错误

### 2. 功能测试
- 注册新用户 → 验证 JWT_SECRET
- 保存 API Key → 验证 ENCRYPTION_KEY
- 查看日志 → 验证 DATABASE_URL

### 3. 控制台检查
在浏览器开发者工具中，检查 API 响应是否正常

---

## 常见问题

### Q: DATABASE_URL 格式错误会怎样？
**A**: 所有数据库操作都会失败，无法登录、注册、保存数据

### Q: JWT_SECRET 修改后有什么影响？
**A**: 所有已登录用户的 token 失效，需要重新登录

### Q: ENCRYPTION_KEY 丢失或修改会怎样？
**A**: 已保存的 API Key 无法解密，用户需要重新配置

### Q: 可以在本地开发中使用 .env 文件吗？
**A**: 可以，但不要提交到 Git
```bash
# .env.local
DATABASE_URL=postgresql://...
JWT_SECRET=...
ENCRYPTION_KEY=...
```

然后在 `.gitignore` 中添加：
```
.env
.env.local
.env.*.local
```

---

## 配置检查清单

在部署前，确保：

- [ ] DATABASE_URL 已配置并可连接
- [ ] JWT_SECRET 已配置（32+ 字符）
- [ ] ENCRYPTION_KEY 已配置（32+ 字符）
- [ ] 所有密钥都已记录在安全的地方
- [ ] 没有在代码中硬编码任何密钥
- [ ] .env 文件已添加到 .gitignore

---

**最后更新**: 2026-01-30
**相关文档**: [部署指南](VERCEL_SETUP.md)
