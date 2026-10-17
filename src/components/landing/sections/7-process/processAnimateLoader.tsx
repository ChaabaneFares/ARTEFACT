"use client";

import { startTransition, useEffect, useState } from "react";

type ProcessAnimateComponent = typeof import("./process.animate").default;

type ProcessAnimateLoaderProps = {
  sectionId: string;
};

export default function ProcessAnimateLoader({
  sectionId,
}: ProcessAnimateLoaderProps) {
  const [AnimateComponent, setAnimateComponent] =
    useState<ProcessAnimateComponent | null>(null);

  useEffect(() => {
    let isCancelled = false;

    void import("./process.animate").then((module) => {
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

  return <AnimateComponent sectionId={sectionId} />;
}
