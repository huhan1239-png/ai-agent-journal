// ==================== API配置 ====================
const API_BASE_URL = window.location.origin; // 自动使用当前域名

// ==================== 全局变量 ====================
let currentUser = null;
let currentToken = null;
let isAdmin = false;
let viewingUser = null;
let entries = [];
let currentImages = [];

// ==================== Token管理 ====================
function saveToken(token) {
    localStorage.setItem('authToken', token);
    currentToken = token;
}

function getToken() {
    if (!currentToken) {
        currentToken = localStorage.getItem('authToken');
    }
    return currentToken;
}

function clearToken() {
    localStorage.removeItem('authToken');
    currentToken = null;
}

// ==================== 账号系统 ====================
// 初始化账号系统
async function initAuth() {
    const token = getToken();
    if (token) {
        try {
            // 验证token并获取用户信息
            const response = await fetch(`${API_BASE_URL}/api/auth?action=verify&token=${token}`);
            const data = await response.json();

            if (!response.ok) {
                throw new Error('Token无效');
            }

            // 设置用户信息
            currentUser = data.user;
            isAdmin = data.user.isAdmin;

            // 显示应用界面
            showApp();
        } catch (error) {
            console.error('Token validation failed:', error);
            clearToken();
            showAuth();
        }
    } else {
        showAuth();
    }
}

// 显示登录界面
function showAuth() {
    document.getElementById('authContainer').classList.add('active');
    document.getElementById('appContainer').classList.remove('active');
}

// 显示主应用
async function showApp() {
    document.getElementById('authContainer').classList.remove('active');
    document.getElementById('appContainer').classList.add('active');
    document.getElementById('usernameBadge').textContent = currentUser.username;

    // 显示管理员标识和面板
    if (isAdmin) {
        document.getElementById('adminBadge').style.display = 'inline-block';
        document.getElementById('adminPanel').style.display = 'block';
        await loadUserList();
    } else {
        document.getElementById('adminBadge').style.display = 'none';
        document.getElementById('adminPanel').style.display = 'none';
    }

    // 重置查看用户
    viewingUser = null;
    document.getElementById('viewingAsBanner').style.display = 'none';

    await initApp();
}

// 切换登录/注册标签
function switchAuthTab(tab) {
    const tabs = document.querySelectorAll('.auth-tab');
    const forms = document.querySelectorAll('.auth-form');

    tabs.forEach(t => t.classList.remove('active'));
    forms.forEach(f => f.classList.remove('active'));

    if (tab === 'login') {
        tabs[0].classList.add('active');
        document.getElementById('loginForm').classList.add('active');
    } else {
        tabs[1].classList.add('active');
        document.getElementById('registerForm').classList.add('active');
    }

    hideAuthError();
}

// 显示错误信息
function showAuthError(message) {
    const errorDiv = document.getElementById('authError');
    errorDiv.textContent = message;
    errorDiv.classList.add('show');
}

// 隐藏错误信息
function hideAuthError() {
    document.getElementById('authError').classList.remove('show');
}

// 注册处理
async function handleRegister(event) {
    event.preventDefault();

    const username = document.getElementById('registerUsername').value.trim();
    const password = document.getElementById('registerPassword').value;
    const passwordConfirm = document.getElementById('registerPasswordConfirm').value;

    // 验证用户名
    if (username.length < 3 || username.length > 20) {
        showAuthError('用户名长度必须在3-20个字符之间');
        return;
    }

    // 验证密码
    if (password.length < 6) {
        showAuthError('密码长度至少为6个字符');
        return;
    }

    if (password !== passwordConfirm) {
        showAuthError('两次输入的密码不一致');
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/api/auth`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ action: 'register', username, password })
        });

        const data = await response.json();

        if (!response.ok) {
            showAuthError(data.error || '注册失败');
            return;
        }

        // 注册成功，自动登录
        const loginResponse = await fetch(`${API_BASE_URL}/api/auth`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ action: 'login', username, password })
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
        showAuthError('注册失败，请检查网络连接');
    }
}

// 登录处理
async function handleLogin(event) {
    event.preventDefault();

    const username = document.getElementById('loginUsername').value.trim();
    const password = document.getElementById('loginPassword').value;

    if (!username || !password) {
        showAuthError('用户名和密码不能为空');
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/api/auth`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ action: 'login', username, password })
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
        showAuthError('登录失败，请检查网络连接');
    }
}

// 退出登录
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

// ==================== 管理员功能 ====================
// 加载用户列表
async function loadUserList() {
    try {
        const token = getToken();
        const response = await fetch(`${API_BASE_URL}/api/admin?action=users&token=${token}`);
        const data = await response.json();

        if (!response.ok) {
            console.error('Failed to load users:', data.error);
            return;
        }

        const userSelect = document.getElementById('userSelect');
        userSelect.innerHTML = '<option value="">选择要查看的用户...</option>';

        data.users.forEach(user => {
            const option = document.createElement('option');
            option.value = user.id;
            option.textContent = `${user.username} (${user.entry_count}条日志)`;
            userSelect.appendChild(option);
        });

        // 更新统计信息
        updateAdminInfo(data.stats);
    } catch (error) {
        console.error('Load users error:', error);
    }
}

// 更新管理员信息面板
function updateAdminInfo(stats) {
    const infoHTML = `
        <div class="admin-info-row">
            <span class="admin-info-label">总用户数</span>
            <span class="admin-info-value">${stats.totalUsers} 个</span>
        </div>
        <div class="admin-info-row">
            <span class="admin-info-label">总日志记录</span>
            <span class="admin-info-value">${stats.totalEntries} 条</span>
        </div>
        <div class="admin-info-row">
            <span class="admin-info-label">当前管理员</span>
            <span class="admin-info-value">${currentUser.username}</span>
        </div>
    `;

    document.getElementById('adminInfo').innerHTML = infoHTML;
}

// 切换查看用户
async function switchViewUser() {
    const selectedUserId = document.getElementById('userSelect').value;
    const resetPasswordBtn = document.getElementById('resetPasswordBtn');

    if (!selectedUserId) {
        // 返回管理员自己的视图
        viewingUser = null;
        document.getElementById('viewingAsBanner').style.display = 'none';
        if (resetPasswordBtn) {
            resetPasswordBtn.disabled = true;
        }
    } else {
        try {
            const token = getToken();
            const response = await fetch(`${API_BASE_URL}/api/admin?action=user-entries&userId=${selectedUserId}&token=${token}`);
            const data = await response.json();

            if (response.ok) {
                viewingUser = data.user;
                document.getElementById('viewingUsername').textContent = data.user.username;
                document.getElementById('viewingAsBanner').style.display = 'block';
                if (resetPasswordBtn) {
                    resetPasswordBtn.disabled = false;
                }
            }
        } catch (error) {
            console.error('Switch view user error:', error);
            alert('切换用户失败');
        }
    }

    // 重新加载数据
    await initApp();
}

// 管理员：重置选中用户的密码（快捷函数）
function resetSelectedUserPassword() {
    const selectedUserId = document.getElementById('userSelect').value;
    const selectedOption = document.getElementById('userSelect').selectedOptions[0];

    if (!selectedUserId) {
        alert('请先选择要重置密码的用户');
        return;
    }

    // 从option文本中提取用户名（格式：username (X条日志)）
    const username = selectedOption.textContent.split(' (')[0];

    showResetPasswordDialog(selectedUserId, username);
}

// 导出当前查看用户的数据
async function exportUserData() {
    const targetUsername = viewingUser ? viewingUser.username : currentUser.username;

    const dataStr = JSON.stringify(entries, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ai_agent_journal_${targetUsername}_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
}

// 导出所有用户数据
async function exportAllUsersData() {
    try {
        const token = getToken();
        const response = await fetch(`${API_BASE_URL}/api/admin?action=users&token=${token}`);
        const data = await response.json();

        if (!response.ok) {
            alert('导出失败');
            return;
        }

        const allData = {
            exportDate: new Date().toISOString(),
            exportedBy: currentUser.username,
            users: data.users
        };

        const dataStr = JSON.stringify(allData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `ai_agent_journal_all_users_${new Date().toISOString().split('T')[0]}.json`;
        link.click();
    } catch (error) {
        console.error('Export all users error:', error);
        alert('导出失败');
    }
}

// ==================== 应用逻辑 ====================
// 初始化应用
async function initApp() {
    // 加载数据
    await loadEntries();

    // 初始化日期
    document.getElementById('entryDate').valueAsDate = new Date();

    populateWeekSelector();
    loadApiKey();
}

// 页面加载时初始化账号系统
window.addEventListener('DOMContentLoaded', initAuth);

// 图片预览功能
async function previewImages(event) {
    const files = event.target.files;
    const preview = document.getElementById('imagePreview');

    for (let file of files) {
        if (file.size > 5 * 1024 * 1024) {
            alert(`图片 "${file.name}" 超过5MB，请选择较小的图片`);
            continue;
        }

        const base64 = await fileToBase64(file);
        currentImages.push(base64);

        const previewItem = document.createElement('div');
        previewItem.className = 'image-preview-item';
        previewItem.innerHTML = `
            <img src="${base64}" alt="预览">
            <button class="image-preview-remove" onclick="removePreviewImage(${currentImages.length - 1})" type="button">&times;</button>
        `;
        preview.appendChild(previewItem);
    }

    event.target.value = '';
}

function removePreviewImage(index) {
    currentImages.splice(index, 1);
    const preview = document.getElementById('imagePreview');
    preview.children[index].remove();
}

function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

function viewImage(src) {
    document.getElementById('modalImage').src = src;
    document.getElementById('imageModal').classList.add('show');
}

function closeImageModal() {
    document.getElementById('imageModal').classList.remove('show');
}

// API配置
function toggleApiConfig() {
    const content = document.getElementById('apiConfigContent');
    content.classList.toggle('show');
}

function saveApiKey() {
    const apiKey = document.getElementById('apiKey').value.trim();
    if (apiKey) {
        localStorage.setItem('claudeApiKey', apiKey);
        alert('✅ API密钥已保存');
        document.getElementById('apiConfigContent').classList.remove('show');
    }
}

function loadApiKey() {
    const apiKey = localStorage.getItem('claudeApiKey');
    if (apiKey) {
        document.getElementById('apiKey').value = apiKey;
    }
}

// 生成标题
async function generateTitle() {
    const description = document.getElementById('entryDescription').value.trim();

    if (!description) {
        alert('请先输入详细内容');
        return;
    }

    const generateBtn = document.getElementById('generateTitleBtn');
    const originalText = generateBtn.textContent;
    generateBtn.disabled = true;
    generateBtn.textContent = '生成中...';

    try {
        const title = await extractTaskFromDescription(description);
        document.getElementById('entryTask').value = title;
    } catch (error) {
        alert('标题生成失败，请手动输入或重试');
        console.error(error);
    } finally {
        generateBtn.disabled = false;
        generateBtn.textContent = originalText;
    }
}

// AI提取任务描述
async function extractTaskFromDescription(description) {
    const apiKey = localStorage.getItem('claudeApiKey');
    if (!apiKey) {
        const chineseChars = description.match(/[\u4e00-\u9fa5]/g) || [];
        if (chineseChars.length > 50) {
            return chineseChars.slice(0, 50).join('') + '...';
        }
        return description.substring(0, 50) + (description.length > 50 ? '...' : '');
    }

    try {
        const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': apiKey,
                'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify({
                model: 'claude-3-haiku-20240307',
                max_tokens: 150,
                messages: [{
                    role: 'user',
                    content: `你是一个专业的标题提炼专家。请根据下面的工作日志内容，提炼出一个精准的任务标题。

【核心要求】
1. 标题长度：严格控制在50个汉字以内
2. 结构规范：必须使用"动词+对象"结构，禁止使用完整句子
3. 内容要求：提炼核心动作和关键对象，去除所有过程描述和细节
4. 输出格式：只输出标题本身，不要引号、不要标点、不要任何额外说明
5. 禁止行为：严禁直接复制原文，必须进行高度概括和提炼

现在请提炼以下日志的标题：

${description}

请输出标题（不超过50个汉字）：`
                }]
            })
        });

        if (!response.ok) {
            throw new Error('API调用失败');
        }

        const data = await response.json();
        let title = data.content[0].text.trim();

        title = title.replace(/^["「『：:]+|["」』]+$/g, '').trim();
        title = title.replace(/^(标题|任务|输出)[：:]\s*/g, '').trim();

        const chineseChars = title.match(/[\u4e00-\u9fa5]/g) || [];
        if (chineseChars.length > 50) {
            let count = 0;
            let result = '';
            for (let char of title) {
                if (/[\u4e00-\u9fa5]/.test(char)) {
                    count++;
                    if (count > 50) break;
                }
                result += char;
            }
            title = result;
        }

        return title;
    } catch (error) {
        console.error('AI提取失败:', error);
        const chineseChars = description.match(/[\u4e00-\u9fa5]/g) || [];
        if (chineseChars.length > 50) {
            return chineseChars.slice(0, 50).join('') + '...';
        }
        return description.substring(0, 50) + (description.length > 50 ? '...' : '');
    }
}

// 表单提交
document.getElementById('entryForm').addEventListener('submit', async function(e) {
    e.preventDefault();

    const submitBtn = document.getElementById('submitBtn');
    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = '正在保存...';

    try {
        const token = getToken();
        const entry = {
            token: token,
            date: document.getElementById('entryDate').value,
            category: document.getElementById('entryCategory').value,
            task: document.getElementById('entryTask').value,
            description: document.getElementById('entryDescription').value,
            duration: parseInt(document.getElementById('entryDuration').value),
            images: currentImages
        };

        const response = await fetch(`${API_BASE_URL}/api/entries`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(entry)
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || '保存失败');
        }

        // 清空部分表单字段
        document.getElementById('entryTask').value = '';
        document.getElementById('entryDescription').value = '';
        document.getElementById('entryDuration').value = '';
        document.getElementById('imagePreview').innerHTML = '';
        currentImages = [];

        // 刷新历史记录
        await loadEntries();
        populateWeekSelector();

        document.querySelector('h3').scrollIntoView({ behavior: 'smooth', block: 'start' });
    } catch (error) {
        alert('保存失败: ' + error.message);
        console.error(error);
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
    }
});

// 切换标签
function switchTab(tabName) {
    document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));

    event.target.classList.add('active');
    document.getElementById(tabName).classList.add('active');

    if (tabName === 'record') {
        loadEntries();
    } else if (tabName === 'report') {
        populateWeekSelector();
        generateWeeklyReport();
    }
}

// 加载历史记录
async function loadEntries() {
    const entriesList = document.getElementById('entriesList');
    entriesList.innerHTML = '<div class="empty-state"><p>⏳ 加载中...</p></div>';

    try {
        const token = getToken();
        let url = `${API_BASE_URL}/api/entries?token=${token}`;

        // 如果是管理员查看其他用户
        if (viewingUser) {
            url = `${API_BASE_URL}/api/admin?action=user-entries&userId=${viewingUser.id}&token=${token}`;
        }

        const response = await fetch(url);
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || '加载失败');
        }

        entries = viewingUser ? data.entries : data.entries;

        if (entries.length === 0) {
            entriesList.innerHTML = '<div class="empty-state"><p>📭 还没有记录，赶快添加第一条吧！</p></div>';
            return;
        }

        entriesList.innerHTML = entries.map(entry => `
            <div class="entry-card">
                <div class="entry-header">
                    <span class="entry-date">${formatDate(entry.date)}</span>
                    <span class="entry-category">${entry.category}</span>
                </div>
                <div class="entry-task">${entry.task}</div>
                <div class="entry-description">${entry.description}</div>
                ${entry.images && entry.images.length > 0 ? `
                    <div class="entry-images">
                        ${entry.images.map(img => `
                            <div class="entry-image" onclick="viewImage('${img}')">
                                <img src="${img}" alt="任务图片">
                            </div>
                        `).join('')}
                    </div>
                ` : ''}
                <div class="entry-footer">
                    <span class="entry-time">⏱ ${entry.duration}分钟</span>
                    <div class="entry-actions">
                        ${!viewingUser ? `<button class="btn btn-delete" onclick="deleteEntry(${entry.id})">删除</button>` : ''}
                    </div>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Load entries error:', error);
        entriesList.innerHTML = '<div class="empty-state"><p>❌ 加载失败，请重试</p></div>';
    }
}

// 删除记录
async function deleteEntry(id) {
    if (!confirm('确定要删除这条记录吗？')) {
        return;
    }

    try {
        const token = getToken();
        const response = await fetch(`${API_BASE_URL}/api/entries?id=${id}&token=${token}`, {
            method: 'DELETE'
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || '删除失败');
        }

        await loadEntries();
        populateWeekSelector();
    } catch (error) {
        alert('删除失败: ' + error.message);
        console.error(error);
    }
}

// 格式化日期
function formatDate(dateString) {
    const date = new Date(dateString);
    const options = { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' };
    return date.toLocaleDateString('zh-CN', options);
}

// 获取周范围
function getWeekRange(date) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(d.setDate(diff));
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);

    return {
        start: monday.toISOString().split('T')[0],
        end: sunday.toISOString().split('T')[0]
    };
}

// 填充周选择器
function populateWeekSelector() {
    const weekSelector = document.getElementById('weekSelector');
    const weeks = new Set();

    entries.forEach(entry => {
        const weekRange = getWeekRange(entry.date);
        weeks.add(`${weekRange.start}|${weekRange.end}`);
    });

    const currentWeek = getWeekRange(new Date());
    weeks.add(`${currentWeek.start}|${currentWeek.end}`);

    const sortedWeeks = Array.from(weeks).sort().reverse();

    weekSelector.innerHTML = sortedWeeks.map(week => {
        const [start, end] = week.split('|');
        return `<option value="${week}">${start} 至 ${end}</option>`;
    }).join('');
}

// 生成周报
function generateWeeklyReport() {
    const weekSelector = document.getElementById('weekSelector');
    if (weekSelector.options.length === 0) {
        document.getElementById('weeklyReport').innerHTML = '<div class="empty-state"><p>📭 还没有数据可以生成周报</p></div>';
        return;
    }

    const selectedWeek = weekSelector.value;
    const [startDate, endDate] = selectedWeek.split('|');

    const weekEntries = entries.filter(entry =>
        entry.date >= startDate && entry.date <= endDate
    );

    if (weekEntries.length === 0) {
        document.getElementById('weeklyReport').innerHTML = '<div class="empty-state"><p>📭 本周还没有记录</p></div>';
        return;
    }

    const totalTasks = weekEntries.length;
    const totalDuration = weekEntries.reduce((sum, e) => sum + e.duration, 0);

    const categoryStats = {};
    weekEntries.forEach(entry => {
        categoryStats[entry.category] = (categoryStats[entry.category] || 0) + 1;
    });

    const dailyTasks = {};
    weekEntries.forEach(entry => {
        if (!dailyTasks[entry.date]) {
            dailyTasks[entry.date] = [];
        }
        dailyTasks[entry.date].push(entry);
    });

    const reportHTML = `
        <div class="weekly-report">
            <h3>📅 周报：${startDate} 至 ${endDate}</h3>

            <div class="report-stats">
                <div class="stat-card">
                    <div class="stat-number">${totalTasks}</div>
                    <div class="stat-label">总任务数</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number">${Math.floor(totalDuration / 60)}h ${totalDuration % 60}m</div>
                    <div class="stat-label">总使用时长</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number">${Object.keys(categoryStats).length}</div>
                    <div class="stat-label">任务类型</div>
                </div>
            </div>

            <div class="report-section">
                <h4>📊 任务分类统计</h4>
                <ul class="report-list">
                    ${Object.entries(categoryStats).map(([category, count]) =>
                        `<li><strong>${category}：</strong>${count} 个任务</li>`
                    ).join('')}
                </ul>
            </div>

            <div class="report-section">
                <h4>📝 每日任务详情</h4>
                ${Object.entries(dailyTasks).sort().reverse().map(([date, tasks]) => {
                    const dailyDuration = tasks.reduce((sum, t) => sum + t.duration, 0);
                    return `
                    ${tasks.map(task => `
                        <div class="entry-card">
                            <div class="entry-header">
                                <span class="entry-date">${formatDate(date)}</span>
                                <span class="entry-category">${task.category}</span>
                            </div>
                            <div class="entry-task">${task.task}</div>
                            <div class="entry-description">${task.description}</div>
                            ${task.images && task.images.length > 0 ? `
                                <div class="entry-images">
                                    ${task.images.map(img => `
                                        <div class="entry-image" onclick="viewImage('${img}')">
                                            <img src="${img}" alt="任务图片">
                                        </div>
                                    `).join('')}
                                </div>
                            ` : ''}
                            <div class="entry-footer">
                                <span class="entry-time">⏱ ${task.duration}分钟</span>
                            </div>
                        </div>
                    `).join('')}
                    <div class="daily-summary" style="margin-bottom: 24px;">
                        📌 ${formatDate(date)} 共完成 ${tasks.length} 个任务，累计 ${dailyDuration} 分钟 (${(dailyDuration / 60).toFixed(1)} 小时)
                    </div>
                `}).join('')}
            </div>

            <div class="report-section">
                <h4>💡 本周总结</h4>
                <ul class="report-list">
                    <li>本周共完成 ${totalTasks} 个AI辅助任务，累计使用 ${Math.floor(totalDuration / 60)} 小时 ${totalDuration % 60} 分钟</li>
                    <li>主要集中在 ${Object.entries(categoryStats).sort((a, b) => b[1] - a[1])[0][0]} 类任务</li>
                    <li>平均每天使用 ${(totalDuration / 7).toFixed(0)} 分钟</li>
                </ul>
            </div>
        </div>
    `;

    document.getElementById('weeklyReport').innerHTML = reportHTML;
}

// 导出数据
function exportData() {
    const dataStr = JSON.stringify(entries, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ai_agent_journal_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
}

// 导出周报
function exportWeeklyReport() {
    const reportContent = document.getElementById('weeklyReport').innerText;
    const blob = new Blob([reportContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const weekSelector = document.getElementById('weekSelector');
    const selectedWeek = weekSelector.value.split('|').join('_');
    link.href = url;
    link.download = `周报_${selectedWeek}.txt`;
    link.click();
}

// ==================== 密码管理功能 ====================

// 显示修改密码对话框
function showChangePasswordDialog() {
    const html = `
        <div style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 10000;" id="changePasswordModal">
            <div style="background: white; padding: 30px; border-radius: 15px; max-width: 400px; width: 90%;">
                <h3 style="margin: 0 0 20px 0; color: #1d1d1f;">修改密码</h3>

                <div style="margin-bottom: 15px;">
                    <label style="display: block; margin-bottom: 5px; font-weight: 500; color: #1d1d1f;">旧密码：</label>
                    <input type="password" id="oldPassword" style="width: 100%; padding: 10px; border: 1px solid #d2d2d7; border-radius: 8px; font-size: 14px;">
                </div>

                <div style="margin-bottom: 15px;">
                    <label style="display: block; margin-bottom: 5px; font-weight: 500; color: #1d1d1f;">新密码：</label>
                    <input type="password" id="newPassword" style="width: 100%; padding: 10px; border: 1px solid #d2d2d7; border-radius: 8px; font-size: 14px;">
                </div>

                <div style="margin-bottom: 20px;">
                    <label style="display: block; margin-bottom: 5px; font-weight: 500; color: #1d1d1f;">确认新密码：</label>
                    <input type="password" id="confirmNewPassword" style="width: 100%; padding: 10px; border: 1px solid #d2d2d7; border-radius: 8px; font-size: 14px;">
                </div>

                <div id="changePasswordError" style="display: none; color: #ff3b30; font-size: 13px; margin-bottom: 15px;"></div>

                <div style="display: flex; gap: 10px;">
                    <button onclick="handleChangePassword()" style="flex: 1; padding: 12px; background: #0071e3; color: white; border: none; border-radius: 8px; font-size: 14px; font-weight: 500; cursor: pointer;">
                        确认修改
                    </button>
                    <button onclick="closeChangePasswordDialog()" style="flex: 1; padding: 12px; background: #f5f5f7; color: #1d1d1f; border: none; border-radius: 8px; font-size: 14px; font-weight: 500; cursor: pointer;">
                        取消
                    </button>
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', html);

    // 回车键提交
    document.getElementById('confirmNewPassword').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            handleChangePassword();
        }
    });
}

// 关闭修改密码对话框
function closeChangePasswordDialog() {
    const modal = document.getElementById('changePasswordModal');
    if (modal) {
        modal.remove();
    }
}

// 处理修改密码
async function handleChangePassword() {
    const oldPassword = document.getElementById('oldPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmNewPassword = document.getElementById('confirmNewPassword').value;
    const errorDiv = document.getElementById('changePasswordError');

    // 验证
    if (!oldPassword || !newPassword || !confirmNewPassword) {
        errorDiv.textContent = '请填写所有字段';
        errorDiv.style.display = 'block';
        return;
    }

    if (newPassword.length < 6) {
        errorDiv.textContent = '新密码长度至少为6个字符';
        errorDiv.style.display = 'block';
        return;
    }

    if (newPassword !== confirmNewPassword) {
        errorDiv.textContent = '两次输入的新密码不一致';
        errorDiv.style.display = 'block';
        return;
    }

    if (oldPassword === newPassword) {
        errorDiv.textContent = '新密码不能与旧密码相同';
        errorDiv.style.display = 'block';
        return;
    }

    try {
        const token = getToken();
        const response = await fetch(`${API_BASE_URL}/api/auth`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                action: 'change-password',
                token: token,
                oldPassword: oldPassword,
                newPassword: newPassword
            })
        });

        const data = await response.json();

        if (!response.ok) {
            errorDiv.textContent = data.error || '修改密码失败';
            errorDiv.style.display = 'block';
            return;
        }

        // 成功
        alert('密码修改成功！');
        closeChangePasswordDialog();

    } catch (error) {
        console.error('Change password error:', error);
        errorDiv.textContent = '修改密码失败，请检查网络连接';
        errorDiv.style.display = 'block';
    }
}

// 管理员：显示重置密码对话框
function showResetPasswordDialog(userId, username) {
    const html = `
        <div style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 10000;" id="resetPasswordModal">
            <div style="background: white; padding: 30px; border-radius: 15px; max-width: 400px; width: 90%;">
                <h3 style="margin: 0 0 20px 0; color: #1d1d1f;">重置用户密码</h3>

                <div style="background: #f5f5f7; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
                    <p style="margin: 0; color: #6e6e73; font-size: 14px;">目标用户：<strong style="color: #1d1d1f;">${username}</strong></p>
                </div>

                <div style="margin-bottom: 15px;">
                    <label style="display: block; margin-bottom: 5px; font-weight: 500; color: #1d1d1f;">新密码：</label>
                    <input type="password" id="adminNewPassword" style="width: 100%; padding: 10px; border: 1px solid #d2d2d7; border-radius: 8px; font-size: 14px;">
                </div>

                <div style="margin-bottom: 20px;">
                    <label style="display: block; margin-bottom: 5px; font-weight: 500; color: #1d1d1f;">确认新密码：</label>
                    <input type="password" id="adminConfirmPassword" style="width: 100%; padding: 10px; border: 1px solid #d2d2d7; border-radius: 8px; font-size: 14px;">
                </div>

                <div id="resetPasswordError" style="display: none; color: #ff3b30; font-size: 13px; margin-bottom: 15px;"></div>

                <div style="display: flex; gap: 10px;">
                    <button onclick="handleResetPassword(${userId}, '${username}')" style="flex: 1; padding: 12px; background: #ff3b30; color: white; border: none; border-radius: 8px; font-size: 14px; font-weight: 500; cursor: pointer;">
                        确认重置
                    </button>
                    <button onclick="closeResetPasswordDialog()" style="flex: 1; padding: 12px; background: #f5f5f7; color: #1d1d1f; border: none; border-radius: 8px; font-size: 14px; font-weight: 500; cursor: pointer;">
                        取消
                    </button>
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', html);

    // 回车键提交
    document.getElementById('adminConfirmPassword').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            handleResetPassword(userId, username);
        }
    });
}

// 关闭重置密码对话框
function closeResetPasswordDialog() {
    const modal = document.getElementById('resetPasswordModal');
    if (modal) {
        modal.remove();
    }
}

// 管理员：处理重置密码
async function handleResetPassword(userId, username) {
    const newPassword = document.getElementById('adminNewPassword').value;
    const confirmPassword = document.getElementById('adminConfirmPassword').value;
    const errorDiv = document.getElementById('resetPasswordError');

    // 验证
    if (!newPassword || !confirmPassword) {
        errorDiv.textContent = '请填写所有字段';
        errorDiv.style.display = 'block';
        return;
    }

    if (newPassword.length < 6) {
        errorDiv.textContent = '新密码长度至少为6个字符';
        errorDiv.style.display = 'block';
        return;
    }

    if (newPassword !== confirmPassword) {
        errorDiv.textContent = '两次输入的新密码不一致';
        errorDiv.style.display = 'block';
        return;
    }

    try {
        const token = getToken();
        const response = await fetch(`${API_BASE_URL}/api/admin`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                token: token,
                userId: userId,
                newPassword: newPassword
            })
        });

        const data = await response.json();

        if (!response.ok) {
            errorDiv.textContent = data.error || '重置密码失败';
            errorDiv.style.display = 'block';
            return;
        }

        // 成功
        alert(`已成功为用户 "${username}" 重置密码！`);
        closeResetPasswordDialog();

    } catch (error) {
        console.error('Reset password error:', error);
        errorDiv.textContent = '重置密码失败，请检查网络连接';
        errorDiv.style.display = 'block';
    }
}

// ==================== AI 功能 ====================

// AI 辅助写日志
async function enhanceWithAI() {
    const briefDescription = document.getElementById('entryDescription').value.trim();
    const task = document.getElementById('entryTask').value.trim();
    const category = document.getElementById('entryCategory').value;

    if (!briefDescription) {
        alert('请先输入简要描述');
        return;
    }

    const btn = event.target;
    btn.disabled = true;
    btn.textContent = '🤖 AI 思考中...';

    try {
        const token = getToken();
        const response = await fetch(`${API_BASE_URL}/api/ai`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                token: token,
                action: 'enhance',
                briefDescription: briefDescription,
                task: task,
                category: category
            })
        });

        const data = await response.json();

        if (!response.ok) {
            alert(data.error || 'AI 辅助失败');
            return;
        }

        // 将 AI 生成的内容填入描述框
        document.getElementById('entryDescription').value = data.enhancedDescription;
        alert('✅ AI 已优化你的描述！');

    } catch (error) {
        console.error('AI enhance error:', error);
        alert('AI 辅助失败，请检查网络连接');
    } finally {
        btn.disabled = false;
        btn.textContent = '✨ AI 辅助';
    }
}

// AI 生成周报
async function generateAIReport() {
    const weekSelector = document.getElementById('weekSelector');
    const selectedWeek = weekSelector.value;

    if (!selectedWeek) {
        alert('请先选择周次');
        return;
    }

    const [startDate, endDate] = selectedWeek.split('|');

    const btn = event.target;
    btn.disabled = true;
    btn.textContent = '🤖 AI 生成中...';

    try {
        const token = getToken();
        const response = await fetch(`${API_BASE_URL}/api/ai`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                token: token,
                action: 'generate-report',
                startDate: startDate,
                endDate: endDate
            })
        });

        const data = await response.json();

        if (!response.ok) {
            alert(data.error || 'AI 生成失败');
            return;
        }

        // 显示 AI 生成的周报
        const reportDiv = document.getElementById('weeklyReport');
        reportDiv.innerHTML = `
            <div style="background: #f5f5f7; padding: 20px; border-radius: 10px; margin-bottom: 20px;">
                <h3 style="color: #0071e3; margin-bottom: 10px;">🤖 AI 生成的周报</h3>
                <div style="white-space: pre-wrap; line-height: 1.8;">${data.report}</div>
            </div>
        `;

        alert('✅ AI 周报生成成功！');

    } catch (error) {
        console.error('AI generate report error:', error);
        alert('AI 生成失败，请检查网络连接');
    } finally {
        btn.disabled = false;
        btn.textContent = '🤖 AI 生成周报';
    }
}

// AI 智能分析
async function showAIAnalysis() {
    const modal = document.createElement('div');
    modal.id = 'aiAnalysisModal';
    modal.style.cssText = 'position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 10000;';

    modal.innerHTML = `
        <div style="background: white; padding: 40px; border-radius: 15px; max-width: 800px; width: 90%; max-height: 80vh; overflow-y: auto;">
            <h3 style="margin: 0 0 20px 0; color: #1d1d1f;">🤖 AI 智能分析</h3>
            <div id="analysisContent">
                <p style="text-align: center; color: #6e6e73;">正在分析你的工作数据...</p>
            </div>
            <button onclick="closeAIAnalysis()" style="width: 100%; padding: 12px; background: #6e6e73; color: white; border: none; border-radius: 8px; font-size: 14px; margin-top: 20px; cursor: pointer;">
                关闭
            </button>
        </div>
    `;

    document.body.appendChild(modal);

    try {
        const token = getToken();
        const response = await fetch(`${API_BASE_URL}/api/ai`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                token: token,
                action: 'analyze',
                days: 30
            })
        });

        const data = await response.json();

        if (!response.ok) {
            document.getElementById('analysisContent').innerHTML = `
                <p style="color: #ff3b30;">${data.error || 'AI 分析失败'}</p>
            `;
            return;
        }

        document.getElementById('analysisContent').innerHTML = `
            <div style="background: #f5f5f7; padding: 20px; border-radius: 10px;">
                <div style="white-space: pre-wrap; line-height: 1.8;">${data.analysis}</div>
            </div>
        `;

    } catch (error) {
        console.error('AI analysis error:', error);
        document.getElementById('analysisContent').innerHTML = `
            <p style="color: #ff3b30;">AI 分析失败，请检查网络连接</p>
        `;
    }
}

// 关闭 AI 分析弹窗
function closeAIAnalysis() {
    const modal = document.getElementById('aiAnalysisModal');
    if (modal) {
        modal.remove();
    }
}
