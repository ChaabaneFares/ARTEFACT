"use client";

import { useEffect, useRef, useState } from "react";
import { startLenis, stopLenis } from "@/lib/lenis";

export function useBrandIntroLogic() {
  const introRef = useRef<HTMLElement>(null);
  // The shared layout mounts once per document, so reloads on every route
  // show the intro while client-side navigation keeps its dismissed state.
  const [isPresent, setIsPresent] = useState(true);

  useEffect(() => {
    const intro = introRef.current;

    if (!intro) {
      return;
    }

    // CSS starts the timeline at first paint, before hydration. Read its
    // remaining time so a late effect never extends the introduction.
    const animation = intro.getAnimations()[0];
    const endTime = animation?.effect?.getComputedTiming().endTime;
    const currentTime = animation?.currentTime;
    const remaining =
      typeof endTime === "number" && typeof currentTime === "number"
        ? Math.max(0, endTime - currentTime)
        : 0;

    if (remaining === 0 || getComputedStyle(intro).visibility === "hidden") {
      setIsPresent(false);
      return;
    }

    const inertElements: Array<{ element: HTMLElement; wasInert: boolean }> =
      [];
    let branch: HTMLElement = intro;

    // Keep every page section mounted and loading, while temporarily removing
    // the content behind the overlay from keyboard and pointer interaction.
    while (branch.parentElement) {
      for (const sibling of branch.parentElement.children) {
        if (sibling !== branch && sibling instanceof HTMLElement) {
          inertElements.push({ element: sibling, wasInert: sibling.inert });
          sibling.inert = true;
        }
      }

      branch = branch.parentElement;

      if (branch === document.body) {
        break;
      }
    }

    const previousOverflow = document.body.style.overflow;
    const previousRootOverflow = document.documentElement.style.overflowY;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflowY = "hidden";
    stopLenis();

    const preventScroll = (event: Event) => event.preventDefault();
    const preventScrollKeys = (event: KeyboardEvent) => {
      if (
        [
          "ArrowUp",
          "ArrowDown",
          "PageUp",
          "PageDown",
          "Home",
          "End",
          " ",
        ].includes(event.key)
      ) {
        event.preventDefault();
      }
    };

    window.addEventListener("wheel", preventScroll, { passive: false });
    window.addEventListener("touchmove", preventScroll, { passive: false });
    window.addEventListener("keydown", preventScrollKeys);

    let hasReleased = false;
    const release = () => {
      if (hasReleased) {
        return;
      }

      hasReleased = true;
      document.body.style.overflow = previousOverflow;
      document.documentElement.style.overflowY = previousRootOverflow;
      for (const { element, wasInert } of inertElements) {
        element.inert = wasInert;
      }
      window.removeEventListener("wheel", preventScroll);
      window.removeEventListener("touchmove", preventScroll);
      window.removeEventListener("keydown", preventScrollKeys);
      startLenis();
    };
    const timerId = window.setTimeout(() => {
      release();
      setIsPresent(false);
    }, remaining);

    return () => {
      window.clearTimeout(timerId);
      release();
    };
  }, []);

  return { introRef, isPresent };
}
