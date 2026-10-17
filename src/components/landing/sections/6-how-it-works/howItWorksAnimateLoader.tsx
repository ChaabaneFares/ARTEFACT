"use client";

import { startTransition, useEffect, useState } from "react";

type HowItWorksAnimateComponent =
  typeof import("./how-it-works.animate").default;

type HowItWorksAnimateLoaderProps = {
  sceneId: string;
};

export default function HowItWorksAnimateLoader({
  sceneId,
}: HowItWorksAnimateLoaderProps) {
  const [AnimateComponent, setAnimateComponent] =
    useState<HowItWorksAnimateComponent | null>(null);

  useEffect(() => {
    let isCancelled = false;

    void import("./how-it-works.animate").then((module) => {
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

  return <AnimateComponent sceneId={sceneId} />;
}
