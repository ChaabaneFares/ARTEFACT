"use client";

import { useRef } from "react";
import { useDeferredMotion } from "@/lib/useDeferredMotion";

const loadMotion = () =>
  import("./VSliderCta.animate").then((module) => module.mountVSliderCtaMotion);

export function useVSliderCta() {
  const buttonRef = useRef<HTMLAnchorElement>(null);
  useDeferredMotion(buttonRef, loadMotion);
  return { buttonRef };
}
