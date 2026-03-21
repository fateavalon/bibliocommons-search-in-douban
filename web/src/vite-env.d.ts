/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_IMG_PROXY_BASE?: string;
  /** Build-time canonical origin (no trailing slash). Used by vite-seo-plugin. */
  readonly VITE_SITE_URL?: string;
}

declare module "*.module.css" {
  const classes: { readonly [key: string]: string };
  export default classes;
}
