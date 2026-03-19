import { NavLink } from "react-router-dom";
import styles from "./Navbar.module.css";

export function Navbar() {
  return (
    <nav className={styles.nav}>
      <div className={styles.inner}>
        <span className={styles.brand}>湾区图书馆中文图书</span>
        <div className={styles.links}>
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              `${styles.link} ${isActive ? styles.active : ""}`
            }
          >
            图书列表
          </NavLink>
          <NavLink
            to="/recommend"
            className={({ isActive }) =>
              `${styles.link} ${isActive ? styles.active : ""}`
            }
          >
            推荐
          </NavLink>
        </div>
      </div>
    </nav>
  );
}
