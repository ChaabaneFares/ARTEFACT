"use client";

import type { ProjectCategory } from "../project-catalog/project-catalog.types";
import { useProjectFilter } from "./project-filter.logic";
import styles from "./project-filter.module.css";

type Props = {
  category: ProjectCategory;
  active: boolean;
  label: string;
  onSelect: (category: ProjectCategory) => void;
};
export default function ProjectFilter({
  category,
  active,
  label,
  onSelect,
}: Props) {
  const { select, enter, leave, rippleRef } = useProjectFilter(
    category,
    active,
    onSelect,
  );
  return (
    <button
      type="button"
      className={styles.filter}
      aria-pressed={active}
      onClick={select}
      onMouseEnter={enter}
      onMouseLeave={leave}
    >
      <span ref={rippleRef} className={styles.ripple} aria-hidden="true" />
      <span className={styles.label}>
        <span data-text={label}>{label}</span>
      </span>
    </button>
  );
}
