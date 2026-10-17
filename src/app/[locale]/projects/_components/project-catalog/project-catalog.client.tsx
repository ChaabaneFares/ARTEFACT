"use client";

import type { ReactNode } from "react";
import type { Locale } from "@/i18n/routing";
import ProjectMotion from "../project-motion/project-motion";
import { useProjectCatalog } from "./project-catalog.client.logic";
import { CatalogContext } from "./project-catalog.context";
import styles from "./project-catalog.module.css";
import type { ProjectCategories } from "./project-catalog.types";

export default function ProjectCatalogClient({
  children,
  locale,
  categories,
}: {
  children: ReactNode;
  locale: Locale;
  categories: ProjectCategories;
}) {
  const state = useProjectCatalog(locale, categories);
  return (
    <CatalogContext.Provider value={state}>
      <div ref={state.rootRef} className={styles.catalog} data-project-catalog>
        {children}
        <ProjectMotion category={state.category} />
      </div>
    </CatalogContext.Provider>
  );
}
