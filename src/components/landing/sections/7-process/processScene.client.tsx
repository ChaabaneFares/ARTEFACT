"use client";

import type { Application, SPEObject } from "@splinetool/runtime";
import {
  startTransition,
  useEffect,
  useEffectEvent,
  useRef,
  useState,
} from "react";
import { useScenePaintVisibility } from "@/lib/landing3d/canvasParking";
import { useSceneActivation } from "@/lib/landing3d/sceneActivation";
import { useSceneBootSlot } from "@/lib/landing3d/sceneBootGate";
import { logLanding3dDiagnostic } from "@/lib/landing3d/sceneDiagnostics";
import {
  applySplineBackingStoreSize,
  applySplineViewportScale,
  composeTargetTransform,
  createPointerTransform,
  createZeroTransform,
  LANDING_3D_BASE_TRANSFORM_CAPTURE_DELAY_MS,
  LANDING_3D_IMAGE_FALLBACK_MAX_WIDTH,
  LANDING_3D_INACTIVITY_PAUSE_GRACE_MS,
  LANDING_3D_PREWARM_RENDER_BURST_FRAMES,
  loadCachedArrayBufferAsset,
  loadSplineRuntimeModule,
  type PointerBounds,
  readPointerBounds,
  requestSplineWarmRender,
  SCENE_ANIMATION_EASING,
  type TransformState,
} from "@/lib/landing3d/spline.shared";
import { registerProcessSceneController } from "@/lib/landingProcess/processSceneController";
import { kickScroll } from "@/lib/scrollInteraction/scrollTrigger";
import { useImageReveal } from "@/lib/useImageReveal";
import styles from "./process.module.css";

const SCENE_PREWARM_MARGIN = "120% 0px";
const SCENE_ACTIVATE_MARGIN = "14% 0px";
const INITIAL_RENDER_BURST_FRAMES = 6;
const RESIZE_RENDER_BURST_FRAMES = 3;
const BASE_TRANSFORM_IDLE_TIMEOUT_MS = 1500;
const PROCESS_BACKING_STORE_SCALE = 0.6;
const MOBILE_BREAKPOINT = LANDING_3D_IMAGE_FALLBACK_MAX_WIDTH;

type ProcessSceneClientProps = {
  sceneId: string;
  sceneUrl: string;
  objectId: string;
  mobileImageUrl: string;
  staticImageUrl?: string;
  materialOverride?: {
    materialId: string;
    meshIds: string[];
  };
  label: string;
  variant?: "default" | "right";
};

type SplineObject = Pick<SPEObject, "position" | "rotation">;
type InternalSplineObject = {
  updateByObjUpdateOp(
    props: {
      material: string;
    },
    context: {
      scene: object;
      shared: object;
    },
  ): void;
};
type InternalSplineScene = {
  getObjectByProperty(
    property: "uuid",
    value: string,
  ): InternalSplineObject | undefined;
};
type InternalSplineApplication = Application & {
  _scene?: InternalSplineScene;
  _sharedAssetsManager?: object;
};

function applySceneMaterialOverrides(
  runtimeApp: InternalSplineApplication,
  materialOverride?: {
    materialId: string;
    meshIds: string[];
  },
) {
  if (
    !materialOverride ||
    !runtimeApp._scene ||
    !runtimeApp._sharedAssetsManager
  ) {
    return;
  }

  for (const meshId of materialOverride.meshIds) {
    const mesh = runtimeApp._scene.getObjectByProperty("uuid", meshId);

    if (!mesh) {
      continue;
    }

    mesh.updateByObjUpdateOp(
      { material: materialOverride.materialId },
      {
        scene: runtimeApp._scene,
        shared: runtimeApp._sharedAssetsManager,
      },
    );
  }

  runtimeApp.requestRender();
}

export default function ProcessSceneClient({
  sceneId,
  sceneUrl,
  objectId,
  mobileImageUrl,
  staticImageUrl,
  materialOverride,
  label,
  variant = "default",
}: ProcessSceneClientProps) {
  const sceneRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const runtimeAppRef = useRef<Application | null>(null);
  const objectRef = useRef<SplineObject | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const renderBurstFrameRef = useRef<number | null>(null);
  const baseTransformCaptureTimeoutRef = useRef<number | null>(null);
  const baseTransformIdleCallbackRef = useRef<number | null>(null);
  const inactivityPauseTimeoutRef = useRef<number | null>(null);
  const diagnosticTimeoutRef = useRef<number | null>(null);
  const isRuntimePausedRef = useRef(false);
  const baseTransformRef = useRef<TransformState | null>(null);
  const targetTransformRef = useRef<TransformState | null>(null);
  const pointerTransformRef = useRef<TransformState>(createZeroTransform());
  const pointerBoundsRef = useRef<PointerBounds | null>(null);
  const scrollRotationXRef = useRef(0);
  const isSceneActiveRef = useRef(false);
  const [isDesktopViewport, setIsDesktopViewport] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const isMobileImageLoaded = useImageReveal(
    isDesktopViewport ? null : mobileImageUrl,
  );
  const isStaticImageLoaded = useImageReveal(
    isDesktopViewport ? staticImageUrl : null,
  );
  const canMountScene = isDesktopViewport;

  const { isActive, shouldMount } = useSceneActivation({
    targetRef: sceneRef,
    activateMargin: SCENE_ACTIVATE_MARGIN,
    prewarmMargin: SCENE_PREWARM_MARGIN,
    enabled: canMountScene,
    preload: () => {
      void loadSplineRuntimeModule();
      void loadCachedArrayBufferAsset(sceneUrl, `${label} scene`);
    },
  });
  const shouldRenderScene = canMountScene && shouldMount;
  const canBootScene = useSceneBootSlot(shouldRenderScene, isReady, sceneRef);
  // The three process cards share one section and are on screen together, so
  // each paints whenever it intersects the viewport. Parking only the single
  // closest scene would leave the sibling cards blank.
  const isCanvasPaintVisible = useScenePaintVisibility({
    targetRef: sceneRef,
    enabled: isReady && isDesktopViewport,
  });
  const isRuntimeActive = canMountScene && isActive && isCanvasPaintVisible;

  const logSceneDiagnostic = useEffectEvent((reason: string) => {
    logLanding3dDiagnostic({
      sceneId,
      reason,
      host: sceneRef.current,
      canvas: canvasRef.current,
      runtimeApp: runtimeAppRef.current,
      sceneObject: objectRef.current,
      baseTransform: baseTransformRef.current,
      targetTransform: targetTransformRef.current,
      state: {
        label,
        variant,
        canMountScene,
        isDesktopViewport,
        isActive,
        shouldMount,
        shouldRenderScene,
        isReady,
        isCanvasPaintVisible,
        isRuntimeActive,
        isSceneActive: isSceneActiveRef.current,
        isRuntimePaused: isRuntimePausedRef.current,
        scrollRotationX: scrollRotationXRef.current,
        backingStoreScale: PROCESS_BACKING_STORE_SCALE,
      },
    });
  });

  const scheduleSceneDiagnostic = useEffectEvent(
    (reason: string, delay = 250) => {
      if (!isReady || !isCanvasPaintVisible) {
        return;
      }

      if (diagnosticTimeoutRef.current !== null) {
        window.clearTimeout(diagnosticTimeoutRef.current);
      }

      diagnosticTimeoutRef.current = window.setTimeout(() => {
        diagnosticTimeoutRef.current = null;
        logSceneDiagnostic(reason);
      }, delay);
    },
  );

  const clearSceneRuntime = useEffectEvent(() => {
    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    if (renderBurstFrameRef.current !== null) {
      cancelAnimationFrame(renderBurstFrameRef.current);
    }

    if (baseTransformCaptureTimeoutRef.current !== null) {
      window.clearTimeout(baseTransformCaptureTimeoutRef.current);
    }

    if (
      baseTransformIdleCallbackRef.current !== null &&
      "cancelIdleCallback" in window
    ) {
      window.cancelIdleCallback(baseTransformIdleCallbackRef.current);
    }

    if (inactivityPauseTimeoutRef.current !== null) {
      window.clearTimeout(inactivityPauseTimeoutRef.current);
    }

    if (diagnosticTimeoutRef.current !== null) {
      window.clearTimeout(diagnosticTimeoutRef.current);
    }

    runtimeAppRef.current?.dispose();
    runtimeAppRef.current = null;
    objectRef.current = null;
    animationFrameRef.current = null;
    renderBurstFrameRef.current = null;
    baseTransformCaptureTimeoutRef.current = null;
    baseTransformIdleCallbackRef.current = null;
    inactivityPauseTimeoutRef.current = null;
    diagnosticTimeoutRef.current = null;
    isRuntimePausedRef.current = false;
    baseTransformRef.current = null;
    targetTransformRef.current = null;
    canvasRef.current = null;
    pointerBoundsRef.current = null;
    pointerTransformRef.current = createZeroTransform();
    scrollRotationXRef.current = 0;
  });

  const resumeRuntime = useEffectEvent(() => {
    if (inactivityPauseTimeoutRef.current !== null) {
      window.clearTimeout(inactivityPauseTimeoutRef.current);
      inactivityPauseTimeoutRef.current = null;
    }

    const runtimeApp = runtimeAppRef.current;
    if (!runtimeApp || !isRuntimePausedRef.current) {
      return;
    }

    runtimeApp.play();
    isRuntimePausedRef.current = false;
  });

  const schedulePause = useEffectEvent(() => {
    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    if (inactivityPauseTimeoutRef.current !== null) {
      window.clearTimeout(inactivityPauseTimeoutRef.current);
    }

    inactivityPauseTimeoutRef.current = window.setTimeout(() => {
      inactivityPauseTimeoutRef.current = null;
      const runtimeApp = runtimeAppRef.current;
      if (
        !runtimeApp ||
        isRuntimePausedRef.current ||
        isSceneActiveRef.current
      ) {
        return;
      }

      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }

      runtimeApp.stop();
      isRuntimePausedRef.current = true;
    }, LANDING_3D_INACTIVITY_PAUSE_GRACE_MS);
  });

  const runAnimation = useEffectEvent(() => {
    const sceneObject = objectRef.current;
    const targetTransform = targetTransformRef.current;
    const runtimeApp = runtimeAppRef.current;

    if (
      !sceneObject ||
      !targetTransform ||
      !runtimeApp ||
      isRuntimePausedRef.current
    ) {
      animationFrameRef.current = null;
      return;
    }

    const positionDeltaX = targetTransform.position.x - sceneObject.position.x;
    const positionDeltaY = targetTransform.position.y - sceneObject.position.y;
    const rotationDeltaX = targetTransform.rotation.x - sceneObject.rotation.x;
    const rotationDeltaY = targetTransform.rotation.y - sceneObject.rotation.y;

    sceneObject.position.x += positionDeltaX * SCENE_ANIMATION_EASING;
    sceneObject.position.y += positionDeltaY * SCENE_ANIMATION_EASING;
    sceneObject.rotation.x += rotationDeltaX * SCENE_ANIMATION_EASING;
    sceneObject.rotation.y += rotationDeltaY * SCENE_ANIMATION_EASING;
    runtimeApp.requestRender();

    const isSettled =
      Math.abs(positionDeltaX) < 0.01 &&
      Math.abs(positionDeltaY) < 0.01 &&
      Math.abs(rotationDeltaX) < 0.001 &&
      Math.abs(rotationDeltaY) < 0.001;

    if (isSettled) {
      animationFrameRef.current = null;
      return;
    }

    animationFrameRef.current = requestAnimationFrame(runAnimation);
  });

  const ensureAnimation = useEffectEvent(() => {
    if (animationFrameRef.current !== null || isRuntimePausedRef.current) {
      return;
    }

    animationFrameRef.current = requestAnimationFrame(runAnimation);
  });

  const syncTargetTransform = useEffectEvent((forceRender = false) => {
    const baseTransform = baseTransformRef.current;

    if (!baseTransform) {
      return;
    }

    targetTransformRef.current = composeTargetTransform(
      baseTransform,
      pointerTransformRef.current,
      scrollRotationXRef.current,
    );

    if (!forceRender && !isSceneActiveRef.current) {
      return;
    }

    ensureAnimation();
  });

  const updatePointerBounds = useEffectEvent(() => {
    const bounds = readPointerBounds(sceneRef.current);
    pointerBoundsRef.current = bounds;
    return bounds;
  });

  const runRenderBurst = useEffectEvent((frameCount: number) => {
    if (renderBurstFrameRef.current !== null) {
      cancelAnimationFrame(renderBurstFrameRef.current);
    }

    let remainingFrames = frameCount;

    const requestFrame = () => {
      const runtimeApp = runtimeAppRef.current;

      if (!runtimeApp || isRuntimePausedRef.current) {
        renderBurstFrameRef.current = null;
        return;
      }

      runtimeApp.requestRender();
      remainingFrames -= 1;

      if (remainingFrames <= 0) {
        renderBurstFrameRef.current = null;
        return;
      }

      renderBurstFrameRef.current = requestAnimationFrame(requestFrame);
    };

    requestFrame();
  });

  const captureBaseTransform = useEffectEvent(
    async (runtimeApp: Application) => {
      const sceneObject = runtimeApp.findObjectById(objectId) as
        | SplineObject
        | undefined;

      if (!sceneObject) {
        return;
      }

      objectRef.current = sceneObject;

      baseTransformRef.current = {
        position: {
          x: sceneObject.position.x,
          y: sceneObject.position.y,
        },
        rotation: {
          x: sceneObject.rotation.x,
          y: sceneObject.rotation.y,
        },
      };

      pointerTransformRef.current = createZeroTransform();

      updatePointerBounds();
      syncTargetTransform();
      kickScroll();
      runRenderBurst(
        isSceneActiveRef.current
          ? INITIAL_RENDER_BURST_FRAMES
          : LANDING_3D_PREWARM_RENDER_BURST_FRAMES,
      );
      await requestSplineWarmRender(runtimeApp);

      if (runtimeAppRef.current !== runtimeApp) {
        return;
      }

      startTransition(() => {
        setIsReady(true);
      });
    },
  );

  const handleLoad = useEffectEvent(async (runtimeApp: Application) => {
    runtimeAppRef.current = runtimeApp;
    isRuntimePausedRef.current = false;
    applySceneMaterialOverrides(
      runtimeApp as InternalSplineApplication,
      materialOverride,
    );

    const host = sceneRef.current;
    const nextCanvas = host?.querySelector("canvas");

    canvasRef.current =
      nextCanvas instanceof HTMLCanvasElement ? nextCanvas : null;
    applySplineViewportScale(canvasRef.current);

    if (host) {
      applySplineBackingStoreSize(
        runtimeApp,
        host,
        PROCESS_BACKING_STORE_SCALE,
      );
    }

    updatePointerBounds();

    if (baseTransformCaptureTimeoutRef.current !== null) {
      window.clearTimeout(baseTransformCaptureTimeoutRef.current);
      baseTransformCaptureTimeoutRef.current = null;
    }

    if (
      baseTransformIdleCallbackRef.current !== null &&
      "cancelIdleCallback" in window
    ) {
      window.cancelIdleCallback(baseTransformIdleCallbackRef.current);
      baseTransformIdleCallbackRef.current = null;
    }

    await new Promise<void>((resolve) => {
      const runCapture = () => {
        baseTransformCaptureTimeoutRef.current = null;
        baseTransformIdleCallbackRef.current = null;

        if (runtimeAppRef.current !== runtimeApp) {
          resolve();
          return;
        }

        void captureBaseTransform(runtimeApp).then(() => {
          if (
            runtimeAppRef.current === runtimeApp &&
            !isSceneActiveRef.current
          ) {
            schedulePause();
          }

          resolve();
        });
      };

      const idleCallback = (window as Window & typeof globalThis)
        .requestIdleCallback;
      if (typeof idleCallback === "function") {
        baseTransformIdleCallbackRef.current = idleCallback(runCapture, {
          timeout: BASE_TRANSFORM_IDLE_TIMEOUT_MS,
        });
      } else {
        baseTransformCaptureTimeoutRef.current = window.setTimeout(
          runCapture,
          LANDING_3D_BASE_TRANSFORM_CAPTURE_DELAY_MS,
        );
      }
    });
  });

  // biome-ignore lint/correctness/useExhaustiveDependencies: rerunning this effect disposes the Spline app and causes expensive remount churn.
  useEffect(() => {
    if (!canBootScene || runtimeAppRef.current) {
      return;
    }

    let isCancelled = false;

    const mountScene = async () => {
      const canvas = canvasRef.current;

      if (!canvas) {
        return;
      }

      try {
        const [{ Application: RuntimeApplication }, sceneBuffer] =
          await Promise.all([
            loadSplineRuntimeModule(),
            loadCachedArrayBufferAsset(sceneUrl, `${label} scene`),
          ]);

        if (isCancelled) {
          return;
        }

        const runtimeApp = new RuntimeApplication(canvas, {
          renderMode: "manual",
        });
        runtimeAppRef.current = runtimeApp;

        await runtimeApp.start(sceneBuffer, { interactive: false });

        if (isCancelled || runtimeAppRef.current !== runtimeApp) {
          return;
        }

        await handleLoad(runtimeApp);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.error(`Failed to load ${label} process scene: ${message}`);
      }
    };

    void mountScene();

    return () => {
      isCancelled = true;
      clearSceneRuntime();
    };
  }, [canBootScene]);

  useEffect(() => {
    const mediaQuery = window.matchMedia(
      `(min-width: ${MOBILE_BREAKPOINT + 1}px)`,
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

  // biome-ignore lint/correctness/useExhaustiveDependencies: leaving desktop mode should drop the live scene refs immediately.
  useEffect(() => {
    if (isDesktopViewport) {
      return;
    }

    setIsReady(false);
    clearSceneRuntime();
  }, [isDesktopViewport]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: useEffectEvent callbacks stay stable and should not retrigger the scene lifecycle.
  useEffect(() => {
    return registerProcessSceneController(sceneId, {
      setScrollRotationX(rotationX) {
        scrollRotationXRef.current = rotationX;

        if (!isSceneActiveRef.current || isRuntimePausedRef.current) {
          return;
        }

        syncTargetTransform();
      },
    });
  }, [sceneId]);

  const applyBackingStoreFromHost = useEffectEvent(() => {
    const runtimeApp = runtimeAppRef.current;
    const host = sceneRef.current;

    applySplineViewportScale(canvasRef.current);

    if (!runtimeApp || !host) {
      return;
    }

    applySplineBackingStoreSize(runtimeApp, host, PROCESS_BACKING_STORE_SCALE);
  });

  // biome-ignore lint/correctness/useExhaustiveDependencies: runtime-active changes should wake or idle the scene without retriggering effect-event identity.
  useEffect(() => {
    isSceneActiveRef.current = isRuntimeActive;

    if (!isRuntimeActive) {
      pointerBoundsRef.current = null;

      if (baseTransformRef.current) {
        pointerTransformRef.current = createZeroTransform();
        syncTargetTransform();
      }

      schedulePause();
      return;
    }

    resumeRuntime();
    updatePointerBounds();
    applyBackingStoreFromHost();
    syncTargetTransform(true);
    runRenderBurst(INITIAL_RENDER_BURST_FRAMES);
  }, [isRuntimeActive]);

  const isDiagnosticVisible = isReady && isCanvasPaintVisible;

  // biome-ignore lint/correctness/useExhaustiveDependencies: visibility changes should emit one settled, copyable diagnostic line.
  useEffect(() => {
    if (!isDiagnosticVisible) {
      return;
    }

    scheduleSceneDiagnostic("visible-active", 400);
  }, [isDiagnosticVisible]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: the resize listener should stay attached once and use the latest effect-event handlers.
  useEffect(() => {
    updatePointerBounds();

    const handleResize = () => {
      if (!isSceneActiveRef.current) {
        return;
      }

      updatePointerBounds();
      applyBackingStoreFromHost();
      runRenderBurst(RESIZE_RENDER_BURST_FRAMES);
      scheduleSceneDiagnostic("resize");
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  // biome-ignore lint/correctness/useExhaustiveDependencies: cleanup only belongs to unmount and must not dispose the scene on rerender.
  useEffect(() => {
    return () => {
      clearSceneRuntime();
    };
  }, []);

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!isSceneActiveRef.current || !baseTransformRef.current) {
      return;
    }

    const bounds = pointerBoundsRef.current ?? updatePointerBounds();

    if (!bounds) {
      return;
    }

    pointerTransformRef.current = createPointerTransform(
      event.clientX,
      event.clientY,
      bounds,
    );
    syncTargetTransform();
  };

  const handlePointerEnter = () => {
    if (!isSceneActiveRef.current) {
      return;
    }

    updatePointerBounds();
  };

  const handlePointerLeave = () => {
    if (!isSceneActiveRef.current || !baseTransformRef.current) {
      return;
    }

    pointerTransformRef.current = createZeroTransform();
    syncTargetTransform();
  };

  const variantClassName =
    variant === "right" ? styles.sceneMountRight : styles.sceneMount;
  const staticClassName =
    variant === "right" ? styles.staticSceneRight : styles.staticScene;
  // Keep the placeholder mounted after the scene is ready: it crossfades out
  // via CSS instead of unmounting, so transparent canvas regions never pop.
  const shouldShowPlaceholder = Boolean(staticImageUrl);
  const shouldParkCanvas = isReady && !isCanvasPaintVisible;

  if (!isDesktopViewport) {
    return (
      <div
        className={`${styles.mobileScene} ${variant === "right" ? styles.mobileSceneRight : ""}`}
        data-img-loaded={isMobileImageLoaded ? "true" : "false"}
        style={{ backgroundImage: `url(${mobileImageUrl})` }}
        role="img"
        aria-label={label}
      />
    );
  }

  return (
    <div
      ref={sceneRef}
      className={variantClassName}
      data-ready={isReady ? "true" : "false"}
      data-has-placeholder={shouldShowPlaceholder ? "true" : "false"}
      data-canvas-parked={shouldParkCanvas ? "true" : "false"}
      data-landing-scene-paint=""
      data-process-scene-paint=""
      data-scene-id={sceneId}
      onPointerEnter={handlePointerEnter}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      aria-busy={shouldMount && !isReady}
      aria-label={label}
      role="img"
    >
      {shouldShowPlaceholder ? (
        <div
          className={staticClassName}
          data-img-loaded={isStaticImageLoaded ? "true" : "false"}
          style={{ backgroundImage: `url(${staticImageUrl})` }}
          aria-hidden="true"
        />
      ) : null}

      {canBootScene ? (
        <div className={styles.splineHost}>
          <canvas ref={canvasRef} className={styles.splineCanvas} />
        </div>
      ) : null}
    </div>
  );
}
