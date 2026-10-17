"use client";

import type { Application } from "@splinetool/runtime";
import {
  type CSSProperties,
  startTransition,
  useEffect,
  useEffectEvent,
  useRef,
  useState,
} from "react";
import type { HowItWorksAssets } from "@/lib/howItWorks3d/howItWorks.shared";
import { registerHowItWorksSceneController } from "@/lib/howItWorks3d/howItWorksSceneController";
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
  LANDING_3D_FULL_BACKING_STORE_SCALE,
  LANDING_3D_INITIAL_RENDER_BURST_FRAMES,
  LANDING_3D_PREWARM_RENDER_BURST_FRAMES,
  LANDING_3D_RESIZE_RENDER_BURST_FRAMES,
  loadCachedArrayBufferAsset,
  loadSplineRuntimeModule,
  type PointerBounds,
  readPointerBounds,
  requestSplineWarmRender,
  SCENE_ANIMATION_EASING,
  type SplineMotionObject,
  type TransformState,
} from "@/lib/landing3d/spline.shared";
import { kickScroll } from "@/lib/scrollInteraction/scrollTrigger";
import { useImageReveal } from "@/lib/useImageReveal";
import styles from "./how-it-works.module.css";

const HOW_IT_WORKS_OBJECT_ID = "0bd3b87e-e1c3-47a5-b643-32405c2e58cb";
const HOW_IT_WORKS_PREWARM_MARGIN = "90% 0px";
const HOW_IT_WORKS_ACTIVATE_MARGIN = "20% 0px";

type HowItWorksSceneClientProps = {
  sceneId: string;
  /**
   * The page language's scene and still. The still sits under the canvas
   * until the live scene is ready, so fast scrollers never meet an empty
   * stage; it is the same render as the mobile fallback.
   */
  assets: HowItWorksAssets;
  label: string;
};

export default function HowItWorksSceneClient({
  sceneId,
  assets,
  label,
}: HowItWorksSceneClientProps) {
  const sceneRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const runtimeAppRef = useRef<Application | null>(null);
  const objectRef = useRef<SplineMotionObject | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const renderBurstFrameRef = useRef<number | null>(null);
  const baseTransformCaptureTimeoutRef = useRef<number | null>(null);
  const diagnosticTimeoutRef = useRef<number | null>(null);
  const baseTransformRef = useRef<TransformState | null>(null);
  const targetTransformRef = useRef<TransformState | null>(null);
  const pointerTransformRef = useRef<TransformState>(createZeroTransform());
  const pointerBoundsRef = useRef<PointerBounds | null>(null);
  const scrollRotationXRef = useRef(0);
  const isSceneActiveRef = useRef(false);
  const isRuntimePausedRef = useRef(false);
  const [isReady, setIsReady] = useState(false);
  const isPlaceholderLoaded = useImageReveal(assets.placeholderImageUrl);

  const { isActive, shouldMount } = useSceneActivation({
    targetRef: sceneRef,
    activateMargin: HOW_IT_WORKS_ACTIVATE_MARGIN,
    prewarmMargin: HOW_IT_WORKS_PREWARM_MARGIN,
    preload: () => {
      void loadSplineRuntimeModule();
      void loadCachedArrayBufferAsset(assets.sceneUrl, "How it works scene");
    },
  });
  const shouldRenderScene = shouldMount;
  const canBootScene = useSceneBootSlot(shouldRenderScene, isReady, sceneRef);
  // Paints whenever it is on screen. Parking the scene because another
  // section happened to sit closer to the viewport centre would blank a
  // section the user is looking at.
  const isCanvasPaintVisible = useScenePaintVisibility({
    targetRef: sceneRef,
    enabled: isReady,
  });
  const isRuntimeActive = isActive && isCanvasPaintVisible;

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
        isActive,
        shouldMount,
        shouldRenderScene,
        isReady,
        isCanvasPaintVisible,
        isRuntimeActive,
        isSceneActive: isSceneActiveRef.current,
        isRuntimePaused: isRuntimePausedRef.current,
        scrollRotationX: scrollRotationXRef.current,
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

    if (diagnosticTimeoutRef.current !== null) {
      window.clearTimeout(diagnosticTimeoutRef.current);
    }

    runtimeAppRef.current?.stop();
    runtimeAppRef.current = null;
    objectRef.current = null;
    animationFrameRef.current = null;
    renderBurstFrameRef.current = null;
    baseTransformCaptureTimeoutRef.current = null;
    diagnosticTimeoutRef.current = null;
    baseTransformRef.current = null;
    targetTransformRef.current = null;
    canvasRef.current = null;
    pointerBoundsRef.current = null;
    pointerTransformRef.current = createZeroTransform();
    scrollRotationXRef.current = 0;
    isRuntimePausedRef.current = false;
  });

  const cancelSceneFrames = useEffectEvent(() => {
    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    if (renderBurstFrameRef.current !== null) {
      cancelAnimationFrame(renderBurstFrameRef.current);
      renderBurstFrameRef.current = null;
    }
  });

  const pauseRuntime = useEffectEvent(() => {
    cancelSceneFrames();

    const runtimeApp = runtimeAppRef.current;

    if (!runtimeApp || isRuntimePausedRef.current) {
      return;
    }

    runtimeApp.stop();
    isRuntimePausedRef.current = true;
  });

  const resumeRuntime = useEffectEvent(() => {
    const runtimeApp = runtimeAppRef.current;

    if (!runtimeApp || !isRuntimePausedRef.current) {
      return;
    }

    runtimeApp.play();
    isRuntimePausedRef.current = false;
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

  const applyBackingStoreFromHost = useEffectEvent(() => {
    const runtimeApp = runtimeAppRef.current;
    const host = sceneRef.current;

    applySplineViewportScale(canvasRef.current);

    if (!runtimeApp || !host) {
      return;
    }

    applySplineBackingStoreSize(
      runtimeApp,
      host,
      LANDING_3D_FULL_BACKING_STORE_SCALE,
    );
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
      const sceneObject = runtimeApp.findObjectById(HOW_IT_WORKS_OBJECT_ID) as
        | SplineMotionObject
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

      applyBackingStoreFromHost();
      syncTargetTransform();
      kickScroll();
      runRenderBurst(
        isSceneActiveRef.current
          ? LANDING_3D_INITIAL_RENDER_BURST_FRAMES
          : LANDING_3D_PREWARM_RENDER_BURST_FRAMES,
      );
      await requestSplineWarmRender(runtimeApp);

      if (runtimeAppRef.current !== runtimeApp) {
        return;
      }

      startTransition(() => {
        setIsReady(true);
      });

      if (!isSceneActiveRef.current) {
        pauseRuntime();
      }
    },
  );

  const handleLoad = useEffectEvent((runtimeApp: Application) => {
    runtimeAppRef.current = runtimeApp;

    const nextCanvas = sceneRef.current?.querySelector("canvas");
    canvasRef.current =
      nextCanvas instanceof HTMLCanvasElement ? nextCanvas : null;
    applySplineViewportScale(canvasRef.current);
    updatePointerBounds();

    if (baseTransformCaptureTimeoutRef.current !== null) {
      window.clearTimeout(baseTransformCaptureTimeoutRef.current);
    }

    baseTransformCaptureTimeoutRef.current = window.setTimeout(() => {
      void captureBaseTransform(runtimeApp);
    }, LANDING_3D_BASE_TRANSFORM_CAPTURE_DELAY_MS);
  });

  // biome-ignore lint/correctness/useExhaustiveDependencies: useEffectEvent callbacks stay stable and should not retrigger the scene lifecycle.
  useEffect(() => {
    return registerHowItWorksSceneController(sceneId, {
      setScrollRotationX(rotationX) {
        scrollRotationXRef.current = rotationX;
        syncTargetTransform();
      },
    });
  }, [sceneId]);

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
            loadCachedArrayBufferAsset(assets.sceneUrl, "How it works scene"),
          ]);

        if (isCancelled) {
          return;
        }

        const runtimeApp = new RuntimeApplication(canvas, {
          renderMode: "manual",
        });
        runtimeAppRef.current = runtimeApp;

        await runtimeApp.start(sceneBuffer);

        if (isCancelled || runtimeAppRef.current !== runtimeApp) {
          return;
        }

        handleLoad(runtimeApp);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.error(`Failed to load how-it-works scene: ${message}`);
      }
    };

    void mountScene();

    return () => {
      isCancelled = true;
      clearSceneRuntime();
    };
  }, [canBootScene]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: runtime-active changes should wake or idle the scene without retriggering effect-event identity.
  useEffect(() => {
    isSceneActiveRef.current = isRuntimeActive;

    if (!isRuntimeActive) {
      pointerBoundsRef.current = null;

      if (baseTransformRef.current) {
        pointerTransformRef.current = createZeroTransform();
        syncTargetTransform();
      }

      pauseRuntime();
      return;
    }

    resumeRuntime();
    applyBackingStoreFromHost();
    updatePointerBounds();
    syncTargetTransform(true);
    runRenderBurst(LANDING_3D_INITIAL_RENDER_BURST_FRAMES);
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
      runRenderBurst(LANDING_3D_RESIZE_RENDER_BURST_FRAMES);
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

  const shouldParkCanvas = isReady && !isCanvasPaintVisible;

  return (
    <div
      ref={sceneRef}
      className={styles.sceneMount}
      data-ready={isReady ? "true" : "false"}
      data-has-placeholder="true"
      data-canvas-parked={shouldParkCanvas ? "true" : "false"}
      data-landing-scene-paint=""
      onPointerEnter={handlePointerEnter}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      aria-busy={shouldMount && !isReady}
    >
      <div
        className={styles.staticScene}
        data-img-loaded={isPlaceholderLoaded ? "true" : "false"}
        style={
          {
            backgroundImage: `url(${assets.placeholderImageUrl})`,
            "--still-dx": assets.placeholderFit.dx,
            "--still-dy": assets.placeholderFit.dy,
            "--still-sw": assets.placeholderFit.sw,
            "--still-sh": assets.placeholderFit.sh,
          } as CSSProperties
        }
        aria-hidden="true"
      />
      {canBootScene ? (
        <div className={styles.splineHost}>
          <canvas
            ref={canvasRef}
            className={styles.canvas}
            role="img"
            aria-label={label}
          />
        </div>
      ) : null}
    </div>
  );
}
