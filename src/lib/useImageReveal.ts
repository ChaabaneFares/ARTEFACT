"use client";

import { useEffect, useState } from "react";

/**
 * Tracks when an image URL is decodable so CSS-background elements can fade
 * in instead of popping. Probes via `new Image()`, which resolves from the
 * HTTP cache when the browser (or the media scheduler) already fetched the
 * URL, so it never downloads twice.
 */
export function useImageReveal(url: string | null | undefined): boolean {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (!url) {
      setIsLoaded(false);
      return;
    }

    let isCancelled = false;
    const image = new window.Image();

    const markLoaded = () => {
      if (!isCancelled) {
        setIsLoaded(true);
      }
    };

    image.decoding = "async";
    image.src = url;

    // Cached images can complete synchronously and never fire load events.
    if (image.complete && image.naturalWidth > 0) {
      markLoaded();
      return () => {
        isCancelled = true;
      };
    }

    setIsLoaded(false);
    image.addEventListener("load", markLoaded, { once: true });
    // A failed image keeps opacity 0 by design: revealing a broken
    // background would flash the empty box.

    return () => {
      isCancelled = true;
      image.removeEventListener("load", markLoaded);
    };
  }, [url]);

  return isLoaded;
}
