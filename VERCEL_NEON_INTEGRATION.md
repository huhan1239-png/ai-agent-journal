# 🚀 在Vercel中直接部署Neon数据库

这是最简单的方式！Vercel会自动配置所有环境变量。

---

## ✅ 步骤 1：在Vercel中集成Neon

### 1.1 进入Storage集成页面
1. 访问：https://vercel.com
2. 进入你的项目 **"ai-agent-journal"**
3. 点击顶部的 **"Storage"** 标签
4. 找到 **"Neon"** 或点击 **"Browse Storage Integrations"**

### 1.2 创建Neon集成
1. 找到 **"Neon Postgres"** 卡片
2. 点击 **"Add Integration"** 或 **"Connect"**
3. 选择你的Vercel账号和项目
4. 点击 **"Continue"** 或 **"Install"**
5. Vercel会跳转到Neon授权页面
6. 点击 **"Authorize"** 授权Vercel访问Neon

### 1.3 创建数据库
1. 授权后会回到Vercel
2. 选择 **"Create new database"**
3. 数据库名称：`ai-agent-journal-db`（或保持默认）
4. 区域：选择 **"AWS US East"** 或最近的区域
5. 点击 **"Create"**

### 1.4 连接数据库到项目
1. 选择要连接的环境：**Production, Preview, Development**（全选）
2. 点击 **"Connect"**
3. 完成！环境变量 `DATABASE_URL` 已自动添加

---

## ✅ 步骤 2：添加JWT_SECRET环境变量

数据库已自动配置，但还需要手动添加JWT密钥：

1. 在Vercel项目中，点击 **"Settings"** → **"Environment Variables"**
2. 添加新变量：
   - **Name**: `JWT_SECRET`
   - **Value**: `my-super-secret-jwt-key-20240130-xyz`（随便一个长字符串）
   - 选择所有环境：Production, Preview, Development
   - 点击 **"Save"**

---

## ✅ 步骤 3：初始化数据库表

### 3.1 获取数据库连接信息
1. 在Vercel项目的 **"Storage"** 标签
2. 找到刚创建的Neon数据库
3. 点击进入数据库详情页
4. 点击 **"Open in Neon"** 或找到 **"Query"** 按钮

### 3.2 执行SQL脚本
1. 在Neon控制台的 **"SQL Editor"** 中
2. 复制下面的SQL代码并执行：

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

3. 点击 **"Run"** 执行
4. 看到成功消息即可

---

## ✅ 步骤 4：部署代码

### 4.1 安装依赖并推送
在终端执行：

```bash
cd "/Users/huhan/claudetry/agent journal"
npm install
git add .
git commit -m "Add Neon backend integration"
git push
```

### 4.2 等待部署完成
- Vercel会自动检测到更新并部署
- 在Vercel控制台查看部署进度
- 等待显示 **"Ready"**

---

## ✅ 验证部署成功

部署完成后，访问（替换成你的域名）：
```
https://your-app.vercel.app/api/auth/register
```

看到 `{"error":"Method not allowed"}` 就说明API正常运行了！

---

## 📋 完成清单

告诉我你完成了：
- [ ] 在Vercel中连接了Neon数据库
- [ ] 添加了JWT_SECRET环境变量
- [ ] 在Neon SQL Editor中执行了初始化脚本
- [ ] npm install 成功
- [ ] git push 成功
- [ ] Vercel部署完成

**完成后我立即帮你修改前端代码！**

---

## 💡 提示

如果在Vercel的Storage标签中找不到Neon选项：
1. 可以直接访问：https://vercel.com/integrations/neon
2. 点击 **"Add Integration"**
3. 选择你的项目进行集成

---

**预计时间：5-8分钟**
**优势：环境变量自动配置，更简单！**
