const { query } = require('../db.js');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

module.exports = async function handler(req, res) {
  // 设置 CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { token, userId, newPassword } = req.body;

    if (!token) {
      return res.status(401).json({ error: '未提供认证令牌' });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return res.status(401).json({ error: '无效的认证令牌' });
    }

    // 检查是否是管理员
    if (!decoded.isAdmin) {
      return res.status(403).json({ error: '无管理员权限' });
    }

    // 验证输入
    if (!userId || !newPassword) {
      return res.status(400).json({ error: '用户ID和新密码不能为空' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: '新密码长度至少为6个字符' });
    }

    // 检查目标用户是否存在
    const userResult = await query(
      'SELECT id, username FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: '目标用户不存在' });
    }

    const targetUser = userResult.rows[0];

    // 加密新密码
    const newPasswordHash = await bcrypt.hash(newPassword, 10);

    // 更新密码
    await query(
      'UPDATE users SET password_hash = $1 WHERE id = $2',
      [newPasswordHash, userId]
    );

    return res.status(200).json({
      success: true,
      message: `已成功为用户 "${targetUser.username}" 重置密码`
    });

  } catch (error) {
    console.error('Reset password error:', error);
    return res.status(500).json({ error: '重置密码失败，请重试' });
  }
};
