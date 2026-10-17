import type { Application, SPEObject } from "@splinetool/runtime";

export const POINTER_POSITION_MULTIPLIER = 10;
export const POINTER_ROTATION_X_DIVISOR = 40;
export const POINTER_ROTATION_Y_DIVISOR = 67.5;
export const SCENE_ANIMATION_EASING = 0.16;
export const LANDING_3D_PREWARM_RENDER_BURST_FRAMES = 2;
export const LANDING_3D_INITIAL_RENDER_BURST_FRAMES = 6;
export const LANDING_3D_RESIZE_RENDER_BURST_FRAMES = 3;
export const LANDING_3D_BASE_TRANSFORM_CAPTURE_DELAY_MS = 501;
export const LANDING_3D_INACTIVITY_PAUSE_GRACE_MS = 900;
export const LANDING_3D_BACKING_STORE_SCALE = 0.56;
export const LANDING_3D_FULL_BACKING_STORE_SCALE = 1;
export const LANDING_3D_MAX_PIXEL_RATIO = 1;
// Tablet and mobile (viewports <= this width, in px) render a static image
// instead of the live 3D scene. Desktop (>= this width + 1) renders 3D.
export const LANDING_3D_IMAGE_FALLBACK_MAX_WIDTH = 1024;
const LANDING_3D_SCENE_REFERENCE_WIDTH = 1500;
const LANDING_3D_MODEL_SCALE = 0.8;
const SPLINE_WARM_RENDER_TIMEOUT_MS = 2000;

type InternalSplineRenderer = {
  setPixelRatio?: (value: number) => void;
};

type SplineApplicationWithResizeInternals = Application & {
  _renderer?: InternalSplineRenderer;
  _resize?: (force?: boolean) => void;
  _resizeObserver?: ResizeObserver | null;
  _resizeObserverTimeout?: number | null;
};

const disabledResizeObserverSentinel: ResizeObserver = {
  disconnect() {},
  observe() {},
  unobserve() {},
};

const arrayBufferAssetPromises = new Map<string, Promise<ArrayBuffer>>();

let splineRuntimeModulePromise: Promise<
  typeof import("@splinetool/runtime")
> | null = null;

export type TransformState = {
  position: {
    x: number;
    y: number;
  };
  rotation: {
    x: number;
    y: number;
  };
};

export type PointerBounds = {
  width: number;
  height: number;
  left: number;
  top: number;
};

export type SplineMotionObject = Pick<SPEObject, "position" | "rotation">;

export function getSplineViewportScale(viewportWidth: number): number {
  const viewportRatio = viewportWidth / LANDING_3D_SCENE_REFERENCE_WIDTH;

  return (viewportRatio + (1 - viewportRatio) / 2) * LANDING_3D_MODEL_SCALE;
}

export function applySplineViewportScale(
  canvas: HTMLCanvasElement | null,
): void {
  if (!canvas || typeof window === "undefined") {
    return;
  }

  canvas.style.transform = `scale(${getSplineViewportScale(window.innerWidth)})`;
}

function disableSplineAutoResize(runtimeApp: Application) {
  const internalApp = runtimeApp as SplineApplicationWithResizeInternals;

  if (internalApp._resizeObserverTimeout != null) {
    clearTimeout(internalApp._resizeObserverTimeout);
    internalApp._resizeObserverTimeout = null;
  }

  internalApp._resizeObserver?.disconnect();
  internalApp._resizeObserver = disabledResizeObserverSentinel;
}

export function applySplinePixelRatioLimit(runtimeApp: Application) {
  if (typeof window === "undefined") {
    return;
  }

  const renderer = (runtimeApp as SplineApplicationWithResizeInternals)
    ._renderer;

  if (!renderer?.setPixelRatio) {
    return;
  }

  const clampedRatio = Math.min(
    window.devicePixelRatio ?? 1,
    LANDING_3D_MAX_PIXEL_RATIO,
  );

  renderer.setPixelRatio(clampedRatio);
}

export function applySplineBackingStoreSize(
  runtimeApp: Application,
  host: HTMLElement,
  backingStoreScale = LANDING_3D_BACKING_STORE_SCALE,
) {
  if (typeof window === "undefined") {
    return;
  }

  const { width, height } = host.getBoundingClientRect();

  if (width <= 0 || height <= 0) {
    return;
  }

  applySplinePixelRatioLimit(runtimeApp);

  const targetWidth = Math.round(width * backingStoreScale);
  const targetHeight = Math.round(height * backingStoreScale);

  disableSplineAutoResize(runtimeApp);
  runtimeApp.setSize(targetWidth, targetHeight);

  const internalApp = runtimeApp as SplineApplicationWithResizeInternals;
  // Spline can retain the previous DPR backing store when the logical size is
  // unchanged, so force its renderer to rebuild the drawing buffer.
  internalApp._resize?.(true);
}

export function requestSplineWarmRender(runtimeApp: Application) {
  return new Promise<void>((resolve) => {
    const canvas = runtimeApp.canvas;
    let timeoutId: number | null = null;

    const finishWarmRender = () => {
      canvas.removeEventListener("rendered", finishWarmRender);

      if (timeoutId !== null) {
        window.clearTimeout(timeoutId);
      }

      resolve();
    };

    canvas.addEventListener("rendered", finishWarmRender, { once: true });
    timeoutId = window.setTimeout(
      finishWarmRender,
      SPLINE_WARM_RENDER_TIMEOUT_MS,
    );
    runtimeApp.requestRender();
  });
}

export const createZeroTransform = (): TransformState => ({
  position: { x: 0, y: 0 },
  rotation: { x: 0, y: 0 },
});

export const composeTargetTransform = (
  baseTransform: TransformState,
  pointerTransform: TransformState,
  scrollRotationX: number,
): TransformState => ({
  position: {
    x: baseTransform.position.x + pointerTransform.position.x,
    y: baseTransform.position.y + pointerTransform.position.y,
  },
  rotation: {
    x: baseTransform.rotation.x + scrollRotationX + pointerTransform.rotation.x,
    y: baseTransform.rotation.y + pointerTransform.rotation.y,
  },
});

export const createPointerTransform = (
  clientX: number,
  clientY: number,
  bounds: PointerBounds,
  positionMultiplier = POINTER_POSITION_MULTIPLIER,
  rotationXDivisor = POINTER_ROTATION_X_DIVISOR,
  rotationYDivisor = POINTER_ROTATION_Y_DIVISOR,
): TransformState => {
  const centerPosX = bounds.left + bounds.width / 2;
  const centerPosY = bounds.top + bounds.height / 2;
  const xOffset =
    ((clientX - centerPosX) / (bounds.width / 2)) * positionMultiplier;
  const yOffset =
    ((clientY - centerPosY) / (bounds.height / 2)) * positionMultiplier;

  return {
    position: {
      x: -xOffset,
      y: -yOffset,
    },
    rotation: {
      x: yOffset / rotationYDivisor,
      y: xOffset / rotationXDivisor,
    },
  };
};

export const readPointerBounds = (
  node: HTMLElement | null,
): PointerBounds | null => {
  if (!node) {
    return null;
  }

  const { width, height, left, top } = node.getBoundingClientRect();

  if (width <= 0 || height <= 0) {
    return null;
  }

  return { width, height, left, top };
};

export const loadSplineRuntimeModule = () => {
  splineRuntimeModulePromise ??= import("@splinetool/runtime");
  return splineRuntimeModulePromise;
};

export const loadCachedArrayBufferAsset = (
  assetUrl: string,
  assetLabel: string,
) => {
  const existingPromise = arrayBufferAssetPromises.get(assetUrl);

  if (existingPromise) {
    return existingPromise;
  }

  const nextPromise = fetch(assetUrl, { cache: "force-cache" })
    .then((response) => {
      if (!response.ok) {
        throw new Error(`Failed to fetch ${assetLabel}: ${response.status}`);
      }

      return response.arrayBuffer();
    })
    .catch((error) => {
      arrayBufferAssetPromises.delete(assetUrl);
      throw error;
    });

  arrayBufferAssetPromises.set(assetUrl, nextPromise);
  return nextPromise;
};
