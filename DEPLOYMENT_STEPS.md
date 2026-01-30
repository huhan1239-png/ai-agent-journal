# 📋 详细部署步骤

按照这个清单一步步操作，完成后告诉我，我会立即帮你修改前端代码。

---

## ✅ 步骤 1：创建 Neon 数据库

### 1.1 注册/登录 Neon
1. 访问：https://neon.tech
2. 点击 **"Sign Up"** 或 **"Sign in with GitHub"**
3. 用你的GitHub账号登录（最快）

### 1.2 获取数据库连接字符串
1. 登录后会自动创建一个项目
2. 在项目主页面，找到 **"Connection string"**
3. 复制整个连接字符串，它看起来像这样：
   ```
   postgres://username:password@ep-xxx-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require
   ```
4. **保存这个字符串**，待会要用

### 1.3 初始化数据库表
1. 在Neon控制台，点击左侧的 **"SQL Editor"**
2. 打开本地文件 `NEON_SETUP.md`
3. 复制里面 **"第二步"** 的完整SQL代码
4. 粘贴到SQL Editor中
5. 点击 **"Run"** 执行
6. 如果看到 "Success" 就说明表创建成功了

---

## ✅ 步骤 2：配置 Vercel 环境变量

### 2.1 进入 Vercel 项目设置
1. 访问：https://vercel.com
2. 找到你的项目 **"ai-agent-journal"**
3. 点击进入项目
4. 点击顶部的 **"Settings"**

### 2.2 添加环境变量
1. 在左侧菜单点击 **"Environment Variables"**
2. 添加第一个变量：
   - **Name**: `DATABASE_URL`
   - **Value**: 粘贴你刚才复制的Neon连接字符串
   - 选择所有环境：Production, Preview, Development
   - 点击 **"Save"**

3. 添加第二个变量：
   - **Name**: `JWT_SECRET`
   - **Value**: 随便输入一个长字符串，比如：`my-super-secret-jwt-key-20240130-xyz`
   - 选择所有环境：Production, Preview, Development
   - 点击 **"Save"**

---

## ✅ 步骤 3：安装依赖并部署

### 3.1 打开终端
在Mac上按 `Cmd + Space`，输入 `Terminal`，打开终端。

### 3.2 执行命令
在终端中依次执行以下命令：

```bash
# 1. 进入项目目录
cd "/Users/huhan/claudetry/agent journal"

# 2. 安装依赖
npm install

# 3. 提交代码
git add .
git commit -m "Add backend with Neon PostgreSQL"

# 4. 推送到GitHub
git push
```

### 3.3 等待自动部署
- 推送后，Vercel会自动检测到更新
- 在Vercel控制台可以看到部署进度
- 等待1-2分钟直到显示 "Ready"

---

## ✅ 步骤 4：验证部署

部署完成后，尝试访问这些API端点（把 `your-domain.vercel.app` 替换成你的实际域名）：

```
https://your-domain.vercel.app/api/auth/register
```

如果返回 `{"error":"Method not allowed"}` 说明API已经正常运行了（因为GET方法不被允许，这是正确的）。

---

## 遇到问题？

### 常见问题

**Q1: npm install 报错？**
- 检查是否在正确的目录：`pwd` 应该显示 `/Users/huhan/claudetry/agent journal`
- 删除 `node_modules` 文件夹后重试：`rm -rf node_modules && npm install`

**Q2: git push 报错？**
- 可能需要先设置远程仓库：`git remote -v` 查看
- 如果没有显示GitHub地址，需要重新关联仓库

**Q3: Vercel没有自动部署？**
- 检查Vercel项目是否连接到正确的GitHub仓库
- 手动触发部署：在Vercel控制台点击 "Deployments" → "Deploy"

---

## 完成后

**告诉我：**
1. ✅ Neon数据库创建成功
2. ✅ Vercel环境变量配置完成
3. ✅ npm install 成功
4. ✅ git push 成功
5. ✅ Vercel部署完成

然后我会立即帮你修改前端代码！

---

**预计时间：10分钟**
**当前进度：等待你的操作...**
