import type { Book } from "./types";

declare global {
  interface Window {
    BOOKS: Book[];
    IMG_PROXY_BASE?: string;
  }
  var BOOKS: Book[];
}
