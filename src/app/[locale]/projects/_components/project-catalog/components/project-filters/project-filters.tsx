"use client";

import ProjectFilter from "../../../project-filter/project-filter";
import styles from "../../project-catalog.module.css";
import type { ProjectCategories } from "../../project-catalog.types";
import { useProjectFilters } from "./project-filters.logic";

export default function ProjectFilters({
  categories: options,
}: {
  categories: ProjectCategories;
}) {
  const { category, mobile, filterRef, selectCategory, categories, split } =
    useProjectFilters(options);
  return (
    <div className={styles.filters} ref={filterRef}>
      <div className={styles.filterLine} data-page-transition-item>
        {categories.slice(0, split).map((item) => (
          <ProjectFilter
            key={item.id}
            category={item.id}
            label={mobile ? item.mobileLabel : item.label}
            active={category === item.id}
            onSelect={selectCategory}
          />
        ))}
        <span className={styles.extraSpace} aria-hidden="true" />
      </div>
      <div className={styles.filterLine} data-page-transition-item>
        {categories.slice(split).map((item) => (
          <ProjectFilter
            key={item.id}
            category={item.id}
            label={mobile ? item.mobileLabel : item.label}
            active={category === item.id}
            onSelect={selectCategory}
          />
        ))}
        <span className={styles.extraSpace} aria-hidden="true" />
      </div>
    </div>
  );
}
