"use client";

import { useEffect } from "react";
import { destroyLenis, initLenis } from "@/lib/lenis";
import { dimensionsStore } from "@/store/dimensionsStore";

export default function Initializer() {
  useEffect(() => {
    initLenis();

    const updateVw = () => {
      const width = window.innerWidth || document.documentElement.clientWidth;
      dimensionsStore.getState().setVw(width);
    };

    updateVw();
    window.addEventListener("resize", updateVw, { passive: true });

    return () => {
      window.removeEventListener("resize", updateVw);
      destroyLenis();
    };
  }, []);

  return null;
}
