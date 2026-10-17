"use client";

import { startTransition, useEffect, useState } from "react";

type VSliderAnimationsComponent = typeof import("./VSliderAnimations").default;

export function useVSliderAnimationsLoader(variant: "projects" | "services") {
  const [AnimateComponent, setAnimateComponent] =
    useState<VSliderAnimationsComponent | null>(null);

  useEffect(() => {
    let isCancelled = false;

    const controller =
      variant === "services"
        ? import("./components/service-slides/service-slides.animate")
        : import("./VSliderAnimations");
    void controller.then((module) => {
      if (isCancelled) {
        return;
      }

      startTransition(() => {
        setAnimateComponent(() => module.default);
      });
    });

    return () => {
      isCancelled = true;
    };
  }, [variant]);

  return { AnimateComponent };
}
