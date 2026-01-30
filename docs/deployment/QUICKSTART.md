# 快速开始指南 🚀

## 当前状态 ✅

所有后端API已经准备好！现在需要3个简单步骤就能完成部署：

## 步骤 1：创建Neon数据库（3分钟）

1. 访问 **https://neon.tech**
2. 用GitHub账号登录（或注册新账号）
3. 会自动创建一个项目
4. 复制数据库连接字符串（类似 `postgres://username:password@...`）
5. 在Neon的"SQL Editor"中执行`NEON_SETUP.md`中的SQL脚本

## 步骤 2：配置Vercel环境变量（2分钟）

1. 进入你的Vercel项目
2. Settings → Environment Variables
3. 添加两个变量：
   - `DATABASE_URL` = 你的Neon连接字符串
   - `JWT_SECRET` = 随机字符串（例如：`my-secret-key-2024-xxx`）

## 步骤 3：安装依赖并部署（2分钟）

```bash
cd "/Users/huhan/claudetry/agent journal"
npm install
git add .
git commit -m "Add backend with Neon PostgreSQL"
git push
```

Vercel会自动部署！

## 下一步：修改前端

前端需要改用API而不是localStorage。我现在就帮你完成这个修改。

## 测试账号

部署完成后：
- 管理员账号：`admin` / `admin123`
- 让同事注册新账号，管理员就能看到了！

---

**预计总时间**：10分钟
**当前进度**：后端100%完成 | 前端即将开始修改
