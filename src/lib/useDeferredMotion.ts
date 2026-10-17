"use client";

import { type RefObject, useEffect } from "react";

type MountMotion<T extends HTMLElement> = (element: T) => () => void;

/** Load optional motion near its control; rendering and input never wait. */
export function useDeferredMotion<T extends HTMLElement>(
  ref: RefObject<T | null>,
  load: () => Promise<MountMotion<T>>,
) {
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    let cancelled = false;
    let started = false;
    let cleanup: (() => void) | undefined;
    let observer: IntersectionObserver | undefined;
    const start = () => {
      if (started || cancelled) return;
      started = true;
      observer?.disconnect();
      void load()
        .then((mount) => {
          if (!cancelled) cleanup = mount(element);
        })
        .catch(() => {});
    };
    if (typeof IntersectionObserver === "undefined") start();
    else {
      observer = new IntersectionObserver(
        (entries) => {
          if (entries.some((entry) => entry.isIntersecting)) start();
        },
        { rootMargin: "200px" },
      );
      observer.observe(element);
    }
    return () => {
      cancelled = true;
      observer?.disconnect();
      cleanup?.();
    };
  }, [ref, load]);
}
