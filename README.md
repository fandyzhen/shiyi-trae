# 虚拟试衣 - Virtual Try-On

一款基于AI的虚拟试衣Web应用，让用户在网购前就能看到衣服的试穿效果。

## 功能特性

- 🎯 **AI虚拟试衣**：上传人物照片和衣服照片，AI自动合成试衣效果
- 👤 **用户系统**：免登录试用、注册登录、会员订阅
- 💾 **历史记录**：保存试衣历史，随时查看和下载
- ⚡ **进度显示**：实时进度条，减少等待焦虑
- 🎨 **搭配选择**：可选择是否保留原衣服，支持多种搭配风格
- 🔐 **管理后台**：管理员可查看统计数据、管理用户和订阅

## 技术栈

### 核心框架
- **框架**: Next.js 14 (App Router)
- **语言**: TypeScript 5
- **运行时**: Node.js 18+

### 前端技术
- **UI框架**: React 18
- **样式**: Tailwind CSS 3.4
- **状态管理**: React Context API
- **HTTP客户端**: Axios

### 后端技术（集成在 Next.js 中）
- **API路由**: Next.js API Routes
- **ORM**: TypeORM 0.3.19
- **数据库**: PostgreSQL (支持 Neon 等云数据库)
- **认证**: JWT (jsonwebtoken)
- **文件上传**: Multer
- **图片处理**: Sharp
- **AI服务**: 火山引擎 API

## 快速开始

### 前置要求
- Node.js 18+
- PostgreSQL 数据库（或 Neon 等云数据库）
- 火山引擎账号（用于AI API）

### 1. 安装依赖

```bash
cd frontend
npm install
```

### 2. 配置环境变量

创建 `.env` 文件：

```bash
cp .env.example .env
```

编辑 `.env` 文件，填入以下配置：

```env
# 数据库配置（Neon PostgreSQL）
DATABASE_URL="postgresql://username:password@host/database?sslmode=require"

# JWT 密钥
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"

# 火山引擎 API 配置
VOLCENGINE_ACCESS_KEY="your-volcengine-access-key"
VOLCENGINE_SECRET_KEY="your-volcengine-secret-key"
VOLCENGINE_ENDPOINT="https://visual.volces.com"
```

### 3. 启动开发服务器

```bash
npm run dev
```

应用将在 http://localhost:3000 启动

### 4. 构建生产版本

```bash
npm run build
npm start
```

## 项目结构

```
shiyi-trae/
├── frontend/                 # Next.js 全栈应用
│   ├── app/                 # App Router
│   │   ├── api/            # API Routes (后端API)
│   │   │   ├── auth/       # 认证相关API
│   │   │   ├── tryon/      # 试衣功能API
│   │   │   ├── subscription/# 订阅管理API
│   │   │   └── admin/      # 管理后台API
│   │   ├── admin/          # 管理后台页面
│   │   ├── page.tsx        # 首页
│   │   └── layout.tsx      # 根布局
│   ├── lib/                # 核心库
│   │   ├── entities/       # TypeORM 实体
│   │   ├── services/       # 业务逻辑服务
│   │   ├── middleware/     # 认证中间件
│   │   └── config/         # 配置文件
│   ├── public/             # 静态资源
│   ├── package.json
│   └── next.config.js
├── backend111/              # 旧后端备份（可删除）
├── README.md
└── package.json
```

## API 路由说明

### 认证 API
- `POST /api/auth/register` - 用户注册
- `POST /api/auth/login` - 用户登录
- `POST /api/auth/guest` - 游客登录
- `GET /api/auth/profile` - 获取用户信息

### 试衣 API
- `POST /api/tryon/generate` - 生成试衣效果
- `GET /api/tryon/history` - 获取历史记录
- `GET /api/tryon/usage` - 获取使用统计

### 订阅 API
- `GET /api/subscription` - 获取订阅信息
- `POST /api/subscription` - 创建/更新订阅

### 管理 API
- `GET /api/admin/stats` - 获取统计数据
- `GET /api/admin/users` - 获取用户列表
- `GET /api/admin/subscriptions` - 获取订阅列表
- `POST /api/admin/setup` - 初始化管理员账号

## 部署到 Vercel

### 1. 准备环境变量

在 Vercel Dashboard 中设置以下环境变量：
- `DATABASE_URL` - 数据库连接字符串
- `JWT_SECRET` - JWT 密钥
- `VOLCENGINE_ACCESS_KEY` - 火山引擎 Access Key
- `VOLCENGINE_SECRET_KEY` - 火山引擎 Secret Key

### 2. 部署

```bash
# 使用 Vercel CLI
vercel --prod

# 或在 Vercel Dashboard 中导入 Git 仓库
```

### 3. 数据库迁移

部署后，TypeORM 会自动同步数据库结构（开发环境）。
生产环境建议使用迁移文件。

## 开发说明

### 数据库实体

- **User** - 用户信息
- **History** - 试衣历史记录
- **Subscription** - 订阅信息
- **UsageRecord** - 使用记录

### 认证流程

1. 用户注册/登录获取 JWT Token
2. 后续请求携带 `Authorization: Bearer <token>` 头部
3. 中间件验证 Token 并注入用户信息

### 文件上传

上传的文件存储在 `public/uploads/` 目录：
- `persons/` - 人物照片
- `clothings/` - 衣服照片
- `results/` - 生成的试衣结果

## 注意事项

1. **环境变量**：确保所有必需的环境变量已正确配置
2. **数据库连接**：使用 Neon 等云数据库时，确保 IP 白名单配置正确
3. **文件存储**：Vercel 为无服务器环境，文件上传建议使用外部存储（如 AWS S3、Cloudinary）
4. **API 限制**：火山引擎 API 有调用频率限制，请合理控制请求频率

## 技术亮点

- ✅ **全栈一体化**：使用 Next.js 统一前后端，简化部署流程
- ✅ **TypeScript 全链路**：从数据库到前端完整的类型安全
- ✅ **现代化架构**：App Router、Server Components、API Routes
- ✅ **云原生部署**：一键部署到 Vercel，支持 Edge Runtime
- ✅ **类型安全 ORM**：TypeORM 提供完整的类型支持和数据库抽象

## 许可证

MIT License

## 致谢

- 火山引擎提供 AI 试衣 API 支持
- Next.js 团队提供优秀的全栈框架
