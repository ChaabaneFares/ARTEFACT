"use client";

import { useEffect, useRef, useState } from "react";
import type { ProjectCategory } from "../project-catalog/project-catalog.types";

export function useProjectFilter(
  category: ProjectCategory,
  active: boolean,
  onSelect: (category: ProjectCategory) => void,
) {
  const [hovered, setHovered] = useState(false);
  const rippleRef = useRef<HTMLSpanElement>(null);
  const entered = useRef(false);
  const select = () => onSelect(category);
  const enter = () => setHovered(true);
  const leave = () => setHovered(false);
  useEffect(() => {
    const ripple = rippleRef.current;
    if (!ripple) return;
    const reveal = active || hovered;
    if (!entered.current && !reveal) return;
    const first = !entered.current;
    entered.current = true;
    let cancelled = false;
    let cleanup: (() => void) | undefined;
    void import("./project-filter.animate")
      .then(({ animateProjectFilter }) => {
        if (!cancelled)
          cleanup = animateProjectFilter(
            ripple,
            reveal,
            first,
            active,
            hovered,
          );
      })
      .catch(() => {});
    return () => {
      cancelled = true;
      cleanup?.();
    };
  }, [active, hovered]);
  return { select, enter, leave, rippleRef };
}
