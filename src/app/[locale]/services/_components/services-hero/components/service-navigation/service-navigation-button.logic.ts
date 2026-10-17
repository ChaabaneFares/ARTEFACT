"use client";

import { useCallback } from "react";
import { initLenis } from "@/lib/lenis";

export function useServiceNavigationButton(id: string) {
  const navigate = useCallback(() => {
    // The reference category shortcuts scroll the flowing mobile cards.
    if (window.innerWidth > 768) return;
    const target = document.getElementById(`${id}-mobile`);
    if (!target) return;
    const top = target.getBoundingClientRect().top + window.scrollY - 120;
    const immediate = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const lenis = initLenis();
    if (lenis) lenis.scrollTo(top, { immediate });
    else window.scrollTo({ top, behavior: immediate ? "instant" : "smooth" });
  }, [id]);
  return { navigate };
}
