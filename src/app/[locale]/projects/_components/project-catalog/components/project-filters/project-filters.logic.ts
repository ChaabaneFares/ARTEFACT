"use client";

import { useCatalogState } from "../../project-catalog.context";
import type { ProjectCategories } from "../../project-catalog.types";

export function useProjectFilters(options: ProjectCategories) {
  const { category, mobile, filterRef, selectCategory } = useCatalogState();
  const categories = mobile ? options.mobile : options.desktop;
  const split = mobile ? 4 : 3;
  return { category, mobile, filterRef, selectCategory, categories, split };
}
