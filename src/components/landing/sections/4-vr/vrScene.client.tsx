"use client";

import type { Application } from "@splinetool/runtime";
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
import { registerVrSceneController } from "@/lib/landingVr/vrSceneController";
import { kickScroll } from "@/lib/scrollInteraction/scrollTrigger";
import { useImageReveal } from "@/lib/useImageReveal";
import styles from "./vr.module.css";

const VR_SCENE_URL = "/assets/landing-page/vr/am-arc-vr.scene.splinecode";
// Static still shown under the canvas until the live scene is ready, so fast
// scrollers never meet an empty stage. Same render as the mobile fallback.
const VR_PLACEHOLDER_IMAGE_URL = "/assets/landing-page/vr/vr-mobile.jpg";
const VR_OBJECT_ID = "57016588-a7c0-44e9-9475-e4cb308556ba";
const VR_VISOR_MATERIAL_ID = "f0e5e178-3fe3-459d-b01e-36dd811ce800";
const VR_SHADED_MESH_IDS = [
  "6dd7dfc3-b2d6-4a28-8d0b-700d80a5fae5",
  "1dc0559b-6ddd-42b8-85f6-0401381c24a5",
] as const;
const VR_SCENE_PREWARM_MARGIN = "90% 0px";
const VR_SCENE_ACTIVATE_MARGIN = "20% 0px";

type VrSceneClientProps = {
  sceneId: string;
  label: string;
};

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

const applyVisorMaterial = (app: InternalSplineApplication) => {
  if (!app._scene || !app._sharedAssetsManager) {
    return;
  }

  for (const meshId of VR_SHADED_MESH_IDS) {
    const mesh = app._scene.getObjectByProperty("uuid", meshId);

    if (!mesh) {
      continue;
    }

    mesh.updateByObjUpdateOp(
      { material: VR_VISOR_MATERIAL_ID },
      {
        scene: app._scene,
        shared: app._sharedAssetsManager,
      },
    );
  }

  app.requestRender();
};

export default function VrSceneClient({ sceneId, label }: VrSceneClientProps) {
  const sceneRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const runtimeAppRef = useRef<Application | null>(null);
  const objectRef = useRef<SplineMotionObject | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const renderBurstFrameRef = useRef<number | null>(null);
  const diagnosticTimeoutRef = useRef<number | null>(null);
  const baseTransformRef = useRef<TransformState | null>(null);
  const targetTransformRef = useRef<TransformState | null>(null);
  const pointerTransformRef = useRef<TransformState>(createZeroTransform());
  const pointerBoundsRef = useRef<PointerBounds | null>(null);
  const scrollRotationXRef = useRef(0);
  const isSceneActiveRef = useRef(false);
  const isRuntimePausedRef = useRef(false);
  const [isReady, setIsReady] = useState(false);
  const isPlaceholderLoaded = useImageReveal(VR_PLACEHOLDER_IMAGE_URL);

  const { isActive, shouldMount } = useSceneActivation({
    targetRef: sceneRef,
    activateMargin: VR_SCENE_ACTIVATE_MARGIN,
    prewarmMargin: VR_SCENE_PREWARM_MARGIN,
    preload: () => {
      void loadSplineRuntimeModule();
      void loadCachedArrayBufferAsset(VR_SCENE_URL, "VR scene");
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

    if (diagnosticTimeoutRef.current !== null) {
      window.clearTimeout(diagnosticTimeoutRef.current);
    }

    runtimeAppRef.current?.dispose();
    runtimeAppRef.current = null;
    objectRef.current = null;
    animationFrameRef.current = null;
    renderBurstFrameRef.current = null;
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

  // biome-ignore lint/correctness/useExhaustiveDependencies: useEffectEvent callbacks stay stable and should not retrigger the scene lifecycle.
  useEffect(() => {
    return registerVrSceneController(sceneId, {
      setScrollRotationX(rotationX) {
        scrollRotationXRef.current = rotationX;
        syncTargetTransform();
      },
    });
  }, [sceneId]);

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

  // biome-ignore lint/correctness/useExhaustiveDependencies: the resize observer should stay attached once and use the latest effect-event handlers.
  useEffect(() => {
    const sceneNode = sceneRef.current;

    if (!sceneNode) {
      return;
    }

    const resizeObserver = new ResizeObserver(() => {
      if (!isSceneActiveRef.current) {
        return;
      }

      updatePointerBounds();
      applyBackingStoreFromHost();
      runRenderBurst(LANDING_3D_RESIZE_RENDER_BURST_FRAMES);
      scheduleSceneDiagnostic("resize");
    });

    resizeObserver.observe(sceneNode);

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

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

      const [{ Application: RuntimeApplication }, sceneBuffer] =
        await Promise.all([
          loadSplineRuntimeModule(),
          loadCachedArrayBufferAsset(VR_SCENE_URL, "VR scene"),
        ]);

      if (isCancelled) {
        return;
      }

      const app = new RuntimeApplication(canvas, { renderMode: "manual" });
      runtimeAppRef.current = app;

      try {
        await app.start(sceneBuffer, { interactive: false });

        if (isCancelled) {
          return;
        }

        applyVisorMaterial(app as InternalSplineApplication);
        applyBackingStoreFromHost();

        const sceneObject = runtimeAppRef.current?.findObjectById(
          VR_OBJECT_ID,
        ) as SplineMotionObject | undefined;

        if (sceneObject) {
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
        }

        runRenderBurst(
          isSceneActiveRef.current
            ? LANDING_3D_INITIAL_RENDER_BURST_FRAMES
            : LANDING_3D_PREWARM_RENDER_BURST_FRAMES,
        );
        await requestSplineWarmRender(app);

        if (isCancelled || runtimeAppRef.current !== app) {
          return;
        }

        startTransition(() => {
          setIsReady(true);
        });

        if (!isSceneActiveRef.current) {
          pauseRuntime();
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.error(`Failed to load VR scene: ${message}`);
      }
    };

    void mountScene();

    return () => {
      isCancelled = true;
      clearSceneRuntime();
    };
  }, [canBootScene]);

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
        style={{ backgroundImage: `url(${VR_PLACEHOLDER_IMAGE_URL})` }}
        aria-hidden="true"
      />
      {canBootScene ? (
        <div className={styles.canvasShell}>
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
