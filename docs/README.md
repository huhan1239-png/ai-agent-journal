# 📚 文档目录

本目录包含空间智能部-Agent实战之路项目的所有技术文档，按类别组织。

## 📁 目录结构

### 🚀 deployment/ - 部署相关文档
部署、配置和环境设置的完整指南。

- **QUICKSTART.md** - 快速开始指南（推荐首先阅读）
- **VERCEL_SETUP.md** - Vercel 部署完整指南
- **NEON_SETUP.md** - Neon PostgreSQL 数据库设置
- **VERCEL_NEON_INTEGRATION.md** - Vercel 与 Neon 集成指南
- **ENVIRONMENT_VARIABLES.md** - 环境变量配置说明
- **DEPLOYMENT_STEPS.md** - 详细部署步骤
- **DEPLOYMENT_CHECKLIST.md** - 部署前检查清单
- **DEPLOYMENT_STATUS.md** - 部署状态和历史记录

### 📖 guides/ - 用户和功能指南
面向用户和开发者的功能使用指南。

- **AI_FEATURES_GUIDE.md** - AI功能完整使用指南
- **MULTI_MODEL_GUIDE.md** - 多模型AI支持指南
- **ADMIN_GUIDE.md** - 管理员功能指南
- **PASSWORD_MANAGEMENT_GUIDE.md** - 密码管理功能指南

### 🔧 development/ - 开发文档
技术实现、数据库迁移和测试相关文档。

- **DATABASE_MIGRATION_API_KEYS.md** - API Keys 数据库迁移脚本
- **FRONTEND_MODIFICATION_GUIDE.md** - 前端修改指南
- **TEST_CASES.md** - 测试用例和测试指南

### 🗄️ archive/ - 归档文档
已过时或不再使用的历史文档。

- **CREATE_PROGRESS.md** - 项目创建过程记录
- **README_SUMMARY.md** - 旧版本README摘要
- **REPLACEMENT_GUIDE.md** - 组件替换指南（已废弃）
- **SUPABASE_SETUP.md** - Supabase设置（已弃用，现使用Neon）

## 🎯 快速导航

### 新用户
1. 先阅读 [QUICKSTART.md](deployment/QUICKSTART.md)
2. 了解AI功能：[AI_FEATURES_GUIDE.md](guides/AI_FEATURES_GUIDE.md)
3. 多模型配置：[MULTI_MODEL_GUIDE.md](guides/MULTI_MODEL_GUIDE.md)

### 部署人员
1. 环境配置：[ENVIRONMENT_VARIABLES.md](deployment/ENVIRONMENT_VARIABLES.md)
2. 数据库设置：[NEON_SETUP.md](deployment/NEON_SETUP.md)
3. Vercel部署：[VERCEL_SETUP.md](deployment/VERCEL_SETUP.md)
4. 集成指南：[VERCEL_NEON_INTEGRATION.md](deployment/VERCEL_NEON_INTEGRATION.md)

### 管理员
1. 管理员功能：[ADMIN_GUIDE.md](guides/ADMIN_GUIDE.md)
2. 密码管理：[PASSWORD_MANAGEMENT_GUIDE.md](guides/PASSWORD_MANAGEMENT_GUIDE.md)

### 开发者
1. 前端开发：[FRONTEND_MODIFICATION_GUIDE.md](development/FRONTEND_MODIFICATION_GUIDE.md)
2. 数据库迁移：[DATABASE_MIGRATION_API_KEYS.md](development/DATABASE_MIGRATION_API_KEYS.md)
3. 测试指南：[TEST_CASES.md](development/TEST_CASES.md)

## 📝 文档维护

### 更新原则
- **deployment/**: 部署流程、环境配置相关的变更
- **guides/**: 新功能、功能改进的使用说明
- **development/**: 技术实现、API变更、数据库schema变更
- **archive/**: 不要修改，仅作历史参考

### 添加新文档
1. 确定文档类别
2. 在对应目录创建文件
3. 更新本 README.md 的相应章节
4. 提交时注明文档变更

## 🔗 相关链接

- **主README**: [../README.md](../README.md)
- **更新日志**: [../CHANGELOG.md](../CHANGELOG.md)
- **GitHub仓库**: https://github.com/yourusername/ai-agent-journal
- **在线文档**: https://your-app.vercel.app

---

**最后更新**: 2026-01-31
**维护者**: Project Team
