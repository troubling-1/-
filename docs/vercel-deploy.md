# Vercel 部署说明

这份说明用于把 Delta Escort 部署到 Vercel。项目已经保留 npm 作为包管理器，Vercel 会根据 `package-lock.json` 安装依赖。

## 1. 部署前检查

在本地项目目录执行：

```bash
npm install
npm run lint
npm run build
```

三条命令都通过后再部署。

## 2. Vercel 项目设置

在 Vercel 新建项目时选择当前仓库，框架选择 Next.js。

推荐配置：

```text
Install Command: npm install
Build Command: npm run build
Output Directory: .next
Node.js Version: 20 或更高版本
```

项目根目录保持默认即可。

## 3. 环境变量

在 Vercel 的 Project Settings -> Environment Variables 中添加：

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_SITE_URL=https://your-vercel-domain.vercel.app
```

注意事项：

- `NEXT_PUBLIC_SITE_URL` 要改成线上域名，否则站点地图和分享信息会指向本地地址。
- `SUPABASE_SERVICE_ROLE_KEY` 是服务端密钥，只能放在 Vercel 环境变量里，不要写进前端代码或提交到仓库。
- 如果暂时没有 Supabase 配置，页面仍能使用本地示例数据展示，但登录、真实订单和上传能力不会连接线上数据库。

## 4. Supabase 准备

如果要使用真实数据：

1. 在 Supabase 创建项目。
2. 打开 SQL Editor。
3. 执行 `supabase/schema.sql`。
4. 创建 Storage 桶：`uploads`。
5. 把 Supabase 的项目地址、匿名密钥、服务端密钥填入 Vercel 环境变量。

## 5. 部署后验证

部署完成后访问：

```text
https://your-vercel-domain.vercel.app/
https://your-vercel-domain.vercel.app/sitemap.xml
https://your-vercel-domain.vercel.app/robots.txt
```

如果首页、站点地图和搜索引擎规则都能打开，说明基础部署成功。
