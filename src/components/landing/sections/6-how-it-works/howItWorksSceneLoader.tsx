"use client";

import { startTransition, useEffect, useState } from "react";
import type { HowItWorksAssets } from "@/lib/howItWorks3d/howItWorks.shared";
import { LANDING_3D_IMAGE_FALLBACK_MAX_WIDTH } from "@/lib/landing3d/spline.shared";
import { useImageReveal } from "@/lib/useImageReveal";
import styles from "./how-it-works.module.css";

type HowItWorksSceneComponent =
  typeof import("./howItWorksScene.client").default;

type HowItWorksSceneLoaderProps = {
  sceneId: string;
  assets: HowItWorksAssets;
  imageLabel: string;
  sceneLabel: string;
};

export default function HowItWorksSceneLoader({
  sceneId,
  assets,
  imageLabel,
  sceneLabel,
}: HowItWorksSceneLoaderProps) {
  const [isDesktopViewport, setIsDesktopViewport] = useState(false);
  const [SceneComponent, setSceneComponent] =
    useState<HowItWorksSceneComponent | null>(null);
  const isMobileImageLoaded = useImageReveal(
    isDesktopViewport ? null : assets.placeholderImageUrl,
  );

  useEffect(() => {
    const mediaQuery = window.matchMedia(
      `(min-width: ${LANDING_3D_IMAGE_FALLBACK_MAX_WIDTH + 1}px)`,
    );
    const updateViewportMode = () => {
      setIsDesktopViewport(mediaQuery.matches);
    };

    updateViewportMode();
    mediaQuery.addEventListener("change", updateViewportMode);

    return () => {
      mediaQuery.removeEventListener("change", updateViewportMode);
    };
  }, []);

  useEffect(() => {
    if (!isDesktopViewport) {
      return;
    }

    let isCancelled = false;

    void import("./howItWorksScene.client").then((module) => {
      if (isCancelled) {
        return;
      }

      startTransition(() => {
        setSceneComponent(() => module.default);
      });
    });

    return () => {
      isCancelled = true;
    };
  }, [isDesktopViewport]);

  if (!isDesktopViewport) {
    return (
      <div
        className={styles.mobileScene}
        data-img-loaded={isMobileImageLoaded ? "true" : "false"}
        style={{ backgroundImage: `url(${assets.placeholderImageUrl})` }}
        role="img"
        aria-label={imageLabel}
      />
    );
  }

  if (!SceneComponent) {
    return null;
  }

  return (
    <SceneComponent sceneId={sceneId} assets={assets} label={sceneLabel} />
  );
}
