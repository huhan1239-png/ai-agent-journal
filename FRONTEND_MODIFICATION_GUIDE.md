# 前端代码修改指南

由于index.html文件很大（2300行），我会采用**增量修改**的方式，只修改JavaScript部分的关键函数。

CSS样式保持不变，只需要修改 `<script>` 标签内的JavaScript代码。

---

## 需要修改的关键变量和函数

### 1. 全局变量（在 `<script>` 标签开始处添加）

```javascript
// API基础URL（替换成你的Vercel域名）
const API_BASE_URL = window.location.origin; // 自动使用当前域名

// 全局变量
let currentUser = null;
let currentToken = null;
let isAdmin = false;
let viewingUser = null;
let entries = [];
let currentImages = [];
```

### 2. Token管理函数（新增）

```javascript
// 保存token到localStorage
function saveToken(token) {
    localStorage.setItem('authToken', token);
    currentToken = token;
}

// 获取token
function getToken() {
    if (!currentToken) {
        currentToken = localStorage.getItem('authToken');
    }
    return currentToken;
}

// 清除token
function clearToken() {
    localStorage.removeItem('authToken');
    currentToken = null;
}
```

### 3. 修改 `handleRegister` 函数

替换原来的 `handleRegister` 函数为：

```javascript
async function handleRegister(event) {
    event.preventDefault();

    const username = document.getElementById('registerUsername').value.trim();
    const password = document.getElementById('registerPassword').value;
    const passwordConfirm = document.getElementById('registerPasswordConfirm').value;

    // 验证
    if (username.length < 3 || username.length > 20) {
        showAuthError('用户名长度必须在3-20个字符之间');
        return;
    }

    if (password.length < 6) {
        showAuthError('密码长度至少为6个字符');
        return;
    }

    if (password !== passwordConfirm) {
        showAuthError('两次输入的密码不一致');
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();

        if (!response.ok) {
            showAuthError(data.error || '注册失败');
            return;
        }

        // 注册成功，自动登录
        const loginResponse = await fetch(`${API_BASE_URL}/api/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });

        const loginData = await loginResponse.json();

        if (loginResponse.ok) {
            currentUser = loginData.user;
            isAdmin = loginData.user.isAdmin;
            saveToken(loginData.token);
            document.getElementById('registerForm').reset();
            showApp();
        }
    } catch (error) {
        console.error('Register error:', error);
        showAuthError('注册失败，请重试');
    }
}
```

### 4. 修改 `handleLogin` 函数

替换原来的 `handleLogin` 函数为：

```javascript
async function handleLogin(event) {
    event.preventDefault();

    const username = document.getElementById('loginUsername').value.trim();
    const password = document.getElementById('loginPassword').value;

    if (!username || !password) {
        showAuthError('用户名和密码不能为空');
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();

        if (!response.ok) {
            showAuthError(data.error || '登录失败');
            return;
        }

        // 登录成功
        currentUser = data.user;
        isAdmin = data.user.isAdmin;
        saveToken(data.token);

        document.getElementById('loginForm').reset();
        showApp();

    } catch (error) {
        console.error('Login error:', error);
        showAuthError('登录失败，请重试');
    }
}
```

### 5. 修改 `initAuth` 函数

```javascript
async function initAuth() {
    const token = getToken();

    if (token) {
        // 验证token是否有效，通过加载用户数据来验证
        try {
            await loadEntries(); // 尝试加载数据
            showApp();
        } catch (error) {
            // Token无效，清除并显示登录页
            clearToken();
            showAuth();
        }
    } else {
        showAuth();
    }
}
```

### 6. 修改 `handleLogout` 函数

```javascript
function handleLogout() {
    if (confirm('确定要退出登录吗？')) {
        currentUser = null;
        currentToken = null;
        isAdmin = false;
        viewingUser = null;
        entries = [];
        clearToken();
        showAuth();
    }
}
```

---

## 接下来我会继续提供其他函数的修改...

**告诉我：你想要我**
1. **创建一个完整的新index.html文件**（你可以直接替换）
2. **继续提供分步修改指南**（你可以逐个复制粘贴修改）

哪种方式更适合你？
