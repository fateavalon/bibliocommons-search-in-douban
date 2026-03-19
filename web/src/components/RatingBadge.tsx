import { badgeClass } from "../utils";
import styles from "./RatingBadge.module.css";

export function RatingBadge({ rating }: { rating: number }) {
  return (
    <span className={`${styles.badge} ${styles[badgeClass(rating)]}`}>
      {rating.toFixed(1)}
    </span>
  );
}
