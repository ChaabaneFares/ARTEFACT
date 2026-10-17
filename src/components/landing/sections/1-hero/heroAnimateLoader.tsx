"use client";

import { startTransition, useEffect, useState } from "react";

type HeroAnimateComponent = typeof import("./hero.animate").default;

export default function HeroAnimateLoader() {
  const [AnimateComponent, setAnimateComponent] =
    useState<HeroAnimateComponent | null>(null);

  useEffect(() => {
    let isCancelled = false;

    void import("./hero.animate").then((module) => {
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

  if (!AnimateComponent) {
    return null;
  }

  return <AnimateComponent />;
}
