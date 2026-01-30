# Vercel Postgres 集成指南

## 项目结构

这个方案使用 Vercel Serverless Functions + Vercel Postgres数据库，所有代码都在你的项目中。

```
agent journal/
├── api/                      # Serverless API路由
│   ├── auth/
│   │   ├── register.js      # 注册API
│   │   └── login.js         # 登录API
│   ├── entries/
│   │   ├── list.js          # 获取日志列表
│   │   ├── create.js        # 创建日志
│   │   └── delete.js        # 删除日志
│   └── admin/
│       ├── users.js         # 获取用户列表（仅管理员）
│       └── user-entries.js  # 获取指定用户的日志（仅管理员）
├── index.html               # 前端页面
├── package.json             # 项目配置
└── vercel.json              # Vercel配置
```

## 第一步：在 Vercel 创建 Postgres 数据库

1. 登录 https://vercel.com
2. 进入你的项目 Dashboard
3. 点击顶部的 "Storage" 标签
4. 点击 "Create Database"
5. 选择 "Postgres"
6. 填写数据库名称: `ai-agent-journal-db`
7. 选择区域: `Hong Kong (hkg1)` 或其他近的区域
8. 点击 "Create"

## 第二步：执行数据库初始化脚本

数据库创建完成后：

1. 点击刚创建的数据库
2. 进入 "Query" 标签
3. 执行以下SQL：

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
INSERT INTO users (username, password_hash, is_admin)
VALUES ('admin', '$2b$10$rBV2cXfCEZNbLaQz.D.Qx.YJ5yZV0RH8KJXhMZvXK0YXwHQZKJ.4W', true)
ON CONFLICT (username) DO NOTHING;
```

## 第三步：获取数据库连接信息

在数据库页面的 ".env.local" 标签中，你会看到：

```env
POSTGRES_URL="postgres://..."
POSTGRES_PRISMA_URL="postgres://..."
POSTGRES_URL_NON_POOLING="postgres://..."
POSTGRES_USER="..."
POSTGRES_HOST="..."
POSTGRES_PASSWORD="..."
POSTGRES_DATABASE="..."
```

这些环境变量会自动注入到你的Vercel项目中，无需手动配置。

## 第四步：项目初始化

在项目根目录执行：

```bash
npm init -y
npm install @vercel/postgres bcrypt jsonwebtoken
```

## 第五步：创建 vercel.json

这个文件配置路由和环境：

```json
{
  "functions": {
    "api/**/*.js": {
      "memory": 1024,
      "maxDuration": 10
    }
  },
  "rewrites": [
    { "source": "/", "destination": "/index.html" }
  ]
}
```

## 第六步：部署到 Vercel

1. 确保项目已推送到 GitHub
2. 在 Vercel Dashboard 中连接你的 GitHub 仓库
3. Vercel 会自动检测到数据库并注入环境变量
4. 点击 "Deploy"

## 第七步：设置管理员

默认管理员账号：
- 用户名: `admin`
- 密码: `admin123`

登录后请立即修改密码。要添加更多管理员，执行SQL：

```sql
UPDATE users
SET is_admin = true
WHERE username IN ('boss', 'manager');
```

## API 端点说明

所有API都在 `/api/*` 路径下：

- `POST /api/auth/register` - 注册
- `POST /api/auth/login` - 登录
- `GET /api/entries/list?token=xxx` - 获取当前用户日志
- `POST /api/entries/create` - 创建日志
- `DELETE /api/entries/delete?id=xxx&token=xxx` - 删除日志
- `GET /api/admin/users?token=xxx` - 获取所有用户（仅管理员）
- `GET /api/admin/user-entries?userId=xxx&token=xxx` - 获取指定用户日志（仅管理员）

## 本地开发

```bash
# 安装 Vercel CLI
npm i -g vercel

# 链接项目
vercel link

# 拉取环境变量
vercel env pull .env.local

# 本地运行
vercel dev
```

访问 http://localhost:3000

## 常见问题

### Q: 如何重置密码？
A: 在数据库 Query 中执行：
```sql
-- 密码重置为 newpassword123
UPDATE users
SET password_hash = '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdLiLiq/a'
WHERE username = 'your_username';
```

### Q: 如何查看所有用户？
A: 在数据库 Query 中执行：
```sql
SELECT id, username, is_admin, created_at
FROM users
ORDER BY created_at DESC;
```

### Q: 如何删除用户？
A: 在数据库 Query 中执行：
```sql
DELETE FROM users WHERE username = 'username_to_delete';
-- 注意：相关的日志也会被自动删除（CASCADE）
```

## 安全建议

1. 生产环境使用强密码
2. 定期备份数据库
3. 限制管理员账号数量
4. 使用HTTPS（Vercel自动提供）
5. 考虑添加速率限制防止暴力破解
