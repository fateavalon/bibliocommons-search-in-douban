import type { Book, SortCol, SortDir } from "../types";
import { RatingBadge } from "./RatingBadge";
import { TagChip } from "./TagChip";
import { HonorTag } from "./HonorTag";
import styles from "./BookTable.module.css";

interface Props {
  books: Book[];
  sortCol: SortCol;
  sortDir: SortDir;
  onSort: (col: SortCol) => void;
  onOpenModal: (idx: number) => void;
  onTagClick: (tag: string) => void;
  onBannerClick: (banner: string) => void;
}

const COLUMNS: { key: SortCol; label: string }[] = [
  { key: "title", label: "书名" },
  { key: "author", label: "作者" },
  { key: "year", label: "年份" },
  { key: "rating", label: "评分" },
  { key: "count", label: "评分人数" },
];

function sortIndicator(col: SortCol, sortCol: SortCol, sortDir: SortDir) {
  if (col !== sortCol) return null;
  return sortDir === 1 ? " ▲" : " ▼";
}

export function BookTable({
  books,
  sortCol,
  sortDir,
  onSort,
  onOpenModal,
  onTagClick,
  onBannerClick,
}: Props) {
  return (
    <div className={styles.tableWrap}>
      <table className={styles.table}>
        <thead>
          <tr>
            {COLUMNS.map((c) => (
              <th
                key={c.key}
                className={`${styles.th} ${styles[`col_${c.key}`] || ""}`}
                onClick={() => onSort(c.key)}
              >
                {c.label}
                {sortIndicator(c.key, sortCol, sortDir)}
              </th>
            ))}
            <th className={`${styles.th} ${styles.col_tags}`}>标签</th>
            <th className={styles.th}>链接</th>
          </tr>
        </thead>
        <tbody>
          {books.map((b) => (
            <BookRow
              key={b._i}
              book={b}
              onOpenModal={onOpenModal}
              onTagClick={onTagClick}
              onBannerClick={onBannerClick}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function BookRow({
  book: b,
  onOpenModal,
  onTagClick,
  onBannerClick,
}: {
  book: Book;
  onOpenModal: (idx: number) => void;
  onTagClick: (tag: string) => void;
  onBannerClick: (banner: string) => void;
}) {
  const r = parseFloat(b.r || "0") || 0;
  const rc = parseInt(b.rc || "0") || 0;
  const title = b.t || b.ot || "";
  const author = b.a || b.oa || "";

  const honors = b.h
    ? b.h
        .split(" | ")
        .map((s) => s.trim())
        .filter(Boolean)
    : [];

  const tags = b.tags
    ? b.tags
        .split(" / ")
        .map((s) => s.trim())
        .filter(Boolean)
    : [];

  return (
    <tr className={styles.row}>
      <td className={styles.colTitle}>
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault();
            if (b._i !== undefined) onOpenModal(b._i);
          }}
        >
          {title}
        </a>
        {honors.map((h, i) => (
          <HonorTag key={i} text={h} onClick={onBannerClick} />
        ))}
      </td>
      <td className={styles.colAuthor}>
        {b.a ? (
          <a
            href={`https://search.douban.com/book/subject_search?search_text=${encodeURIComponent(b.a)}`}
            target="_blank"
            rel="noopener"
          >
            {author}
          </a>
        ) : (
          author
        )}
      </td>
      <td className={styles.colYear}>{b.y || ""}</td>
      <td className={styles.colRating}>
        <RatingBadge rating={r} />
      </td>
      <td className={styles.colCount}>{rc.toLocaleString()}</td>
      <td className={styles.colTags}>
        {tags.map((t) => (
          <TagChip key={t} tag={t} onClick={onTagClick} />
        ))}
      </td>
      <td className={styles.colLinks}>
        {b.di && (
          <a
            href={`https://book.douban.com/subject/${b.di}/`}
            target="_blank"
            className={styles.linkDouban}
            title="豆瓣"
          >
            豆
          </a>
        )}
        {b.srid && (
          <a
            href={`https://sccl.bibliocommons.com/v2/record/${b.srid}`}
            target="_blank"
            className={styles.linkSccl}
            title="SCCL"
          >
            SC
          </a>
        )}
        {b.smrid && (
          <a
            href={`https://smcl.bibliocommons.com/v2/record/${b.smrid}`}
            target="_blank"
            className={styles.linkSmcl}
            title="SMCL"
          >
            SM
          </a>
        )}
        {b.rid && (
          <a
            href={`https://csul.iii.com/record=${b.rid}`}
            target="_blank"
            className={styles.linkLinkplus}
            title="LINK+"
          >
            L+
          </a>
        )}
      </td>
    </tr>
  );
}
