"use client";

import { startTransition, useEffect, useState } from "react";

type VrAnimateComponent = typeof import("./vr.animate").default;

type VrAnimateLoaderProps = {
  sceneId: string;
};

export default function VrAnimateLoader({ sceneId }: VrAnimateLoaderProps) {
  const [AnimateComponent, setAnimateComponent] =
    useState<VrAnimateComponent | null>(null);

  useEffect(() => {
    let isCancelled = false;

    void import("./vr.animate").then((module) => {
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
