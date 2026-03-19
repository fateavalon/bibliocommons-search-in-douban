export interface Book {
  t?: string;    // douban title
  ot?: string;   // original library title
  a?: string;    // douban author
  oa?: string;   // original library author
  y?: string;    // year
  pub?: string;  // publisher
  isbn?: string;
  r?: string;    // douban rating
  rc?: string;   // rating count
  di?: string;   // douban id
  h?: string;    // honor banners (pipe-separated)
  tags?: string; // tags (slash-separated)
  cv?: string;   // cover url
  press?: string;
  pd?: string;   // pubdate
  pg?: string;   // pages
  pr?: string;   // price
  tr?: string;   // translator
  sub?: string;  // subtitle
  bs?: string;   // book series
  rid?: string;  // LINK+ record id
  srid?: string; // SCCL record id
  smrid?: string; // SMCL record id
  wr?: number;   // weighted rating
  lib?: string;  // "L", "S", "M" combinations
  intro?: string;
  _i?: number;   // runtime index
}

export type SortCol =
  | "rank"
  | "title"
  | "author"
  | "year"
  | "rating"
  | "count"
  | "";

export type SortDir = 1 | -1;

export interface FilterState {
  query: string;
  ratingMin: string;
  ratingMax: string;
  countMin: string;
  yearMin: string;
  yearMax: string;
  tag: string;
  banner: string;
  honorOnly: boolean;
  libLinkplus: boolean;
  libSccl: boolean;
  libSmcl: boolean;
  sortCol: SortCol;
  sortDir: SortDir;
  page: number;
  pageSize: number;
  modalBookIdx: number | null;
}

export const DEFAULT_FILTERS: FilterState = {
  query: "",
  ratingMin: "",
  ratingMax: "",
  countMin: "",
  yearMin: "",
  yearMax: "",
  tag: "",
  banner: "",
  honorOnly: false,
  libLinkplus: true,
  libSccl: true,
  libSmcl: true,
  sortCol: "",
  sortDir: 1,
  page: 1,
  pageSize: 100,
  modalBookIdx: null,
};
