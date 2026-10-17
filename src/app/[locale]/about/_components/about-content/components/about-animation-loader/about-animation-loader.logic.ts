"use client";

import { startTransition, useEffect, useState } from "react";

type AboutAnimation =
  typeof import("../about-animation/about-animation").default;

export function useAboutAnimationLoader() {
  const [Animation, setAnimation] = useState<AboutAnimation | null>(null);
  useEffect(() => {
    let cancelled = false;
    void import("../about-animation/about-animation").then((module) => {
      if (cancelled) return;
      startTransition(() => setAnimation(() => module.default));
    });
    return () => {
      cancelled = true;
    };
  }, []);
  return { Animation };
}
