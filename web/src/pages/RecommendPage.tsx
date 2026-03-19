import { useState, useCallback } from "react";
import type { Book } from "../types";
import { useRecommendations } from "../hooks/useRecommendations";
import { getAllBooks } from "../hooks/useBooks";
import { BookCardRow } from "../components/BookCardRow";
import { BookModal } from "../components/BookModal";
import { TagChip } from "../components/TagChip";
import styles from "./RecommendPage.module.css";

export function RecommendPage() {
  const { newHighRated, top250, bannerSections, hiddenGems, topTags } =
    useRecommendations();
  const allBooks = getAllBooks();
  const [modalBook, setModalBook] = useState<Book | null>(null);

  const openModal = useCallback((book: Book) => setModalBook(book), []);
  const closeModal = useCallback(() => setModalBook(null), []);

  return (
    <div className={styles.container}>
      <header className={styles.hero}>
        <h1>LINK+ / SCCL / SMCL 中文图书推荐</h1>
        <p>
          从 {allBooks.length.toLocaleString()} 本馆藏图书中精选
        </p>
      </header>

      <BookCardRow
        title="高分新书"
        linkTo={`#/?rmin=8.5&cmin=50&ymin=${new Date().getFullYear() - 1}`}
        books={newHighRated}
        onCardClick={openModal}
        getBadge={(b) => b.pd || b.y || undefined}
      />

      <BookCardRow
        title="豆瓣图书 Top 250"
        linkTo="#/?hb=%E8%B1%86%E7%93%A3%E5%9B%BE%E4%B9%A6Top250"
        books={top250}
        onCardClick={openModal}
        getBadge={(b) => {
          const m = b.h?.match(/No\.(\d+)\s+豆瓣图书Top250/);
          return m ? `No.${m[1]}` : undefined;
        }}
      />

      {bannerSections.map((sec) => (
        <BookCardRow
          key={sec.name}
          title={sec.name}
          linkTo={`#/?hb=${encodeURIComponent(sec.name)}`}
          books={sec.books}
          onCardClick={openModal}
        />
      ))}

      <BookCardRow
        title="遗珠推荐"
        linkTo="#/?rmin=8.5"
        books={hiddenGems}
        onCardClick={openModal}
      />

      {topTags.length > 0 && (
        <section className={styles.tagSection}>
          <h2 className={styles.sectionTitle}>热门标签</h2>
          <div className={styles.tagCloud}>
            {topTags.map((t) => (
              <a
                key={t.tag}
                href={`#/?tag=${encodeURIComponent(t.tag)}`}
                className={styles.tagLink}
              >
                <TagChip tag={`${t.tag} (${t.count})`} clickable={false} />
              </a>
            ))}
          </div>
        </section>
      )}

      <BookModal book={modalBook} onClose={closeModal} />
    </div>
  );
}
