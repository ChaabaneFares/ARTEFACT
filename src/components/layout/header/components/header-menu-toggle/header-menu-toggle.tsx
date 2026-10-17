"use client";

import type { ReactNode } from "react";
import styles from "../../header.module.css";
import { useHeaderMenuToggle } from "./header-menu-toggle.logic";

export default function HeaderMenuToggle({
  openLabel,
  closeLabel,
  children,
}: {
  openLabel: string;
  closeLabel: string;
  children: ReactNode;
}) {
  const { menuButtonRef, phase, toggleMenu } = useHeaderMenuToggle();
  return (
    <button
      type="button"
      ref={menuButtonRef}
      className={styles.menuButton}
      aria-expanded={phase === "open"}
      aria-controls="site-menu"
      aria-label={phase === "open" ? closeLabel : openLabel}
      onClick={toggleMenu}
    >
      {children}
    </button>
  );
}
