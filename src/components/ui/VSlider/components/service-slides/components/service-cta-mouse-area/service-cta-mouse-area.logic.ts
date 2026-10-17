"use client";

import { useRef } from "react";
import { useDeferredMotion } from "@/lib/useDeferredMotion";

const loadMotion = () =>
  import("./service-cta-mouse-area.animate").then(
    (module) => module.mountServiceCtaMotion,
  );

export function useServiceCtaMouseArea() {
  const areaRef = useRef<HTMLDivElement>(null);
  useDeferredMotion(areaRef, loadMotion);
  return { areaRef };
}
