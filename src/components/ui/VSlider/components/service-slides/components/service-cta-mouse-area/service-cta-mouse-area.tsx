"use client";

import type { ReactNode } from "react";
import { useServiceCtaMouseArea } from "./service-cta-mouse-area.logic";
import styles from "./service-cta-mouse-area.module.css";

export default function ServiceCtaMouseArea({
  children,
}: {
  children: ReactNode;
}) {
  const { areaRef } = useServiceCtaMouseArea();
  return (
    <div ref={areaRef} className={styles.mouseArea} data-cta-mouse-area>
      {children}
    </div>
  );
}
