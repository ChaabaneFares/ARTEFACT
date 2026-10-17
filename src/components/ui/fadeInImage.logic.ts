"use client";

import type { ImageProps } from "next/image";
import { useCallback, useState } from "react";

export function useFadeInImage(
  src: ImageProps["src"],
  onLoad: ImageProps["onLoad"],
) {
  const [loadedSource, setLoadedSource] = useState<ImageProps["src"] | null>(
    null,
  );
  const handleLoad = useCallback<NonNullable<ImageProps["onLoad"]>>(
    (event) => {
      setLoadedSource(src);
      onLoad?.(event);
    },
    [src, onLoad],
  );
  const handleRef = useCallback(
    (element: HTMLImageElement | null) => {
      if (element?.complete && element.naturalWidth > 0) setLoadedSource(src);
    },
    [src],
  );
  return { isLoaded: loadedSource === src, handleLoad, handleRef };
}
