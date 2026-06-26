# Delta Escort

三角洲行动护航陪玩平台。本项目使用 Next.js 15、TypeScript、TailwindCSS、shadcn/ui 风格组件、Supabase、PostgreSQL、Supabase Auth 和 Vercel。

## 当前状态

这个版本已经整理成 npm 本地运行版本：

- 使用 `package-lock.json` 锁定 npm 依赖。
- 不再使用 pnpm 锁文件。
- 页面在没有 Supabase 配置时会使用本地示例数据，方便先启动查看。
- 配置 Supabase 后，可以接入真实登录、订单、上传和数据库。

## 本地目录

当前项目位置：

```text
C:\Users\ttkx\Documents\codex 模型
```

## 目录结构

```text
delta-escort
├─ docs
│  └─ api.md
├─ supabase
│  └─ schema.sql
├─ src
│  ├─ app
│  │  ├─ admin/page.tsx
│  │  ├─ api
│  │  ├─ chat/page.tsx
│  │  ├─ escort/dashboard/page.tsx
│  │  ├─ escorts/page.tsx
│  │  ├─ escorts/[id]/page.tsx
│  │  ├─ login/page.tsx
│  │  ├─ orders/page.tsx
│  │  ├─ orders/create/page.tsx
│  │  ├─ register/page.tsx
│  │  ├─ user/page.tsx
│  │  ├─ globals.css
│  │  ├─ layout.tsx
│  │  └─ page.tsx
│  ├─ components
│  └─ lib
├─ .env.example
├─ .gitignore
├─ components.json
├─ eslint.config.mjs
├─ next.config.ts
├─ package-lock.json
├─ package.json
├─ tailwind.config.ts
└─ tsconfig.json
```

## Windows 完整启动步骤

### 1. 安装 Node.js

安装 Node.js 18.18 或更高版本。推荐使用 Node.js 20 或 22。

检查版本：

```bat
node -v
npm -v
```

### 2. 进入项目目录

打开 Windows 终端、PowerShell 或 CMD，执行：

```bat
cd /d "C:\Users\ttkx\Documents\codex 模型"
```

### 3. 安装依赖

如果 PowerShell 禁止执行 `npm.ps1`，请使用 `npm.cmd`：

```bat
npm.cmd install
```

### 4. 启动开发环境

```bat
npm.cmd run dev
```

启动成功后打开：

```text
http://127.0.0.1:3000
```

### 5. 构建生产版本

```bat
npm.cmd run build
```

### 6. 本地预览生产版本

先构建：

```bat
npm.cmd run build
```

再启动：

```bat
npm.cmd run start
```

打开：

```text
http://127.0.0.1:3000
```

## 如何下载或复制到本地

如果你就在这台 Windows 电脑上使用，本项目已经在本地目录：

```text
C:\Users\ttkx\Documents\codex 模型
```

你可以直接复制整个文件夹到其他位置。

如果要发给别人或换电脑，建议只复制这些项目源码文件，不要复制本地生成目录：

不要复制：

```text
node_modules
.next
.npm-cache
.git
```

复制后在新电脑上执行：

```bat
npm.cmd install
npm.cmd run dev
```

## Supabase 配置

1. 在 Supabase 新建项目。
2. 打开 Supabase 的 SQL Editor。
3. 执行 `supabase/schema.sql`。
4. 新建 Storage 桶：`uploads`。
5. 复制 `.env.example` 为 `.env.local`。
6. 填入你的 Supabase 配置：

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_SITE_URL=http://127.0.0.1:3000
```

## 常用命令

```bat
npm.cmd install
npm.cmd run lint
npm.cmd run build
npm.cmd run dev
```

## 已实现功能

- 首页
- 护航师列表页
- 护航师详情页
- 创建订单页
- 订单中心
- 聊天页面
- 用户中心
- 护航师后台
- 管理后台
- 登录和注册页面
- 订单、护航师、提现、上传 API
- Supabase 数据库 SQL

## 边界处理

- 未配置 Supabase 时，页面使用本地示例数据，不会白屏。
- 登录、注册、下单、提现、上传接口都有基础参数校验。
- 上传接口限制文件最大 5MB。
- 订单接口校验服务类型、价格、需求说明长度和护航师编号。
