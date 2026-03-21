# BiblioCommons Search in Douban

这个仓库包含两个互补的小项目：

1. `bibliocommons-search.user.js`：运行在浏览器里的 Tampermonkey userscript，把豆瓣图书页的 **ISBN/标题** 提取出来并去查馆藏（BiblioCommons + LINK+）。
2. `web/`：一个 React + Vite 的网页前端，用于展示/筛选中文图书的豆瓣评分相关排行与推荐（数据由仓库提供的 `web/public/books_data.js` 驱动）。

## 1) Tampermonkey userscript（馆藏搜索）

豆瓣图书页面一键搜索 **BiblioCommons / LINK+** 馆藏的单文件脚本。会在豆瓣右侧栏插入结果面板，自动解析页面里的 **ISBN / 标题**，并并行查询多个馆的馆藏情况。

### 功能特点

- 自动提取 ISBN / 标题（优先从豆瓣页面结构读取，必要时做 fallback）
- 并行搜索：同时查询多个已启用的馆（BiblioCommons + LINK+）
- 24 小时缓存：减少重复请求；面板 `↻` 可强制刷新
- 结果展示支持 3 个等级（`Simple / Medium / Detailed`），并保存为用户设置
- ISBN 无结果时，支持“一键按书名重搜”
- 逐馆返回并实时渲染状态（loading / found / not found / error）
- 面板 `⚙` 与 Tampermonkey 菜单均可管理“启用的馆列表”

### 工作原理（简述）

1. 运行环境：匹配 `book.douban.com/subject/*`
2. 页面解析：从 `#info` 区域解析 ISBN，从 `h1` 区域解析书名
3. 馆藏查询：使用 `GM_xmlhttpRequest` 拉取各馆搜索页 HTML
4. 结果渲染：解析页面内嵌状态（SSR state），将结果逐馆展示到 `.aside` 右侧栏

### 安装方法

1. 安装 Tampermonkey（浏览器扩展）
2. Tampermonkey 新建脚本
3. 将仓库内 `bibliocommons-search.user.js` 的全部内容粘贴进去并保存
4. 打开任意豆瓣图书页（`book.douban.com/subject/*`），即可看到右侧栏的 “Library Search” 面板

### 使用说明

- 面板头部按钮：`↻` 刷新结果，`⚙` 打开馆列表管理
- 你可以在面板中选择启用哪些馆；设置会保存在 Tampermonkey 的存储中

## 2) Web 网页（web/）

`web/` 是一个前端项目，用来展示/筛选中文图书的豆瓣评分相关内容（页面标题包含 `LINK+ / SCCL / SMCL 中文图书豆瓣评分排行`）。

### 它在做什么

- 前端加载本地数据：`web/public/books_data.js`
- 提供检索、筛选、分页与详情弹窗等交互
- 路由使用 `HashRouter`（页面内的 `#/` 路由）

### 本地开发

进入 `web/` 目录后执行：

- `npm ci`
- `npm run dev`

### 构建与部署

- 构建：`npm run build`
- 部署到 GitHub Pages 的工作流见 `.github/workflows/deploy.yml`

### SEO（静态 SPA，HashRouter）

路由使用 `HashRouter`（`#/`、`#/recommend`），**fragment 不会发给服务器**，因此 sitemap 只能覆盖主文档 URL（`/`），无法像 `BrowserRouter` 那样为每个路径单独列出 sitemap 条目。若需要更强的“多页面”收录与分享预览，后续需要迁移到 `BrowserRouter` 并在托管侧配置 SPA fallback。

构建时会：

- 在 `index.html` 里写入 `meta description`、Open Graph、Twitter Card、`canonical` 与 `og:image`（图片为 `public/og.png`）。
- 在 `dist/` 写入 `robots.txt` 与 `sitemap.xml`（内容由 `web/vite-seo-plugin.ts` 生成）。

**Canonical / sitemap 的站点地址**由构建环境变量 **`VITE_SITE_URL`** 决定（无尾部斜杠），默认与 GitHub Pages 项目站一致。部署到 Cloudflare Pages 或其它域名时，请在构建环境设置 `VITE_SITE_URL`（例如 `https://xxx.pages.dev`），并参考 `web/.env.example`。

提交站点地图：在 Google Search Console 等工具中提交 `https://<你的域名>/sitemap.xml`（与 `VITE_SITE_URL` 一致）。

## 其他文件

- `CHANGELOG.md`：脚本更新日志
- `PLAN.md` / `PLAN-non-bibliocommons.md`：实现与扩展思路记录

## 许可协议

MIT

