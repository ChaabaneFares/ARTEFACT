"use client";

import { useCursorTrail } from "./cursor.logic";
import styles from "./cursor.module.css";

export default function Cursor() {
  const { isEnabled, secondaryCursorRef } = useCursorTrail();

  if (!isEnabled) {
    return null;
  }

  return (
    <div
      ref={secondaryCursorRef}
      className={styles.secondaryCursor}
      data-cursor-layer="secondary"
      aria-hidden="true"
    >
      <div className={styles.shape} data-cursor-shape>
        <div className={styles.dot} data-cursor-dot />
        <span className={styles.label} data-cursor-label />
      </div>
    </div>
  );
}
