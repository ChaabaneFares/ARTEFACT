"use client";

import { usePointerGlowLogic } from "./pointer-glow.logic";
import styles from "./pointer-glow.module.css";

export default function PointerGlow({ active }: { active: boolean }) {
  const { glowRef } = usePointerGlowLogic(active);

  return (
    <div
      ref={glowRef}
      className={styles.glow}
      data-pointer-glow
      aria-hidden="true"
    />
  );
}
