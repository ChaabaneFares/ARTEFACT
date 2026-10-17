"use client";

import { startTransition, useEffect, useState } from "react";

import type { MediaMotionLabels } from "./media.types";

type MediaAnimateComponent = typeof import("./media.animate").default;

export default function MediaAnimateLoader({
  labels,
}: {
  labels: MediaMotionLabels;
}) {
  const [AnimateComponent, setAnimateComponent] =
    useState<MediaAnimateComponent | null>(null);

  useEffect(() => {
    let isCancelled = false;

    void import("./media.animate").then((module) => {
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

  return <AnimateComponent labels={labels} />;
}
