"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { PORTFOLIO_VIDEO_SOURCES } from "@/config/media";
import { createDOMCache } from "@/lib/scrollInteraction/createDOMCache";
import { createBatchStyleSetter } from "@/lib/scrollInteraction/createSmartStyleSetter";
import scrollManager from "@/lib/scrollInteraction/scrollManager";
import {
  createRAFBatch,
  kickScroll,
} from "@/lib/scrollInteraction/scrollTrigger";
import { dimensionsStore } from "@/store/dimensionsStore";

import type { MediaMotionLabels } from "./media.types";

const MEDIA_ROOT_SELECTOR = "[data-media-root]";
const MEDIA_CONTAINER_SELECTOR = "[data-media-container]";
const MEDIA_TEXT_SELECTOR = "[data-media-text]";
const MEDIA_BUTTON_SELECTOR = "[data-media-button]";
const MEDIA_PLAYER_SELECTOR = "[data-media-player]";
const MEDIA_ITEM_SELECTOR = "[data-media-item]";
const MEDIA_FULLSCREEN_PROXY_SELECTOR = "[data-media-fullscreen-proxy]";
const MEDIA_DESKTOP_BREAKPOINT = 1024;
const MEDIA_DRAG_CLICK_THRESHOLD = 6;
const MEDIA_WHEEL_LINE_HEIGHT = 16;
const MEDIA_SCROLL_ROTATION_RANGE = [0, 40] as const;
const MEDIA_TEXT_X_RANGE = [0, 20] as const;
const MEDIA_SCROLL_THROTTLE_MS = 1000 / 60;
const MEDIA_INTERACTION_IDLE_MS = 120;
const MEDIA_RESPONSIVE_SCROLL_TRAVEL = 1.8;
const MEDIA_RESPONSIVE_SCROLL_IDLE_MS = 150;
const MEDIA_RESPONSIVE_SNAP_DELAY_MS = 170;
const MEDIA_RESPONSIVE_SNAP_STRENGTH = 0.12;
const MEDIA_RESPONSIVE_SETTLE_EPSILON = 0.0015;
const MEDIA_RESPONSIVE_LAYER_FADE_MS = 140;

const domCache = createDOMCache();
const styleSetter = createBatchStyleSetter();
const rafBatch = createRAFBatch();

type MediaDomRefs = {
  buttons: HTMLButtonElement[];
  container: HTMLElement;
  items: HTMLElement[];
  root: HTMLElement;
  text: HTMLElement;
};

type MediaAnimationSession = {
  cleanupFns: Array<() => void>;
  rafKeys: string[];
  scrollIds: string[];
};

type MediaScrollMetrics = {
  end: number;
  start: number;
};

type FullscreenVideo = HTMLVideoElement & {
  webkitEnterFullscreen?: () => void;
  webkitRequestFullscreen?: () => Promise<void> | void;
};

let cachedDomRefs: MediaDomRefs | null = null;

function getCachedDomRefs(): MediaDomRefs | null {
  if (
    cachedDomRefs &&
    document.contains(cachedDomRefs.root) &&
    document.contains(cachedDomRefs.container) &&
    document.contains(cachedDomRefs.text)
  ) {
    return cachedDomRefs;
  }

  const root = domCache.get<HTMLElement>("media-root", MEDIA_ROOT_SELECTOR);

  if (!root) {
    return null;
  }

  const container = domCache.get<HTMLElement>(
    "media-container",
    MEDIA_CONTAINER_SELECTOR,
    root,
  );
  const text = domCache.get<HTMLElement>(
    "media-text",
    MEDIA_TEXT_SELECTOR,
    root,
  );

  if (!container || !text) {
    return null;
  }

  cachedDomRefs = {
    buttons: Array.from(root.querySelectorAll(MEDIA_BUTTON_SELECTOR)),
    container,
    items: Array.from(root.querySelectorAll(MEDIA_ITEM_SELECTOR)),
    root,
    text,
  };

  return cachedDomRefs;
}

function clearCachedDomRefs() {
  cachedDomRefs = null;
  domCache.clear();
}

function formatNumber(value: number): string {
  return Number(value.toFixed(3)).toString();
}

function clamp01(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.max(0, Math.min(1, value));
}

function clamp(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) {
    return min;
  }

  return Math.max(min, Math.min(max, value));
}

function lerp(from: number, to: number, progress: number): number {
  return from + (to - from) * progress;
}

function wrapSigned(value: number, range: number): number {
  if (range <= 0) {
    return value;
  }

  const halfRange = range / 2;

  return ((((value + halfRange) % range) + range) % range) - halfRange;
}

function getLinearProgress(edge0: number, edge1: number, value: number) {
  if (edge0 === edge1) {
    return value >= edge1 ? 1 : 0;
  }

  return clamp((value - edge0) / (edge1 - edge0), 0, 1);
}

function getPosterRotationProgress(
  distance: number,
  centerReadBand: number,
  sideTransitionBand: number,
  visibleRange: number,
) {
  const baseRotationProgress = getLinearProgress(
    centerReadBand,
    centerReadBand + sideTransitionBand,
    distance,
  );
  const outerFacingRelease = getLinearProgress(
    Math.max(centerReadBand + sideTransitionBand * 0.7, visibleRange - 0.92),
    visibleRange,
    distance,
  );

  return baseRotationProgress * lerp(1, 0.28, outerFacingRelease);
}

function measureSectionRange(root: HTMLElement): MediaScrollMetrics {
  const rect = root.getBoundingClientRect();
  const absoluteTop = rect.top + window.scrollY;

  return {
    end: absoluteTop + root.clientHeight,
    start: absoluteTop - window.innerHeight,
  };
}

function resolveSectionProgress(metrics: MediaScrollMetrics): number {
  const { end, start } = metrics;

  if (end <= start) {
    return window.scrollY >= end ? 1 : 0;
  }

  return clamp01((window.scrollY - start) / (end - start));
}

function resetLoadedVideos(root: HTMLElement) {
  root.querySelectorAll<HTMLElement>(MEDIA_ITEM_SELECTOR).forEach((item) => {
    const player = item.querySelector<HTMLElement>(MEDIA_PLAYER_SELECTOR);
    if (!(player instanceof HTMLVideoElement)) return;
    player.pause();
    player.removeAttribute("src");
    player.load();
    const mount = document.createElement("div");
    mount.id = player.id;
    mount.className = player.className;
    mount.dataset.mediaPlayer = "";
    item.removeAttribute("data-media-loaded");
    player.replaceWith(mount);
  });
  root
    .querySelectorAll<HTMLButtonElement>(MEDIA_BUTTON_SELECTOR)
    .forEach((button) => {
      button.style.display = "";
    });
}

function swapCardToVideo(
  button: HTMLButtonElement,
  item: HTMLElement,
  player: HTMLElement,
  videoId: string,
  title: string,
  labels: MediaMotionLabels,
): void {
  const src = PORTFOLIO_VIDEO_SOURCES[videoId];
  if (!src || player.dataset.mediaLoaded === "true") return;
  const video = document.createElement("video");
  video.id = player.id || item.dataset.playerId || "";
  video.className = player.className;
  video.src = src;
  video.controls = true;
  video.playsInline = true;
  video.preload = "metadata";
  video.setAttribute("aria-label", title);
  const captions = document.createElement("track");
  captions.kind = "captions";
  captions.src = ["34hD4u8WFuI", "xgWT3ZnPa40"].includes(videoId)
    ? labels.musicCaptionSource
    : "/assets/video/portfolio/silent.vtt";
  captions.srclang = labels.captionLocale;
  captions.label = labels.captionLanguage;
  video.append(captions);
  video.dataset.mediaPlayer = "";
  video.dataset.mediaLoaded = "true";
  item.dataset.mediaLoaded = "true";
  button.style.display = "none";
  player.replaceWith(video);
  void video.play().catch(() => {});
}

function isMediaPlayerLoaded(player: HTMLElement): boolean {
  return player instanceof HTMLVideoElement;
}

function openVideoFullscreen(video: FullscreenVideo): void {
  if (video.requestFullscreen) {
    void video.requestFullscreen().catch(() => {});
  } else if (video.webkitEnterFullscreen) {
    video.webkitEnterFullscreen();
  } else if (video.webkitRequestFullscreen) {
    void Promise.resolve(video.webkitRequestFullscreen()).catch(() => {});
  }
}

function cleanupMediaAnimations(session: MediaAnimationSession | null) {
  const refs = getCachedDomRefs();

  session?.cleanupFns.forEach((cleanup) => {
    cleanup();
  });

  session?.rafKeys.forEach((key) => {
    rafBatch.cancel(key);
  });

  session?.scrollIds.forEach((id) => {
    scrollManager.removeInstance(id);
  });

  if (refs) {
    delete refs.root.dataset.mediaMotion;
    styleSetter.set(refs.container, "transform", "");
    styleSetter.set(refs.text, "transform", "");
  }

  clearCachedDomRefs();
}

function initMediaAnimations(
  pathname: string,
  vw: number,
  labels: MediaMotionLabels,
): MediaAnimationSession | null {
  if (typeof window === "undefined") {
    return null;
  }

  const refs = getCachedDomRefs();

  if (!refs) {
    return null;
  }

  const inlineDirection = document.documentElement.dir === "rtl" ? -1 : 1;
  const isDesktop = vw > MEDIA_DESKTOP_BREAKPOINT;
  const isResponsiveDeck = !isDesktop;
  const rafKeys: string[] = [];
  const scrollIds: string[] = [];
  const cleanupFns: Array<() => void> = [];
  let sectionMetrics = measureSectionRange(refs.root);
  let scrollRotation = 0;
  let dragRotation = 0;
  let deckFrameId: number | null = null;
  let deckFrontIndex: number | null = null;
  let deckLayerIsAnimating = false;
  let lastDeckLayerTime = performance.now();
  const deckLayerOpacities = refs.items.map(() => 1);
  const deckBasePosition = refs.items.length * 0.5;
  let deckScrollPosition = deckBasePosition;
  let deckInteractionOffset = 0;
  let deckCurrent = deckBasePosition;
  let deckTarget = deckCurrent;
  let lastResponsiveScrollTime = performance.now();
  let lastResponsiveInteractionTime = lastResponsiveScrollTime;
  let interactionIdleTimer: number | null = null;
  let isDragging = false;
  let didDrag = false;
  let pendingClickButton: HTMLButtonElement | null = null;
  let suppressClick = false;
  let startClientX = 0;
  let lastClientX = 0;

  const setMotionMode = (mode: "direct" | "smooth") => {
    refs.root.dataset.mediaMotion = mode;
  };

  const clearInteractionIdleTimer = () => {
    if (interactionIdleTimer === null) {
      return;
    }

    window.clearTimeout(interactionIdleTimer);
    interactionIdleTimer = null;
  };

  const setDirectMotion = () => {
    clearInteractionIdleTimer();
    setMotionMode("direct");
  };

  const scheduleSmoothMotion = () => {
    clearInteractionIdleTimer();

    interactionIdleTimer = window.setTimeout(() => {
      interactionIdleTimer = null;
      setMotionMode("smooth");
    }, MEDIA_INTERACTION_IDLE_MS);
  };

  cleanupFns.push(() => {
    clearInteractionIdleTimer();
    delete refs.root.dataset.mediaMotion;
  });

  const applyTransforms = () => {
    styleSetter.set(
      refs.container,
      "transform",
      `rotateY(${formatNumber(scrollRotation * inlineDirection + dragRotation)}deg)`,
    );
  };

  const applyInteractionDelta = (deltaX: number) => {
    dragRotation -= deltaX;

    rafBatch.schedule("media-interaction-frame", () => {
      applyTransforms();
    });
  };

  const applyTextTransform = (xPercent: number) => {
    styleSetter.set(
      refs.text,
      "transform",
      `translate3d(${formatNumber(xPercent * inlineDirection)}%, 0, 0)`,
    );
  };

  const applyResponsiveDeckTransforms = (
    position: number,
    timestamp = performance.now(),
  ) => {
    const itemCount = refs.items.length;

    if (itemCount === 0) {
      return;
    }

    const width = refs.root.clientWidth || window.innerWidth;
    const visibleRange = width < 600 ? 1.95 : 2.25;
    const centerReadBand = width < 600 ? 0.16 : 0.2;
    const sideTransitionBand = width < 600 ? 1.02 : 1.18;
    const backDepth = width < 600 ? 136 : 160;
    const frontDepth = width < 600 ? 36 : 46;
    const maxRotateY = width < 600 ? 18 : 22;
    const viewportPerspective = width < 600 ? width * 5.3398 : width * 2.8646;
    const sampleItem = refs.items.find((item) => item.offsetWidth > 0);
    const cardBaseWidth =
      sampleItem?.offsetWidth ??
      (width < 600
        ? Math.min(14.5 * 16, width * 0.57)
        : clamp(width * 0.25, 15.25 * 16, 18.25 * 16));
    const spreadSideCount = Math.max(1, Math.floor(visibleRange));
    const edgePadding = width < 600 ? 4 : 8;
    const outerCardDistance = spreadSideCount;
    const outerDepthProgress = getLinearProgress(
      0,
      visibleRange,
      outerCardDistance,
    );
    const outerRotationProgress = getPosterRotationProgress(
      outerCardDistance,
      centerReadBand,
      sideTransitionBand,
      visibleRange,
    );
    const outerZ = lerp(frontDepth, -backDepth, outerDepthProgress);
    const outerPerspectiveCompensation =
      (viewportPerspective - outerZ) / viewportPerspective;
    const outerFocusProgress =
      1 - getLinearProgress(0.08, 0.92, outerCardDistance);
    const outerBaseScale =
      outerPerspectiveCompensation * lerp(1.018, 0.944, outerDepthProgress);
    const outerScale = outerBaseScale * lerp(1, 1.016, outerFocusProgress);
    const outerRotateY = lerp(0, maxRotateY, outerRotationProgress);
    const outerProjectedWidth = Math.max(
      cardBaseWidth * 0.82,
      cardBaseWidth *
        outerScale *
        Math.abs(Math.cos((outerRotateY * Math.PI) / 180)),
    );
    const usableTrackWidth = Math.max(
      width - edgePadding * 2,
      outerProjectedWidth,
    );
    const cardSpacing =
      spreadSideCount > 0
        ? (usableTrackWidth - outerProjectedWidth) / (spreadSideCount * 2)
        : 0;

    const nextFrontIndex =
      ((Math.round(position) % itemCount) + itemCount) % itemCount;
    deckFrontIndex ??= nextFrontIndex;
    const fadeStep =
      Math.min(Math.max(0, timestamp - lastDeckLayerTime), 1000 / 30) /
      MEDIA_RESPONSIVE_LAYER_FADE_MS;
    lastDeckLayerTime = timestamp;

    // Keep the outgoing card above the stack until it is transparent. Changing
    // z-index then cannot expose a hard seam; restore its opacity underneath.
    deckLayerOpacities.forEach((opacity, index) => {
      const fadingOut =
        index === deckFrontIndex && nextFrontIndex !== deckFrontIndex;
      deckLayerOpacities[index] = clamp(
        opacity + (fadingOut ? -fadeStep : fadeStep),
        0,
        1,
      );
    });
    if (deckLayerOpacities[deckFrontIndex] === 0) {
      deckFrontIndex = nextFrontIndex;
    }
    deckLayerIsAnimating =
      nextFrontIndex !== deckFrontIndex ||
      deckLayerOpacities.some((opacity) => opacity < 1);

    refs.items.forEach((item, index) => {
      const relative = wrapSigned(index - position, itemCount);
      const absRelative = Math.abs(relative);
      const rotationProgress = getPosterRotationProgress(
        absRelative,
        centerReadBand,
        sideTransitionBand,
        visibleRange,
      );
      const signedDirection = (Math.sign(relative) || 1) * inlineDirection;
      const x = relative * cardSpacing * inlineDirection;
      const depthProgress = getLinearProgress(0, visibleRange, absRelative);
      const z = lerp(frontDepth, -backDepth, depthProgress);
      const perspectiveCompensation =
        (viewportPerspective - z) / viewportPerspective;
      const focusProgress = 1 - getLinearProgress(0.08, 0.92, absRelative);
      const baseScale =
        perspectiveCompensation * lerp(1.018, 0.944, depthProgress);
      const scale = baseScale * lerp(1, 1.016, focusProgress);
      const rotateX = lerp(0, -0.6, depthProgress);
      const rotateY = signedDirection * lerp(0, maxRotateY, rotationProgress);
      const opacity = clamp(
        1 -
          getLinearProgress(
            visibleRange - 0.16,
            visibleRange + 0.32,
            absRelative,
          ),
        0,
        1,
      );
      const layerOpacity = deckLayerOpacities[index];
      const layerFade = layerOpacity ** 2 * (3 - 2 * layerOpacity);
      const zIndex =
        index === deckFrontIndex
          ? Math.ceil((frontDepth + backDepth) * 10) + 1
          : Math.round((z + backDepth) * 10);
      const isFocused = focusProgress > 0.96;

      styleSetter.setMultiple(item, {
        opacity: formatNumber(opacity * layerFade),
        pointerEvents: opacity * layerFade > 0.24 ? "auto" : "none",
        // The original deck has two nested perspectives. Applying their combined
        // projection per card preserves its geometry in a flat stacking context.
        transform: `perspective(${formatNumber(viewportPerspective * 0.5)}px) translate3d(${formatNumber(x)}px, 0, ${formatNumber(z)}px) rotateX(${formatNumber(rotateX)}deg) rotateY(${formatNumber(rotateY)}deg) rotateZ(0deg) scale(${formatNumber(scale)})`,
        visibility: opacity < 0.025 ? "hidden" : "visible",
        zIndex: String(zIndex),
      });

      const focusedValue = isFocused ? "true" : "false";

      if (item.dataset.focused !== focusedValue) {
        item.dataset.focused = focusedValue;
      }
    });
  };

  function updateResponsiveDeckTarget() {
    deckTarget = deckScrollPosition + deckInteractionOffset;
  }

  function scheduleResponsiveDeckFrame() {
    if (deckFrameId !== null) {
      return;
    }

    deckFrameId = window.requestAnimationFrame(updateResponsiveDeckFrame);
  }

  function updateResponsiveDeckFrame(timestamp: number) {
    deckFrameId = null;

    const scrollIsIdle =
      timestamp - lastResponsiveScrollTime > MEDIA_RESPONSIVE_SCROLL_IDLE_MS;
    const interactionIsIdle =
      timestamp - lastResponsiveInteractionTime >
      MEDIA_RESPONSIVE_SNAP_DELAY_MS;
    const snapEligible =
      !isDragging &&
      scrollIsIdle &&
      interactionIsIdle &&
      Math.abs(deckTarget - deckCurrent) < 0.2;

    if (snapEligible) {
      const snappedOffset = Math.round(deckTarget) - deckScrollPosition;
      const nextOffset = lerp(
        deckInteractionOffset,
        snappedOffset,
        MEDIA_RESPONSIVE_SNAP_STRENGTH,
      );
      deckInteractionOffset =
        Math.abs(nextOffset - snappedOffset) < MEDIA_RESPONSIVE_SETTLE_EPSILON
          ? snappedOffset
          : nextOffset;
      updateResponsiveDeckTarget();
    }

    const followStrength = isDragging ? 0.24 : scrollIsIdle ? 0.12 : 0.28;
    const nextCurrent = lerp(deckCurrent, deckTarget, followStrength);

    deckCurrent =
      Math.abs(nextCurrent - deckTarget) < MEDIA_RESPONSIVE_SETTLE_EPSILON
        ? deckTarget
        : nextCurrent;

    applyResponsiveDeckTransforms(deckCurrent, timestamp);

    if (
      isDragging ||
      deckLayerIsAnimating ||
      !scrollIsIdle ||
      !interactionIsIdle ||
      deckCurrent !== deckTarget ||
      Math.abs(Math.round(deckTarget) - deckTarget) >
        MEDIA_RESPONSIVE_SETTLE_EPSILON
    ) {
      scheduleResponsiveDeckFrame();
    }
  }

  const clearResponsiveDeckTransforms = () => {
    refs.items.forEach((item) => {
      styleSetter.setMultiple(item, {
        opacity: "",
        pointerEvents: "",
        transform: "",
        visibility: "",
        zIndex: "",
      });
      delete item.dataset.focused;
    });
  };

  const applyResponsiveInteractionDelta = (deltaX: number) => {
    deckInteractionOffset -=
      (deltaX * inlineDirection) / Math.max(refs.root.clientWidth * 0.11, 96);
    lastResponsiveInteractionTime = performance.now();
    updateResponsiveDeckTarget();
    scheduleResponsiveDeckFrame();
  };

  if (isDesktop) {
    setMotionMode("smooth");
    clearResponsiveDeckTransforms();

    const scrollId = `media-scroll-${pathname}-${vw}`;
    const scrollRafKey = `${scrollId}-frame`;
    const resizeRafKey = `${scrollId}-resize`;
    const updateScrollTransforms = () => {
      const progress = resolveSectionProgress(sectionMetrics);

      scrollRotation = lerp(
        MEDIA_SCROLL_ROTATION_RANGE[0],
        MEDIA_SCROLL_ROTATION_RANGE[1],
        progress,
      );
      applyTransforms();
      applyTextTransform(
        lerp(MEDIA_TEXT_X_RANGE[0], MEDIA_TEXT_X_RANGE[1], progress),
      );
    };
    const scheduleScrollUpdate = () => {
      rafBatch.schedule(scrollRafKey, updateScrollTransforms);
    };
    const handleResize = () => {
      rafBatch.schedule(resizeRafKey, () => {
        sectionMetrics = measureSectionRange(refs.root);
        updateScrollTransforms();
      });
    };

    scrollManager.createInstance(scrollId, scheduleScrollUpdate, {
      throttle: MEDIA_SCROLL_THROTTLE_MS,
      useRAF: false,
    });
    window.addEventListener("resize", handleResize, {
      passive: true,
    });
    scheduleScrollUpdate();
    scrollIds.push(scrollId);
    rafKeys.push(scrollRafKey);
    rafKeys.push(resizeRafKey);
    cleanupFns.push(() => {
      window.removeEventListener("resize", handleResize);
    });
  } else {
    setMotionMode("smooth");
    styleSetter.set(refs.container, "transform", "");
    styleSetter.set(refs.text, "transform", "");

    const scrollId = `media-responsive-scroll-${pathname}-${vw}`;
    const scrollRafKey = `${scrollId}-frame`;
    const resizeRafKey = `${scrollId}-resize`;
    const updateScrollTransforms = () => {
      const progress = resolveSectionProgress(sectionMetrics);

      deckScrollPosition =
        deckBasePosition + progress * MEDIA_RESPONSIVE_SCROLL_TRAVEL;
      lastResponsiveScrollTime = performance.now();
      updateResponsiveDeckTarget();
      scheduleResponsiveDeckFrame();
    };
    const scheduleScrollUpdate = () => {
      rafBatch.schedule(scrollRafKey, updateScrollTransforms);
    };
    const handleResize = () => {
      rafBatch.schedule(resizeRafKey, () => {
        sectionMetrics = measureSectionRange(refs.root);
        updateScrollTransforms();
      });
    };

    scrollManager.createInstance(scrollId, scheduleScrollUpdate, {
      throttle: MEDIA_SCROLL_THROTTLE_MS,
      useRAF: false,
    });
    window.addEventListener("resize", handleResize, {
      passive: true,
    });
    updateScrollTransforms();
    deckCurrent = deckTarget;
    applyResponsiveDeckTransforms(deckCurrent);
    scrollIds.push(scrollId);
    rafKeys.push(scrollRafKey);
    rafKeys.push(resizeRafKey);
    cleanupFns.push(() => {
      window.removeEventListener("resize", handleResize);

      if (deckFrameId !== null) {
        window.cancelAnimationFrame(deckFrameId);
        deckFrameId = null;
      }

      clearResponsiveDeckTransforms();
    });
  }

  const handlePointerDown = (event: PointerEvent) => {
    if (
      event.button !== 0 ||
      (event.target instanceof Element &&
        event.target.closest("video, [data-media-fullscreen-proxy]"))
    ) {
      return;
    }

    isDragging = true;
    didDrag = false;
    setDirectMotion();
    refs.root.setPointerCapture?.(event.pointerId);
    pendingClickButton =
      event.target instanceof Element
        ? event.target.closest<HTMLButtonElement>(MEDIA_BUTTON_SELECTOR)
        : null;
    startClientX = event.clientX;
    lastClientX = event.clientX;
  };

  const handlePointerMove = (event: PointerEvent) => {
    if (!isDragging) {
      return;
    }

    const totalDeltaX = event.clientX - startClientX;

    if (!didDrag && Math.abs(totalDeltaX) < MEDIA_DRAG_CLICK_THRESHOLD) {
      return;
    }

    const deltaX = didDrag ? event.clientX - lastClientX : totalDeltaX;

    didDrag = true;
    lastClientX = event.clientX;

    if (isDesktop) {
      applyInteractionDelta(deltaX);
    } else {
      applyResponsiveInteractionDelta(deltaX);
    }
  };

  const normalizeWheelDelta = (event: WheelEvent): number => {
    const rawDelta =
      Math.abs(event.deltaX) > Math.abs(event.deltaY)
        ? event.deltaX
        : event.shiftKey
          ? event.deltaY
          : 0;

    if (rawDelta === 0) {
      return 0;
    }

    if (event.deltaMode === WheelEvent.DOM_DELTA_LINE) {
      return rawDelta * MEDIA_WHEEL_LINE_HEIGHT;
    }

    if (event.deltaMode === WheelEvent.DOM_DELTA_PAGE) {
      return rawDelta * window.innerWidth;
    }

    return rawDelta;
  };

  const handleWheel = (event: WheelEvent) => {
    const deltaX = normalizeWheelDelta(event);

    if (deltaX === 0) {
      return;
    }

    event.preventDefault();
    setDirectMotion();

    if (isDesktop) {
      applyInteractionDelta(deltaX);
    } else if (isResponsiveDeck) {
      deckInteractionOffset += deltaX * inlineDirection * 0.00235;
      lastResponsiveInteractionTime = performance.now();
      updateResponsiveDeckTarget();
      scheduleResponsiveDeckFrame();
    }

    scheduleSmoothMotion();
  };

  const stopPointerDrag = (event: PointerEvent) => {
    if (!isDragging) {
      return;
    }

    const buttonToPlay = pendingClickButton;
    const shouldPlayPendingButton =
      event.type === "pointerup" &&
      !didDrag &&
      buttonToPlay &&
      document.contains(buttonToPlay);

    isDragging = false;
    suppressClick = didDrag;
    pendingClickButton = null;
    if (refs.root.hasPointerCapture?.(event.pointerId)) {
      refs.root.releasePointerCapture(event.pointerId);
    }
    scheduleSmoothMotion();

    if (isResponsiveDeck) {
      lastResponsiveInteractionTime = performance.now();
      scheduleResponsiveDeckFrame();
    }

    if (suppressClick) {
      window.setTimeout(() => {
        suppressClick = false;
      }, 0);
    }

    if (shouldPlayPendingButton && buttonToPlay) {
      playMediaButton(buttonToPlay);
    }
  };

  const playMediaButton = (button: HTMLButtonElement) => {
    const item = button.closest<HTMLElement>(MEDIA_ITEM_SELECTOR);
    const player = item?.querySelector<HTMLElement>(MEDIA_PLAYER_SELECTOR);
    const videoId = item?.dataset.videoId;
    const title = item?.dataset.videoTitle ?? labels.fallbackTitle;

    if (!item || !player || !videoId || isMediaPlayerLoaded(player)) {
      return;
    }

    swapCardToVideo(button, item, player, videoId, title, labels);
  };

  const handleFullscreenProxyClick = (event: MouseEvent) => {
    const button =
      event.target instanceof Element
        ? event.target.closest<HTMLButtonElement>(
            MEDIA_FULLSCREEN_PROXY_SELECTOR,
          )
        : null;

    if (!button || !refs.root.contains(button)) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    const item = button.closest<HTMLElement>(MEDIA_ITEM_SELECTOR);
    const video = item?.querySelector<HTMLVideoElement>("video");

    if (!video) {
      return;
    }

    openVideoFullscreen(video);
  };

  const handleButtonClick = (event: MouseEvent) => {
    if (suppressClick) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }

    const button = event.currentTarget;

    if (!(button instanceof HTMLButtonElement)) {
      return;
    }

    playMediaButton(button);
  };

  refs.root.addEventListener("pointerdown", handlePointerDown);
  refs.root.addEventListener("click", handleFullscreenProxyClick);
  refs.root.addEventListener("wheel", handleWheel, { passive: false });
  window.addEventListener("pointermove", handlePointerMove, { passive: true });
  window.addEventListener("pointerup", stopPointerDrag);
  window.addEventListener("pointercancel", stopPointerDrag);
  cleanupFns.push(() => {
    refs.root.removeEventListener("pointerdown", handlePointerDown);
    refs.root.removeEventListener("click", handleFullscreenProxyClick);
    refs.root.removeEventListener("wheel", handleWheel);
    window.removeEventListener("pointermove", handlePointerMove);
    window.removeEventListener("pointerup", stopPointerDrag);
    window.removeEventListener("pointercancel", stopPointerDrag);
  });

  refs.buttons.forEach((button) => {
    button.addEventListener("click", handleButtonClick);
  });
  cleanupFns.push(() => {
    refs.buttons.forEach((button) => {
      button.removeEventListener("click", handleButtonClick);
    });
  });

  if (rafKeys.length === 0 && cleanupFns.length === 0) {
    return null;
  }

  return {
    cleanupFns,
    rafKeys,
    scrollIds,
  };
}

export default function MediaAnimate({
  labels,
}: {
  labels: MediaMotionLabels;
}) {
  const pathname = usePathname();
  const { vw } = dimensionsStore();

  // biome-ignore lint/correctness/useExhaustiveDependencies: Release players on route changes, not viewport changes.
  useEffect(() => {
    const root = document.querySelector<HTMLElement>(MEDIA_ROOT_SELECTOR);

    // Fullscreen can resize the viewport. Keep players alive across animation
    // rebuilds and release their media only when leaving this page.
    return () => {
      if (root) {
        resetLoadedVideos(root);
      }
    };
  }, [pathname]);

  useEffect(() => {
    const session = initMediaAnimations(pathname ?? "landing", vw, labels);

    kickScroll();

    return () => {
      cleanupMediaAnimations(session);
    };
  }, [pathname, vw, labels]);

  return null;
}
