"use client";

import { useEffect, useRef } from "react";

export function usePointerGlowLogic(active: boolean) {
  const glowRef = useRef<HTMLDivElement>(null);
  const angleRef = useRef(45);
  useEffect(() => {
    const glow = glowRef.current;
    if (!active || !glow) return;
    let cancelled = false;
    let cleanup: (() => void) | undefined;
    void import("./pointer-glow.animate")
      .then(({ mountPointerGlow }) => {
        if (!cancelled) cleanup = mountPointerGlow(glow, angleRef);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
      cleanup?.();
    };
  }, [active]);
  return { glowRef };
}
