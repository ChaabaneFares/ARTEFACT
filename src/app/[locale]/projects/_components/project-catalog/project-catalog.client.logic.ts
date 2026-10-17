"use client";

import { useEffect, useRef, useState } from "react";
import { clearCursorBlend } from "@/components/ui/cursor/cursor.effects";
import { type Locale, localizePath } from "@/i18n/routing";
import type {
  ProjectCategories,
  ProjectCategory,
} from "./project-catalog.types";

function readCategory(categories: ProjectCategories): ProjectCategory {
  return (
    (categories.desktop.find(
      ({ hash }) => hash === window.location.hash.slice(1),
    )?.id as ProjectCategory | undefined) ?? "Projects"
  );
}

export function useProjectCatalog(
  locale: Locale,
  categories: ProjectCategories,
) {
  const [category, setCategory] = useState<ProjectCategory>("Projects");
  const [mobile, setMobile] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const filterRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const media = window.matchMedia("(max-width: 768px)");
    const resize = () => setMobile(media.matches);
    const sync = () => setCategory(readCategory(categories));
    resize();
    sync();
    media.addEventListener("change", resize);
    window.addEventListener("hashchange", sync);
    window.addEventListener("popstate", sync);
    return () => {
      media.removeEventListener("change", resize);
      window.removeEventListener("hashchange", sync);
      window.removeEventListener("popstate", sync);
      clearCursorBlend();
    };
  }, [categories]);
  const selectCategory = (next: ProjectCategory) => {
    if (next === category) return;
    setCategory(next);
    globalThis.__artefactLenisRuntime?.instance?.scrollTo(0, {
      immediate: true,
    });
    window.scrollTo(0, 0);
    const hash = categories.desktop.find(({ id }) => id === next)?.hash;
    window.history.replaceState(
      window.history.state,
      "",
      localizePath(`/projects${hash ? `#${hash}` : ""}`, locale),
    );
    clearCursorBlend();
  };
  return {
    category,
    mobile,
    rootRef,
    filterRef,
    selectCategory,
  };
}
