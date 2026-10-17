"use client";

import { usePageTransition } from "./page-transition.logic";
import styles from "./page-transition.module.css";

export default function PageTransition() {
  const { overlayRef, pathRef } = usePageTransition();
  return (
    <svg
      ref={overlayRef}
      className={styles.overlay}
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      aria-hidden="true"
      data-page-transition
    >
      <path ref={pathRef} d="M 0 0 V 0 Q 50 0 100 0 V 0 z" fill="#dcdcdc" />
    </svg>
  );
}
