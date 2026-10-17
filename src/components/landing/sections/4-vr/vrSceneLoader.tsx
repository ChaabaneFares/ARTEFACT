"use client";

import { startTransition, useEffect, useState } from "react";
import { LANDING_3D_IMAGE_FALLBACK_MAX_WIDTH } from "@/lib/landing3d/spline.shared";
import { useImageReveal } from "@/lib/useImageReveal";
import styles from "./vr.module.css";

const VR_MOBILE_IMAGE_URL = "/assets/landing-page/vr/vr-mobile.jpg";

type VrSceneComponent = typeof import("./vrScene.client").default;

type VrSceneLoaderProps = {
  sceneId: string;
  headsetLabel: string;
  sceneLabel: string;
};

export default function VrSceneLoader({
  sceneId,
  headsetLabel,
  sceneLabel,
}: VrSceneLoaderProps) {
  const [isDesktopViewport, setIsDesktopViewport] = useState(false);
  const [SceneComponent, setSceneComponent] = useState<VrSceneComponent | null>(
    null,
  );
  const isMobileImageLoaded = useImageReveal(
    isDesktopViewport ? null : VR_MOBILE_IMAGE_URL,
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

    void import("./vrScene.client").then((module) => {
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
        style={{ backgroundImage: `url(${VR_MOBILE_IMAGE_URL})` }}
        role="img"
        aria-label={headsetLabel}
      />
    );
  }

  if (!SceneComponent) {
    return null;
  }

  return <SceneComponent sceneId={sceneId} label={sceneLabel} />;
}
