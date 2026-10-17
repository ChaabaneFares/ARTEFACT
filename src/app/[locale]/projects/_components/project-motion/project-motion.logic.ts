"use client";

import { useEffect, useState } from "react";

type Controller = typeof import("./project-motion.animate").default;
export function useProjectMotionLoader() {
  const [Controller, setController] = useState<Controller | null>(null);
  useEffect(() => {
    let cancelled = false;
    void import("./project-motion.animate").then((module) => {
      if (!cancelled) setController(() => module.default);
    });
    return () => {
      cancelled = true;
    };
  }, []);
  return { Controller };
}
