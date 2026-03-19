import type { Book } from "../types";
import { coverUrl } from "../utils";
import { RatingBadge } from "./RatingBadge";
import styles from "./BookCard.module.css";

interface Props {
  book: Book;
  onClick: (book: Book) => void;
  badgeText?: string;
}

export function BookCard({ book, onClick, badgeText }: Props) {
  const r = parseFloat(book.r || "0") || 0;
  const title = book.t || book.ot || "";
  const author = book.a || book.oa || "";
  const imgSrc = coverUrl(book.cv);

  return (
    <div className={styles.card} onClick={() => onClick(book)}>
      <div className={styles.coverWrap}>
        {imgSrc ? (
          <img className={styles.cover} src={imgSrc} alt={title} loading="lazy" />
        ) : (
          <div className={styles.placeholder} />
        )}
        {badgeText && (
          <span className={styles.pubBadge}>{badgeText}</span>
        )}
      </div>
      <div className={styles.info}>
        <div className={styles.title} title={title}>
          {title}
        </div>
        <div className={styles.author} title={author}>
          {author}
        </div>
        {r > 0 && (
          <div className={styles.ratingRow}>
            <RatingBadge rating={r} />
            <span className={styles.count}>
              {(parseInt(book.rc || "0") || 0).toLocaleString()}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
