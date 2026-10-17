"use client";

import { useCatalogState } from "../../../project-catalog/project-catalog.context";
import type { CategoryIndexes } from "../../project-card.types";

export function useProjectCardImage(categoryIndexes: CategoryIndexes) {
  const { category } = useCatalogState();
  const loading =
    (categoryIndexes[category] ?? -1) < 2
      ? ("eager" as const)
      : ("lazy" as const);
  return { loading };
}
