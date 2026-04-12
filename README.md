# 虚拟试衣 - Virtual Try-On

一款基于AI的虚拟试衣Web应用，让用户在网购前就能看到衣服的试穿效果。

## 功能特性

- 🎯 **AI虚拟试衣**：上传人物照片和衣服照片，AI自动合成试衣效果
- 👤 **用户系统**：免登录试用、注册登录、会员订阅
- 💾 **历史记录**：保存试衣历史，随时查看和下载
- ⚡ **进度显示**：实时进度条，减少等待焦虑
- 🎨 **搭配选择**：可选择是否保留原衣服，支持多种搭配风格

## 技术栈

### 前端
- Next.js 14
- React 18
- TypeScript
- Tailwind CSS
- Axios

### 后端
- Node.js + Express
- TypeScript
- TypeORM
- PostgreSQL
- JWT认证
- 火山引擎AI API

## 快速开始

### 前置要求
- Node.js 18+
- PostgreSQL 14+
- 火山引擎账号（用于AI API）

### 1. 安装依赖

```bash
# 安装根目录依赖
npm install

# 安装后端依赖
cd backend
npm install

# 安装前端依赖
cd ../frontend
npm install
```

### 2. 配置数据库

创建PostgreSQL数据库：

```sql
CREATE DATABASE virtual_try_on;
```

### 3. 配置环境变量

复制并编辑后端环境变量：

```bash
cd backend
cp .env.example .env
# 编辑 .env 文件，填入你的数据库和火山引擎API信息
```

### 4. 启动项目

```bash
# 同时启动前后端
npm run dev

# 或者分别启动
npm run dev:backend  # 后端在 http://localhost:3001
npm run dev:frontend # 前端在 http://localhost:3000
```

## 项目结构

```
shiyi-trae/
├── backend/              # Express后端
│   ├── src/
│   │   ├── entities/    # 数据库实体
│   │   ├── controllers/ # 控制器
│   │   ├── services/    # 业务逻辑
│   │   ├── middleware/  # 中间件
│   │   ├── routes/      # 路由
│   │   ├── config/      # 配置
│   │   └── server.ts    # 入口文件
│   ├── uploads/         # 上传文件存储
│   └── package.json
├── frontend/             # Next.js前端
│   ├── app/             # App Router
│   └── package.json
└── package.json         # 根package.json
```

## 使用指南

### 免费试用
1. 访问首页，点击"免登录试用"
2. 上传你的正面全身照
3. 上传想要试穿的衣服图片
4. 选择是否保留原衣服
5. 点击"生成试衣效果"

### 注册使用
1. 免费试用后可注册账号获得10次使用机会
2. 注册后可以保存历史记录
3. 10次用完后可订阅会员无限使用

### 会员订阅
- 月度会员：¥9.9/月
- 年度会员：¥99/年（推荐，更划算）

## SPEC确认

本项目基于以下完善后的SPEC开发：

### 1. 项目背景和目标人群
- 背景：解决网购衣服时不知道试穿效果的困扰
- 目标人群：全年龄段通用

### 2. 实施方案
- 人物照片：仅正面全身照
- 衣服照片：不做限制
- 生成效果：每次1张静态图
- 免注册试用：1次完整试衣
- 注册后：永久10次
- 订阅：¥9.9/月，月付/年付，微信支付

### 3. 技术方案
- 前端：Next.js
- 后端：Node.js + Express
- 数据库：PostgreSQL
- AI：火山引擎即梦AI/SeedEdit/人像抠图

### 4. 明确不做的事项
- 不对用户身材做评价
- 不给出穿搭建议
- 不推荐购买

### 5. 成功标准
- 产品：生成时间<30秒，用户满意度>80%
- 商业：月活>1000，留存率>30%，转化率>5%

## 开发说明

### 火山引擎AI集成
当前使用火山引擎AI API实现虚拟试衣，包括：
- 即梦AI 4.0：图像生成和编辑
- 人像抠图：人物分割
- SeedEdit：指令编辑

如果火山引擎API效果不理想，可以轻松替换为其他AI方案（如Stable Diffusion）。

### 图片存储
当前使用本地文件系统存储，生产环境建议使用对象存储（如火山引擎TOS、阿里云OSS等）。

## 许可证

MIT
