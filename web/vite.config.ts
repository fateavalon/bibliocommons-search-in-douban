import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Vite 配置文件运行在 Node 环境，但当前项目未显式引入 Node 类型。
// 这里做一个最小声明，避免 TS/IDE 报 `process` 找不到类型。
declare const process: { env: Record<string, string | undefined> };

export default defineConfig({
  plugins: [react()],
  // GitHub Pages 默认部署在子路径下（/bibliocommons-search-in-douban/）。
  // Cloudflare Pages 通常部署在站点根路径（/），用 VITE_BASE 覆盖即可。
  base: process.env.VITE_BASE || "/bibliocommons-search-in-douban/",
});
