"use client";

import { useRef } from "react";
import { useDeferredMotion } from "@/lib/useDeferredMotion";

const loadMotion = () =>
  import("./footerButton.animate").then(
    (module) => module.mountFooterButtonMotion,
  );

export function useFooterButton() {
  const buttonRef = useRef<HTMLAnchorElement>(null);
  useDeferredMotion(buttonRef, loadMotion);
  return { buttonRef };
}
