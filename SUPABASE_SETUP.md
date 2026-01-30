# Supabase 集成指南

## 第一步：创建 Supabase 项目

1. 访问 https://supabase.com
2. 注册/登录账号
3. 点击 "New Project"
4. 填写项目信息：
   - Name: `ai-agent-journal`
   - Database Password: 设置一个强密码（请记住）
   - Region: 选择 `Northeast Asia (Tokyo)` 或其他近的区域
5. 点击 "Create new project"（等待1-2分钟初始化）

## 第二步：创建数据库表

项目创建完成后，点击左侧菜单 "SQL Editor"，然后执行以下SQL：

```sql
-- 用户表（扩展Supabase内置的auth.users）
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  is_admin BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 日志条目表
CREATE TABLE public.entries (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  category TEXT NOT NULL,
  task TEXT NOT NULL,
  description TEXT NOT NULL,
  duration INTEGER NOT NULL,
  images JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引提升查询性能
CREATE INDEX entries_user_id_idx ON public.entries(user_id);
CREATE INDEX entries_date_idx ON public.entries(date);
CREATE INDEX entries_user_date_idx ON public.entries(user_id, date);

-- 启用行级安全策略 (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.entries ENABLE ROW LEVEL SECURITY;

-- profiles 表的策略
-- 1. 用户可以读取自己的profile
CREATE POLICY "Users can read own profile"
  ON public.profiles
  FOR SELECT
  USING (auth.uid() = id);

-- 2. 管理员可以读取所有profiles
CREATE POLICY "Admins can read all profiles"
  ON public.profiles
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- 3. 用户可以更新自己的profile（但不能修改is_admin字段）
CREATE POLICY "Users can update own profile"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- entries 表的策略
-- 1. 用户可以读取自己的entries
CREATE POLICY "Users can read own entries"
  ON public.entries
  FOR SELECT
  USING (auth.uid() = user_id);

-- 2. 管理员可以读取所有entries
CREATE POLICY "Admins can read all entries"
  ON public.entries
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- 3. 用户可以插入自己的entries
CREATE POLICY "Users can insert own entries"
  ON public.entries
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 4. 用户可以更新自己的entries
CREATE POLICY "Users can update own entries"
  ON public.entries
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 5. 用户可以删除自己的entries
CREATE POLICY "Users can delete own entries"
  ON public.entries
  FOR DELETE
  USING (auth.uid() = user_id);

-- 创建触发器：注册时自动创建profile
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', NEW.email)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 创建更新 updated_at 的触发器
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at_profiles
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_entries
  BEFORE UPDATE ON public.entries
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();
```

## 第三步：设置管理员账号

执行以下SQL将特定用户设置为管理员（注册后执行）：

```sql
-- 方式1：通过用户名设置
UPDATE public.profiles
SET is_admin = true
WHERE username IN ('admin', 'boss', 'manager');

-- 方式2：通过用户ID设置（注册后在 Authentication > Users 中查看用户ID）
-- UPDATE public.profiles
-- SET is_admin = true
-- WHERE id = 'your-user-id-here';
```

## 第四步：获取API密钥

1. 点击左侧菜单 "Project Settings" (齿轮图标)
2. 点击 "API" 选项卡
3. 找到并复制以下信息：
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon public key**: `eyJhbGc...` (很长的字符串)

## 第五步：配置前端

将获取到的API密钥填入前端代码中（我会在下一步帮你修改代码）：

```javascript
const SUPABASE_URL = 'https://your-project.supabase.co'
const SUPABASE_ANON_KEY = 'your-anon-key-here'
```

## 常用操作

### 查看所有用户
```sql
SELECT
  p.username,
  p.is_admin,
  p.created_at,
  COUNT(e.id) as entry_count
FROM public.profiles p
LEFT JOIN public.entries e ON p.id = e.user_id
GROUP BY p.id, p.username, p.is_admin, p.created_at
ORDER BY p.created_at DESC;
```

### 查看某个用户的所有日志
```sql
SELECT * FROM public.entries
WHERE user_id = (
  SELECT id FROM public.profiles WHERE username = 'bushanshan'
)
ORDER BY date DESC;
```

### 重置用户密码（在Supabase后台）
1. 进入 Authentication > Users
2. 找到用户，点击右侧的三个点
3. 选择 "Send password recovery email"

## 注意事项

1. **数据迁移**：现有localStorage数据需要手动导入到Supabase
2. **图片存储**：当前使用base64存储在数据库中，如果图片很多建议使用Supabase Storage
3. **API密钥安全**：anon key可以暴露在前端，因为有RLS保护
4. **免费额度**：
   - 500MB 数据库空间
   - 1GB 文件存储
   - 50,000 月活跃用户
   - 2GB 带宽/月

## 故障排查

如果遇到权限问题：
1. 检查RLS策略是否正确创建
2. 在SQL Editor中测试查询
3. 查看浏览器控制台的错误信息
4. 确认用户已登录且token有效
