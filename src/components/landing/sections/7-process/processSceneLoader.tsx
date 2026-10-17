"use client";

import { startTransition, useEffect, useState } from "react";
import styles from "./process.module.css";

type ProcessSceneComponent = typeof import("./processScene.client").default;

type ProcessSceneLoaderProps = {
  sceneId: string;
  sceneUrl: string;
  objectId: string;
  mobileImageUrl: string;
  staticImageUrl?: string;
  materialOverride?: {
    materialId: string;
    meshIds: string[];
  };
  useStaticScene?: boolean;
  label: string;
  variant?: "default" | "right";
};

export default function ProcessSceneLoader({
  sceneId,
  sceneUrl,
  objectId,
  mobileImageUrl,
  staticImageUrl,
  materialOverride,
  useStaticScene = false,
  label,
  variant,
}: ProcessSceneLoaderProps) {
  const [SceneComponent, setSceneComponent] =
    useState<ProcessSceneComponent | null>(null);

  useEffect(() => {
    if (useStaticScene) {
      return;
    }

    let isCancelled = false;

    void import("./processScene.client").then((module) => {
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
  }, [useStaticScene]);

  const variantClassName =
    variant === "right" ? styles.sceneMountRight : styles.sceneMount;
  const staticClassName =
    variant === "right" ? styles.staticSceneRight : styles.staticScene;
  const staticSceneImageUrl = staticImageUrl ?? mobileImageUrl;

  if (useStaticScene) {
    return (
      <div
        className={`${variantClassName} ${styles.staticSceneMount}`}
        data-scene-id={sceneId}
        aria-label={label}
        role="img"
      >
        <div
          className={staticClassName}
          style={{ backgroundImage: `url(${staticSceneImageUrl})` }}
          aria-hidden="true"
        />
      </div>
    );
  }

  if (!SceneComponent) {
    return null;
  }

  return (
    <SceneComponent
      sceneId={sceneId}
      sceneUrl={sceneUrl}
      objectId={objectId}
      mobileImageUrl={mobileImageUrl}
      staticImageUrl={staticImageUrl}
      materialOverride={materialOverride}
      label={label}
      variant={variant}
    />
  );
}
