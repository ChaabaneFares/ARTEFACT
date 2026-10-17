"use client";

import type { ReactNode } from "react";
import PointerGlow from "@/components/ui/pointer-glow/pointer-glow";
import { useBrandIntroLogic } from "./brand-intro.client.logic";
import styles from "./brand-intro.module.css";

export default function BrandIntroClient({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  const { introRef, isPresent } = useBrandIntroLogic();
  if (!isPresent) return null;
  return (
    <section
      ref={introRef}
      className={styles.intro}
      data-brand-intro
      aria-label={label}
    >
      <PointerGlow active={isPresent} />
      {children}
    </section>
  );
}
