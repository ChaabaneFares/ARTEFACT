"use client";

import { useEffect, useRef, useState } from "react";
import { dimensionsStore } from "@/store/dimensionsStore";

type Options = {
  rootMargin?: string;
  threshold?: number;
};

const DEFAULT_ROOT_MARGIN_PX = 200;
const MAX_ROOT_MARGIN_PX = 1200;
const ROOT_MARGIN_VW_RATIO = 0.75;

function getVwRootMargin(vw: number): string {
  const base = Number.isFinite(vw) && vw > 0 ? vw : 0;
  const margin = Math.round(
    Math.min(
      Math.max(base * ROOT_MARGIN_VW_RATIO, DEFAULT_ROOT_MARGIN_PX),
      MAX_ROOT_MARGIN_PX,
    ),
  );
  return `${margin}px 0px`;
}

export function useInViewOnce(options: Options = {}) {
  const { vw } = dimensionsStore();
  const { threshold = 0 } = options;
  const rootMargin = options.rootMargin ?? getVwRootMargin(vw);
  const ref = useRef<HTMLDivElement | null>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    if (inView) return;
    const node = ref.current;
    if (!node) return;
    if (typeof window === "undefined" || !("IntersectionObserver" in window)) {
      setInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry?.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { rootMargin, threshold },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [inView, rootMargin, threshold]);

  return { ref, inView };
}
