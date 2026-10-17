"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { createDOMCache } from "@/lib/scrollInteraction/createDOMCache";
import { createInstanceRegistry } from "@/lib/scrollInteraction/createInstanceRegistry";
import {
  createRAFBatch,
  createStateTracker,
  getScrollTrigger,
  kickScroll,
} from "@/lib/scrollInteraction/scrollTrigger";
import { dimensionsStore } from "@/store/dimensionsStore";
import {
  ECHO_VIEW_CANVAS_SELECTOR,
  ECHO_VIEW_CARD_SELECTOR,
  ECHO_VIEW_SCALE_WRAP_SELECTOR,
  getEchoViewRootSelector,
  type ResolvedEchoViewData,
} from "./echoView.shared";

const activeInstances = createInstanceRegistry();
const domCache = createDOMCache();
const rafBatch = createRAFBatch();
const stateTracker = createStateTracker();
const FRAME_BLEND_MAX_PROGRESS_PER_SECOND = 10;
const FRAME_SETTLE_DELAY_MS = 90;

type EchoViewDomRefs = {
  root: HTMLElement;
  scaleWrap: HTMLElement;
  card: HTMLElement;
  canvas: HTMLCanvasElement;
  context: CanvasRenderingContext2D;
};

type EchoViewAnimationSession = {
  clearFrameSettleTimeout: () => void;
  drawKey: string;
  frameInstanceKey: string;
  scaleInstanceKey: string;
  scaleKey: string;
};

type FrameRenderState = {
  currentIndex: number;
  nextIndex: number;
  mix: number;
  signature: string;
  usesBlend: boolean;
};

type EchoViewAnimationData = Pick<
  ResolvedEchoViewData,
  | "endPoint"
  | "frameHeight"
  | "frameSources"
  | "frameWidth"
  | "id"
  | "scaleEndPoint"
  | "scaleFrom"
  | "scaleStartPoint"
  | "scaleTo"
  | "startPoint"
>;

const cachedFrames = new Map<string, HTMLImageElement[]>();
const cachedDomRefs = new Map<string, EchoViewDomRefs>();
const animationSessions = new Map<string, number>();
const initializingEchoViews = new Set<string>();

function getDomCacheKey(instanceId: string, key: string): string {
  return `echo-view-${instanceId}-${key}`;
}

function getFrameCacheKey(frameSources: readonly string[]): string {
  return frameSources.join("|");
}

function ensureFrames(frameSources: readonly string[]): HTMLImageElement[] {
  if (typeof window === "undefined") {
    return [];
  }

  const cacheKey = getFrameCacheKey(frameSources);
  const existingFrames = cachedFrames.get(cacheKey);

  if (existingFrames) {
    return existingFrames;
  }

  const frames = frameSources.map((src) => {
    const image = new window.Image();
    image.decoding = "async";
    image.src = src;
    return image;
  });

  cachedFrames.set(cacheKey, frames);
  return frames;
}

function clampFrameProgress(value: number, frameRange: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.max(0, Math.min(frameRange, value));
}

function isFrameReady(frame?: HTMLImageElement): frame is HTMLImageElement {
  return Boolean(frame?.complete && frame.naturalWidth > 0);
}

function resolveFrameRenderState(
  frameProgress: number,
  frameRange: number,
  shouldBlend: boolean,
): FrameRenderState {
  const clampedProgress = clampFrameProgress(frameProgress, frameRange);
  const snappedIndex = Math.round(clampedProgress);

  if (!shouldBlend) {
    return {
      currentIndex: snappedIndex,
      nextIndex: snappedIndex,
      mix: 0,
      signature: `snap:${snappedIndex}`,
      usesBlend: false,
    };
  }

  const currentIndex = Math.floor(clampedProgress);
  const nextIndex = Math.min(frameRange, currentIndex + 1);
  const mix = clampedProgress - currentIndex;

  if (mix < 0.001 || nextIndex === currentIndex) {
    return {
      currentIndex,
      nextIndex: currentIndex,
      mix: 0,
      signature: `snap:${currentIndex}`,
      usesBlend: false,
    };
  }

  return {
    currentIndex,
    nextIndex,
    mix,
    signature: `blend:${currentIndex}:${nextIndex}:${mix.toFixed(3)}`,
    usesBlend: true,
  };
}

function getAnimationSessionToken(instanceId: string): number {
  return animationSessions.get(instanceId) ?? 0;
}

function bumpAnimationSession(instanceId: string): number {
  const nextSession = getAnimationSessionToken(instanceId) + 1;
  animationSessions.set(instanceId, nextSession);
  return nextSession;
}

function getCachedDomRefs(instanceId: string): EchoViewDomRefs | null {
  const cached = cachedDomRefs.get(instanceId);

  if (
    cached &&
    document.contains(cached.root) &&
    document.contains(cached.scaleWrap) &&
    document.contains(cached.card) &&
    document.contains(cached.canvas)
  ) {
    return cached;
  }

  const root = domCache.get<HTMLElement>(
    getDomCacheKey(instanceId, "root"),
    getEchoViewRootSelector(instanceId),
  );

  if (!root) {
    return null;
  }

  const scaleWrap = domCache.get<HTMLElement>(
    getDomCacheKey(instanceId, "scale-wrap"),
    ECHO_VIEW_SCALE_WRAP_SELECTOR,
    root,
  );
  const card = domCache.get<HTMLElement>(
    getDomCacheKey(instanceId, "card"),
    ECHO_VIEW_CARD_SELECTOR,
    root,
  );
  const canvas = domCache.get<HTMLCanvasElement>(
    getDomCacheKey(instanceId, "canvas"),
    ECHO_VIEW_CANVAS_SELECTOR,
    root,
  );

  if (!scaleWrap || !card || !canvas) {
    return null;
  }

  const context = canvas.getContext("2d");

  if (!context) {
    return null;
  }

  const refs = {
    root,
    scaleWrap,
    card,
    canvas,
    context,
  };

  cachedDomRefs.set(instanceId, refs);
  return refs;
}

function clearCachedDomRefs(instanceId: string) {
  cachedDomRefs.delete(instanceId);
  domCache.clear();
}

function drawFrame(
  canvas: HTMLCanvasElement,
  context: CanvasRenderingContext2D,
  frames: HTMLImageElement[],
  frameRenderState: FrameRenderState,
  frameWidth: number,
  frameHeight: number,
): void {
  const { currentIndex, mix, nextIndex, signature, usesBlend } =
    frameRenderState;
  const currentFrame = frames[currentIndex];
  const nextFrame = frames[nextIndex];

  if (!stateTracker.trackAttribute(canvas, "data-frame-progress", signature)) {
    return;
  }

  context.clearRect(0, 0, frameWidth, frameHeight);

  if (isFrameReady(currentFrame)) {
    context.globalAlpha = 1;
    context.drawImage(currentFrame, 0, 0, frameWidth, frameHeight);
  }

  if (usesBlend && isFrameReady(nextFrame)) {
    if (!isFrameReady(currentFrame)) {
      context.globalAlpha = 1;
    } else {
      context.globalAlpha = mix;
    }

    context.drawImage(nextFrame, 0, 0, frameWidth, frameHeight);
  }

  if (!isFrameReady(currentFrame) && !isFrameReady(nextFrame)) {
    context.globalAlpha = 1;
    return;
  }

  context.globalAlpha = 1;
}

function buildScaleTransform(scaleValue: number): string {
  return `scale(${scaleValue.toFixed(3)})`;
}

function initEchoViewAnimations(
  pathname: string,
  vw: number,
  data: EchoViewAnimationData,
): EchoViewAnimationSession | null {
  if (typeof window === "undefined" || initializingEchoViews.has(data.id)) {
    return null;
  }

  const refs = getCachedDomRefs(data.id);

  if (!refs) {
    return null;
  }
  const { card, canvas, context, scaleWrap } = refs;
  const frameRange = Math.max(0, data.frameSources.length - 1);
  const frames = ensureFrames(data.frameSources);
  const pendingLoads = new Set<number>();
  const frameInstanceKey = `echo-view-sequence-${pathname}-${data.id}-${vw}`;
  const scaleInstanceKey = `echo-view-scale-${pathname}-${data.id}-${vw}`;
  const drawKey = `${frameInstanceKey}-draw`;
  const scaleKey = `${scaleInstanceKey}-style`;

  initializingEchoViews.add(data.id);

  try {
    const trigger = getScrollTrigger();
    const sessionToken = bumpAnimationSession(data.id);
    let requestedFrameProgress = 0;
    let requestedShouldBlend = false;
    let requestedFrameRenderState = resolveFrameRenderState(
      0,
      frameRange,
      false,
    );
    let frameSettleTimeoutId: number | null = null;
    let lastFrameProgressSample = 0;
    let lastFrameProgressSampleTime = 0;

    canvas.width = data.frameWidth;
    canvas.height = data.frameHeight;
    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = "high";
    stateTracker.trackAttribute(canvas, "data-frame-progress", "-1");
    lastFrameProgressSampleTime = window.performance.now();

    const clearFrameSettleTimeout = () => {
      if (frameSettleTimeoutId === null) {
        return;
      }

      window.clearTimeout(frameSettleTimeoutId);
      frameSettleTimeoutId = null;
    };

    const scheduleFrameDraw = (frameProgress: number, shouldBlend: boolean) => {
      requestedFrameProgress = clampFrameProgress(frameProgress, frameRange);
      requestedShouldBlend = shouldBlend;
      requestedFrameRenderState = resolveFrameRenderState(
        requestedFrameProgress,
        frameRange,
        shouldBlend,
      );
      rafBatch.schedule(drawKey, () => {
        if (sessionToken !== getAnimationSessionToken(data.id)) {
          return;
        }

        drawFrame(
          canvas,
          context,
          frames,
          requestedFrameRenderState,
          data.frameWidth,
          data.frameHeight,
        );
      });
    };

    const shouldBlendFrameProgress = (frameProgress: number): boolean => {
      const now = window.performance.now();
      const clampedProgress = clampFrameProgress(frameProgress, frameRange);

      if (lastFrameProgressSampleTime === 0) {
        lastFrameProgressSample = clampedProgress;
        lastFrameProgressSampleTime = now;
        return true;
      }

      const deltaTime = Math.max(now - lastFrameProgressSampleTime, 1);
      const deltaProgress = Math.abs(clampedProgress - lastFrameProgressSample);
      const progressPerSecond = (deltaProgress / deltaTime) * 1000;

      lastFrameProgressSample = clampedProgress;
      lastFrameProgressSampleTime = now;

      return progressPerSecond <= FRAME_BLEND_MAX_PROGRESS_PER_SECOND;
    };

    const scheduleFrameSettle = (frameProgress: number) => {
      const clampedProgress = clampFrameProgress(frameProgress, frameRange);
      const settledFrameProgress = Math.round(clampedProgress);

      clearFrameSettleTimeout();

      if (Math.abs(clampedProgress - settledFrameProgress) < 0.001) {
        return;
      }

      frameSettleTimeoutId = window.setTimeout(() => {
        frameSettleTimeoutId = null;

        if (sessionToken !== getAnimationSessionToken(data.id)) {
          return;
        }

        scheduleFrameDraw(settledFrameProgress, false);
      }, FRAME_SETTLE_DELAY_MS);
    };

    const scheduleScaleUpdate = (scaleValue: number) => {
      rafBatch.schedule(scaleKey, () => {
        stateTracker.trackStyle(
          scaleWrap,
          "transform",
          buildScaleTransform(scaleValue),
        );
      });
    };

    frames.forEach((frame, index) => {
      if (frame.complete && frame.naturalWidth > 0) {
        return;
      }

      if (pendingLoads.has(index)) {
        return;
      }

      pendingLoads.add(index);

      frame.addEventListener(
        "load",
        () => {
          pendingLoads.delete(index);

          if (sessionToken !== getAnimationSessionToken(data.id)) {
            return;
          }

          if (
            index === requestedFrameRenderState.currentIndex ||
            (requestedFrameRenderState.usesBlend &&
              index === requestedFrameRenderState.nextIndex)
          ) {
            scheduleFrameDraw(requestedFrameProgress, requestedShouldBlend);
          }
        },
        { once: true },
      );

      frame.addEventListener(
        "error",
        () => {
          pendingLoads.delete(index);
        },
        { once: true },
      );
    });

    scheduleFrameDraw(0, false);

    const instance = trigger?.createInstance(frameInstanceKey, card, {
      values: [[0, frameRange]],
      startPoint: [...data.startPoint],
      endPoint: [...data.endPoint],
      callback: ({ v }) => {
        const shouldBlend = shouldBlendFrameProgress(v[0]);
        scheduleFrameDraw(v[0], shouldBlend);

        if (shouldBlend) {
          scheduleFrameSettle(v[0]);
        } else {
          clearFrameSettleTimeout();
        }
      },
    });

    const scaleInstance = trigger?.createInstance(scaleInstanceKey, scaleWrap, {
      values: [[data.scaleFrom, data.scaleTo]],
      startPoint: [...data.scaleStartPoint],
      endPoint: [...data.scaleEndPoint],
      callback: ({ v }) => {
        scheduleScaleUpdate(v[0]);
      },
    });

    if (instance) {
      activeInstances.add(frameInstanceKey, instance);
    }

    if (scaleInstance) {
      activeInstances.add(scaleInstanceKey, scaleInstance);
    }

    kickScroll();
    return {
      clearFrameSettleTimeout,
      drawKey,
      frameInstanceKey,
      scaleInstanceKey,
      scaleKey,
    };
  } finally {
    initializingEchoViews.delete(data.id);
  }
}

function cleanupEchoViewAnimations(
  instanceId: string,
  session: EchoViewAnimationSession | null,
): void {
  if (typeof window === "undefined") {
    return;
  }

  bumpAnimationSession(instanceId);

  if (session?.drawKey) {
    rafBatch.cancel(session.drawKey);
  }

  session?.clearFrameSettleTimeout();

  if (session?.scaleKey) {
    rafBatch.cancel(session.scaleKey);
  }

  const trigger = getScrollTrigger();
  const refs = getCachedDomRefs(instanceId);
  const scaleWrap = refs?.scaleWrap ?? null;
  const canvas = refs?.canvas ?? null;
  const context = refs?.context ?? null;

  if (session?.frameInstanceKey) {
    activeInstances.remove(session.frameInstanceKey);

    try {
      trigger?.removeInstance(session.frameInstanceKey);
    } catch (_) {
      // no-op
    }
  }

  if (session?.scaleInstanceKey) {
    activeInstances.remove(session.scaleInstanceKey);

    try {
      trigger?.removeInstance(session.scaleInstanceKey);
    } catch (_) {
      // no-op
    }
  }

  if (canvas && context) {
    context.clearRect(0, 0, canvas.width, canvas.height);
    canvas.removeAttribute("data-frame-progress");
  }

  if (scaleWrap) {
    scaleWrap.style.removeProperty("transform");
  }

  clearCachedDomRefs(instanceId);
}

type EchoViewAnimateProps = {
  data: ResolvedEchoViewData;
};

export default function EchoViewAnimate({ data }: EchoViewAnimateProps) {
  const pathname = usePathname() ?? "";
  const { vw } = dimensionsStore();
  const {
    endPoint,
    frameHeight,
    frameSources,
    frameWidth,
    id,
    scaleEndPoint,
    scaleFrom,
    scaleStartPoint,
    scaleTo,
    startPoint,
  } = data;

  useEffect(() => {
    if (!vw) {
      return;
    }

    cleanupEchoViewAnimations(id, null);
    const session = initEchoViewAnimations(pathname, vw, {
      id,
      frameSources,
      frameWidth,
      frameHeight,
      startPoint,
      endPoint,
      scaleFrom,
      scaleTo,
      scaleStartPoint,
      scaleEndPoint,
    });

    return () => {
      cleanupEchoViewAnimations(id, session);
    };
  }, [
    endPoint,
    frameHeight,
    frameSources,
    frameWidth,
    id,
    pathname,
    scaleEndPoint,
    scaleFrom,
    scaleStartPoint,
    scaleTo,
    startPoint,
    vw,
  ]);

  return null;
}
