import Link from "next/link";
import styles from "./pagination.module.css";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  basePath: string;
}

export default function Pagination({ currentPage, totalPages, basePath }: PaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <nav className={styles.pagination} aria-label="ページ送り">
      {currentPage > 1 ? (
        <Link href={`${basePath}?page=${currentPage - 1}`} className={styles.navLink}>
          ← 前へ
        </Link>
      ) : (
        <span className={styles.navLinkDisabled}>← 前へ</span>
      )}
      <span className={styles.pageCount}>
        {currentPage} / {totalPages} ページ
      </span>
      {currentPage < totalPages ? (
        <Link href={`${basePath}?page=${currentPage + 1}`} className={styles.navLink}>
          次へ →
        </Link>
      ) : (
        <span className={styles.navLinkDisabled}>次へ →</span>
      )}
    </nav>
  );
}
