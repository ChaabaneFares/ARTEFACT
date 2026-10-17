"use client";

import { useEffect } from "react";

export function usePrivacyMotion() {
  useEffect(() => {
    let cancelled = false;
    let cleanup: (() => void) | undefined;
    void import("./privacy-motion.animate")
      .then(({ mountPrivacyMotion }) => {
        if (!cancelled) cleanup = mountPrivacyMotion();
      })
      .catch(() => {});
    return () => {
      cancelled = true;
      cleanup?.();
    };
  }, []);
}
