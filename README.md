# 互换闲置平台 (Item Exchange Platform)

一个闲置物品互换平台，用户可以发布闲置物品并与其他用户进行物品交换。

## 功能特性

- 用户注册与登录（JWT 认证）
- 发布闲置物品（名称、描述、类别、期望交换物品、照片描述）
- 首页物品卡片浏览，支持按类别筛选和关键词搜索
- 发起交换请求，选择自己的物品进行交换
- 接受/拒绝收到的交换请求
- 交换完成后双方互相评价（1-5星 + 评论）
- 个人中心：我的发布、收到的请求、发出的请求、交换记录
- 编辑个人资料

## 技术栈

- **前端**: React 18 + TypeScript + Vite (端口 5210)
- **后端**: Express + TypeScript + better-sqlite3 (端口 3210)
- **认证**: JWT + bcryptjs
- **并发启动**: concurrently
- **样式**: 纯 CSS（内联在 index.html `<style>` 标签中）

## 快速开始

```bash
# 安装依赖
npm run install:all

# 初始化种子数据
npm run seed

# 启动开发服务器
npm run dev
```

启动后访问 http://localhost:5210

## 测试账号

| 用户名 | 密码 | 昵称 |
|--------|------|------|
| alice  | 123456 | 小爱 |
| bob    | 123456 | 小波 |
| carol  | 123456 | 小卡 |
| dave   | 123456 | 大卫 |
| eve    | 123456 | 小伊 |
| frank  | 123456 | 老范 |

## 项目结构

```
wje-210/
├── package.json          # 根项目，含 concurrently 配置
├── README.md
├── server/
│   ├── package.json
│   ├── tsconfig.json
│   ├── src/
│   │   ├── index.ts      # Express 服务入口
│   │   ├── db.ts         # 数据库初始化
│   │   ├── seed.ts       # 种子数据
│   │   ├── middleware/
│   │   │   └── auth.ts   # JWT 认证中间件
│   │   └── routes/
│   │       ├── auth.ts       # 登录注册
│   │       ├── items.ts      # 物品 CRUD
│   │       └── exchanges.ts  # 交换与评价
├── client/
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   ├── index.html        # 含全部样式
│   └── src/
│       ├── main.tsx
│       ├── App.tsx       # 主应用与路由
│       ├── api.ts        # API 封装
│       ├── types.ts      # 类型定义
│       └── components/
│           ├── Login.tsx      # 登录注册
│           ├── ItemList.tsx   # 首页物品列表
│           ├── ItemDetail.tsx # 物品详情
│           ├── PublishItem.tsx # 发布物品
│           └── Profile.tsx    # 个人中心
```

## API 接口

### 认证
- `POST /api/auth/register` - 注册
- `POST /api/auth/login` - 登录
- `GET /api/auth/me` - 获取当前用户
- `PUT /api/auth/me` - 更新个人资料

### 物品
- `GET /api/items` - 物品列表（支持 category, search, page, limit）
- `GET /api/items/:id` - 物品详情
- `POST /api/items` - 发布物品
- `PUT /api/items/:id` - 更新物品
- `DELETE /api/items/:id` - 删除物品
- `GET /api/items/user/mine` - 我的发布
- `GET /api/items/user/available` - 我的可交换物品

### 交换
- `POST /api/exchanges` - 发起交换
- `GET /api/exchanges/sent` - 发出的请求
- `GET /api/exchanges/received` - 收到的请求
- `PUT /api/exchanges/:id/status` - 接受/拒绝
- `POST /api/exchanges/:id/rate` - 评价
- `GET /api/exchanges/history` - 交换记录
