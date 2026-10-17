"use client";

import type { ReactNode } from "react";
import { useHeaderLogic } from "./header.client.logic";
import { HeaderContext } from "./header.context";
import styles from "./header.module.css";

export default function HeaderClient({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  const state = useHeaderLogic();
  return (
    <HeaderContext.Provider value={state}>
      <nav
        ref={state.headerRef}
        className={styles.nav}
        aria-label={label}
        data-menu-phase={state.phase}
        data-header-scrolled={state.hasScrolled}
      >
        {children}
      </nav>
    </HeaderContext.Provider>
  );
}
