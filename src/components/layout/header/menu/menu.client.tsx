"use client";

import type { ReactNode } from "react";
import PointerGlow from "@/components/ui/pointer-glow/pointer-glow";
import { useMenuLogic } from "./menu.client.logic";
import { MenuContext } from "./menu.context";
import styles from "./menu.module.css";

export default function MenuClient({
  closeLabel,
  children,
}: {
  closeLabel: string;
  children: ReactNode;
}) {
  const state = useMenuLogic();
  const { phase, closeMenu } = state;
  return (
    <MenuContext.Provider value={state}>
      <div
        ref={state.menuRef}
        id="site-menu"
        className={styles.menu}
        data-phase={phase}
        aria-hidden={phase !== "open"}
        inert={phase !== "open"}
      >
        <button
          type="button"
          className={styles.glow}
          tabIndex={-1}
          aria-label={closeLabel}
          onClick={closeMenu}
        >
          <PointerGlow active={phase === "open"} />
        </button>
        {children}
        <output className={styles.copyStatus} aria-live="polite">
          {state.copyStatus}
        </output>
      </div>
    </MenuContext.Provider>
  );
}
