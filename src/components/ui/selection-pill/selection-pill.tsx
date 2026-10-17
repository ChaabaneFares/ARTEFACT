"use client";

import type { ReactNode } from "react";
import { useSelectionPill } from "./selection-pill.logic";
import styles from "./selection-pill.module.css";

type SelectionPillProps = {
  label: string;
  pressed?: boolean;
  onClick: () => void;
  className?: string;
  children?: ReactNode;
  disabled?: boolean;
};

export default function SelectionPill({
  label,
  pressed,
  onClick,
  className,
  children,
  disabled = false,
}: SelectionPillProps) {
  const { handleEnter, handleLeave } = useSelectionPill();
  return (
    <button
      type="button"
      className={[styles.pill, className].filter(Boolean).join(" ")}
      data-selected={pressed}
      aria-pressed={pressed}
      disabled={disabled}
      onClick={onClick}
      onPointerEnter={handleEnter}
      onPointerLeave={handleLeave}
    >
      <span className={styles.mask}>
        <span className={styles.text} data-text={label}>
          {children}
          {label}
        </span>
      </span>
      <span className={styles.background} aria-hidden="true" />
    </button>
  );
}
