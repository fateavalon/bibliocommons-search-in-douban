import { useRef } from "react";
import type { Book } from "../types";
import { BookCard } from "./BookCard";
import styles from "./BookCardRow.module.css";

interface Props {
  title: string;
  linkTo?: string;
  books: Book[];
  onCardClick: (book: Book) => void;
  getBadge?: (book: Book, index: number) => string | undefined;
}

export function BookCardRow({ title, linkTo, books, onCardClick, getBadge }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);

  if (books.length === 0) return null;

  function scroll(dir: number) {
    scrollRef.current?.scrollBy({ left: dir * 400, behavior: "smooth" });
  }

  return (
    <section className={styles.section}>
      <div className={styles.header}>
        <h2 className={styles.title}>{title}</h2>
        {linkTo && (
          <a className={styles.viewAll} href={linkTo}>
            查看全部 &rsaquo;
          </a>
        )}
      </div>
      <div className={styles.rowWrap}>
        <button
          className={`${styles.arrow} ${styles.left}`}
          onClick={() => scroll(-1)}
          aria-label="向左滚动"
        >
          ‹
        </button>
        <div className={styles.row} ref={scrollRef}>
          {books.map((b, i) => (
            <BookCard key={b._i} book={b} onClick={onCardClick} badgeText={getBadge?.(b, i)} />
          ))}
        </div>
        <button
          className={`${styles.arrow} ${styles.right}`}
          onClick={() => scroll(1)}
          aria-label="向右滚动"
        >
          ›
        </button>
      </div>
    </section>
  );
}
