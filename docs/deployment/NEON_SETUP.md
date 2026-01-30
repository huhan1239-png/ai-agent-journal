# Neon PostgreSQL 集成指南（免费方案）

## 为什么选择 Neon？

- ✅ 完全免费（0.5GB存储 + 10GB数据传输/月）
- ✅ 5分钟即可设置完成
- ✅ 原生PostgreSQL，兼容性好
- ✅ Serverless，自动休眠节省资源
- ✅ 无需信用卡

## 第一步：创建 Neon 数据库（3分钟）

1. 访问 https://neon.tech
2. 点击 "Sign Up" 注册账号（可以用GitHub账号登录）
3. 创建后会自动创建一个项目
4. 在项目页面，你会看到数据库连接字符串，类似：
   ```
   postgres://username:password@ep-xxx-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require
   ```
5. **复制这个连接字符串**，我们后面会用到

## 第二步：初始化数据库表（2分钟）

1. 在Neon控制台，点击 "SQL Editor"
2. 执行以下SQL：

```sql
-- 用户表
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    is_admin BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 日志条目表
CREATE TABLE IF NOT EXISTS entries (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    date DATE NOT NULL,
    category VARCHAR(50) NOT NULL,
    task TEXT NOT NULL,
    description TEXT NOT NULL,
    duration INTEGER NOT NULL,
    images JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_entries_user_id ON entries(user_id);
CREATE INDEX IF NOT EXISTS idx_entries_date ON entries(date);
CREATE INDEX IF NOT EXISTS idx_entries_user_date ON entries(user_id, date);

-- 创建管理员账号（密码：admin123）
-- 注意：这是bcrypt加密后的密码哈希值
INSERT INTO users (username, password_hash, is_admin)
VALUES ('admin', '$2b$10$rBV2cXfCEZNbLaQz.D.Qx.YJ5yZV0RH8KJXhMZvXK0YXwHQZKJ.4W', true)
ON CONFLICT (username) DO NOTHING;
```

3. 点击 "Run" 执行

## 第三步：在 Vercel 添加环境变量（2分钟）

1. 进入你的 Vercel 项目
2. 点击 "Settings" → "Environment Variables"
3. 添加以下变量：

| 变量名 | 值 |
|--------|-----|
| `DATABASE_URL` | 你从Neon复制的连接字符串 |
| `JWT_SECRET` | 随机字符串，例如：`my-super-secret-jwt-key-2024` |

4. 点击 "Save"

## 第四步：更新项目依赖

修改 `package.json`：

```json
{
  "name": "ai-agent-journal",
  "version": "1.0.0",
  "description": "空间智能部-Agent实战之路系统",
  "scripts": {
    "dev": "vercel dev",
    "deploy": "vercel --prod"
  },
  "dependencies": {
    "pg": "^8.11.3",
    "bcrypt": "^5.1.1",
    "jsonwebtoken": "^9.0.2"
  }
}
```

然后安装：
```bash
cd "/Users/huhan/claudetry/agent journal"
npm install
```

## 第五步：测试

本地测试（可选）：
```bash
# 设置环境变量
export DATABASE_URL="your-neon-connection-string"
export JWT_SECRET="your-secret-key"

# 运行
vercel dev
```

## 第六步：部署

```bash
git add .
git commit -m "Add Neon PostgreSQL backend"
git push
```

Vercel 会自动部署。

## 管理员账号

- 用户名: `admin`
- 密码: `admin123`

登录后请尽快修改密码。

## 添加新管理员

在 Neon SQL Editor 中执行：
```sql
UPDATE users
SET is_admin = true
WHERE username = 'your_username';
```

## 查看所有用户

```sql
SELECT
    u.id,
    u.username,
    u.is_admin,
    u.created_at,
    COUNT(e.id) as entry_count
FROM users u
LEFT JOIN entries e ON u.id = e.user_id
GROUP BY u.id
ORDER BY u.created_at DESC;
```

## 常见问题

### Q: 数据库连接超时？
A: Neon的免费版会自动休眠，第一次连接可能需要几秒钟唤醒。

### Q: 如何备份数据？
A: 在Neon控制台的 "Branches" 可以创建分支作为备份。

### Q: 可以升级吗？
A: 免费版足够个人使用。需要更多资源时可以升级到付费版。

## 下一步

现在数据库已经设置好了，接下来我会帮你修改前端代码来对接这些API。
