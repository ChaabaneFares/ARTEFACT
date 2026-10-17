"use client";

import { useEffect } from "react";

export function useFaqEffects() {
  useEffect(() => {
    let cleanup: (() => void) | undefined;
    let cancelled = false;
    void import("./faq-effects.animate")
      .then(({ mountFaqEffects }) => {
        if (!cancelled) cleanup = mountFaqEffects();
      })
      .catch(() => {});
    return () => {
      cancelled = true;
      cleanup?.();
    };
  }, []);
}
