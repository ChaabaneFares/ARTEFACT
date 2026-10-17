"use client";

import { startTransition, useEffect, useState } from "react";

type FooterAnimateComponent = typeof import("./footer.animate").default;

export function useFooterAnimateLoader() {
  const [AnimateComponent, setAnimateComponent] =
    useState<FooterAnimateComponent | null>(null);

  useEffect(() => {
    let isCancelled = false;

    void import("./footer.animate").then((module) => {
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
  }, []);

  return AnimateComponent;
}
