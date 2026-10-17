"use client";

import {
  activateCursorLabel,
  clearCursorBlend,
} from "@/components/ui/cursor/cursor.effects";
import { type Locale, localizePath } from "@/i18n/routing";
import { useCatalogState } from "../../../project-catalog/project-catalog.context";

export function useProjectLink(
  slug: string,
  name: string,
  locale: Locale,
  cursorColor?: string,
) {
  const { category } = useCatalogState();
  const enter = () =>
    activateCursorLabel({
      label: name,
      background: cursorColor ?? "#ffffff",
      color: "#ffffff",
    });
  const leave = clearCursorBlend;
  const href = localizePath(
    `/projects/${slug}?${category.replaceAll(" ", "")}`,
    locale,
  );
  return { enter, leave, href };
}
