"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { createDOMCache } from "@/lib/scrollInteraction/createDOMCache";
import { createInstanceRegistry } from "@/lib/scrollInteraction/createInstanceRegistry";
import { createBatchStyleSetter } from "@/lib/scrollInteraction/createSmartStyleSetter";
import scrollManager from "@/lib/scrollInteraction/scrollManager";
import {
  createRAFBatch,
  getScrollTrigger,
  kickScroll,
} from "@/lib/scrollInteraction/scrollTrigger";
import { dimensionsStore } from "@/store/dimensionsStore";
import styles from "./VSlider.module.css";

const DESKTOP_SCROLL_VALUES = [
  [0, 100],
  [50, 60],
] as const;

const DESKTOP_START_CLIP_PATH = "inset(0px 0px 0%)";
const DESKTOP_START_OBJECT_POSITION = "center 50%";
const DESKTOP_STATIC_OBJECT_POSITION = "center 50%";
const MOBILE_START_OBJECT_POSITION = "center 50%";
const MOBILE_VISIBLE_OPACITY = "1";
const MOBILE_HIDDEN_OPACITY = "0";
const MOBILE_DEFAULT_TRANSFORM = "translate3d(0, 0, 0) scale3d(1, 1, 1)";

const activeInstances = createInstanceRegistry();
const domCache = createDOMCache();
const styleSetter = createBatchStyleSetter();
const rafBatch = createRAFBatch();

type VSliderDomRefs = {
  root: HTMLElement;
  desktopProjects: HTMLElement[];
  desktopLayers: HTMLElement[];
  desktopImages: Array<HTMLImageElement | null>;
  mobilePlaceholders: HTMLElement[];
  mobileImages: HTMLImageElement[];
  mobileDetails: HTMLElement[];
};

type VSliderAnimationSession = {
  instanceIds: string[];
  rafKeys: string[];
  cleanups: Array<() => void>;
};

const cachedDomRefs = new Map<string, VSliderDomRefs>();
const initializingSliders = new Set<string>();

function toArray<T extends Element>(elements: NodeListOf<T> | null): T[] {
  return elements ? Array.from(elements) : [];
}

function getCacheKey(sliderId: string, suffix: string): string {
  return `v-slider-${sliderId}-${suffix}`;
}

function areElementsConnected(elements: Array<Element | null>): boolean {
  return elements.every((element) => !element || document.contains(element));
}

function getCachedDomRefs(sliderId: string): VSliderDomRefs | null {
  const cached = cachedDomRefs.get(sliderId);

  if (
    cached &&
    document.contains(cached.root) &&
    areElementsConnected([
      ...cached.desktopProjects,
      ...cached.desktopLayers,
      ...cached.desktopImages,
      ...cached.mobilePlaceholders,
      ...cached.mobileImages,
      ...cached.mobileDetails,
    ])
  ) {
    return cached;
  }

  const root = domCache.get<HTMLElement>(getCacheKey(sliderId, "root"), () =>
    document.querySelector<HTMLElement>(`[data-vslider-id="${sliderId}"]`),
  );

  if (!root) {
    return null;
  }

  const desktopProjects = toArray(
    domCache.getAll<HTMLElement>(
      getCacheKey(sliderId, "desktop-projects"),
      () => root.querySelectorAll<HTMLElement>(`.${styles.desktopProject}`),
    ),
  );
  const desktopLayers = toArray(
    domCache.getAll<HTMLElement>(getCacheKey(sliderId, "desktop-layers"), () =>
      root.querySelectorAll<HTMLElement>(`.${styles.desktopMediaLayer}`),
    ),
  );
  const mobilePlaceholders = toArray(
    domCache.getAll<HTMLElement>(
      getCacheKey(sliderId, "mobile-placeholders"),
      () => root.querySelectorAll<HTMLElement>(`.${styles.mobilePlaceholder}`),
    ),
  );
  const mobileImages = toArray(
    domCache.getAll<HTMLImageElement>(
      getCacheKey(sliderId, "mobile-images"),
      () => root.querySelectorAll<HTMLImageElement>(`.${styles.mobileImage}`),
    ),
  );
  const mobileDetails = toArray(
    domCache.getAll<HTMLElement>(getCacheKey(sliderId, "mobile-details"), () =>
      root.querySelectorAll<HTMLElement>(`.${styles.mobileProjectDetails}`),
    ),
  );

  const refs = {
    root,
    desktopProjects,
    desktopLayers,
    desktopImages: desktopLayers.map((layer) =>
      layer.querySelector<HTMLImageElement>("img"),
    ),
    mobilePlaceholders,
    mobileImages,
    mobileDetails,
  };

  cachedDomRefs.set(sliderId, refs);
  return refs;
}

function clearCachedDomRefs(sliderId: string) {
  cachedDomRefs.delete(sliderId);
  domCache.clear();
}

function resetDesktopState(refs: VSliderDomRefs) {
  refs.desktopLayers.forEach((layer, index) => {
    styleSetter.set(layer, "clipPath", "");

    const image = refs.desktopImages[index];
    if (image) {
      styleSetter.set(image, "objectPosition", "");
    }
  });
}

function resetMobileState(refs: VSliderDomRefs) {
  refs.mobileImages.forEach((image) => {
    styleSetter.set(image, "clipPath", "");
    styleSetter.set(image, "objectPosition", "");
  });

  refs.mobileDetails.forEach((detail) => {
    styleSetter.set(detail, "transform", "");
    styleSetter.set(detail, "opacity", "");
  });
}

function clamp01(value: number) {
  return Math.min(1, Math.max(0, value));
}

function mapRangeValue(
  [startValue, endValue]: readonly [number, number],
  progress: number,
) {
  return startValue + (endValue - startValue) * progress;
}

function getDesktopScrollRange(element: HTMLElement) {
  const rect = element.getBoundingClientRect();
  const visualTop = rect.top + window.scrollY;
  // Start when the current copy and full image reach the viewport center.
  // Keep the original image-height row distance; only delay the wipe start.
  const start = visualTop + rect.height * 0.5 - window.innerHeight * 0.5;

  return { start, end: start + rect.height };
}

function cleanupSliderAnimations(
  sliderId: string,
  session: VSliderAnimationSession | null,
) {
  const trigger = getScrollTrigger();
  const refs = getCachedDomRefs(sliderId);

  session?.cleanups.forEach((cleanup) => {
    cleanup();
  });

  session?.rafKeys.forEach((key) => {
    rafBatch.cancel(key);
  });

  session?.instanceIds.forEach((id) => {
    activeInstances.remove(id);

    try {
      trigger?.removeInstance(id);
    } catch (_) {
      // no-op
    }

    scrollManager.removeInstance(id);
  });

  if (refs) {
    resetDesktopState(refs);
    resetMobileState(refs);
  }

  clearCachedDomRefs(sliderId);
}

function initDesktopAnimations(
  pathname: string,
  sliderId: string,
  refs: VSliderDomRefs,
  session: VSliderAnimationSession,
) {
  const transitionCount =
    Math.min(refs.desktopProjects.length, refs.desktopLayers.length) - 1;

  if (transitionCount <= 0) {
    return;
  }

  refs.desktopLayers.forEach((layer, index) => {
    styleSetter.set(layer, "clipPath", DESKTOP_START_CLIP_PATH);

    const image = refs.desktopImages[index];
    if (image) {
      styleSetter.set(
        image,
        "objectPosition",
        index < transitionCount
          ? DESKTOP_START_OBJECT_POSITION
          : DESKTOP_STATIC_OBJECT_POSITION,
      );
    }
  });

  let ranges = refs.desktopProjects
    .slice(0, transitionCount)
    .map(getDesktopScrollRange);
  const updates: Array<() => void> = [];

  for (let index = 0; index < transitionCount; index += 1) {
    const layer = refs.desktopLayers[index];
    const image = refs.desktopImages[index];
    const id = `v-slider-desktop-${pathname}-${sliderId}-${index}`;
    const rafKey = `${id}-frame`;

    const applyStartState = () => {
      styleSetter.set(layer, "clipPath", DESKTOP_START_CLIP_PATH);

      if (image) {
        styleSetter.set(image, "objectPosition", DESKTOP_START_OBJECT_POSITION);
      }
    };

    session.rafKeys.push(rafKey);

    const updateLayer = () => {
      const { start, end } = ranges[index];
      const progress = clamp01((window.scrollY - start) / (end - start || 1));

      if (progress <= 0) {
        applyStartState();
        return;
      }

      const clipValue = mapRangeValue(DESKTOP_SCROLL_VALUES[0], progress);
      const objectPositionValue = mapRangeValue(
        DESKTOP_SCROLL_VALUES[1],
        progress,
      );

      styleSetter.set(layer, "clipPath", `inset(0px 0px ${clipValue}%)`);

      if (image) {
        styleSetter.set(
          image,
          "objectPosition",
          `center ${objectPositionValue}%`,
        );
      }
    };

    const instance = scrollManager.createInstance(id, () => {
      rafBatch.schedule(rafKey, updateLayer);
    });

    activeInstances.add(id, instance);
    session.instanceIds.push(id);
    updates.push(updateLayer);
    updateLayer();
  }

  // Cache geometry outside scroll frames, including height-only resizes.
  const measureKey = `v-slider-desktop-${pathname}-${sliderId}-measure`;
  session.rafKeys.push(measureKey);
  const measure = () => {
    ranges = refs.desktopProjects
      .slice(0, transitionCount)
      .map(getDesktopScrollRange);
    updates.forEach((update) => {
      update();
    });
  };
  const scheduleMeasure = () => rafBatch.schedule(measureKey, measure);
  const observer = new ResizeObserver(scheduleMeasure);
  observer.observe(refs.root);
  window.addEventListener("resize", scheduleMeasure, { passive: true });
  session.cleanups.push(() => {
    observer.disconnect();
    window.removeEventListener("resize", scheduleMeasure);
  });
}

function initMobileAnimations(
  pathname: string,
  sliderId: string,
  vw: number,
  refs: VSliderDomRefs,
  session: VSliderAnimationSession,
) {
  const trigger = getScrollTrigger();
  const transitionCount =
    Math.min(
      refs.mobilePlaceholders.length,
      refs.mobileImages.length,
      refs.mobileDetails.length,
    ) - 1;

  if (!trigger || transitionCount <= 0) {
    return;
  }

  const mobileScrollValues = [
    [0, 100],
    [50, 60],
    [0, vw > 480 ? 120 : 160],
    [1, 0.8],
    [1, 0],
    [-1, 1],
  ];

  refs.mobileImages.forEach((image) => {
    styleSetter.set(image, "clipPath", DESKTOP_START_CLIP_PATH);
    styleSetter.set(image, "objectPosition", MOBILE_START_OBJECT_POSITION);
  });

  refs.mobileDetails.forEach((detail, index) => {
    styleSetter.set(detail, "transform", MOBILE_DEFAULT_TRANSFORM);
    styleSetter.set(
      detail,
      "opacity",
      index === 0 ? MOBILE_VISIBLE_OPACITY : MOBILE_HIDDEN_OPACITY,
    );
  });

  for (let index = 0; index < transitionCount; index += 1) {
    const placeholder = refs.mobilePlaceholders[index];
    const image = refs.mobileImages[index];
    const detail = refs.mobileDetails[index];
    const nextDetail = refs.mobileDetails[index + 1] ?? null;
    const id = `v-slider-mobile-${pathname}-${sliderId}-${index}`;
    const rafKey = `${id}-frame`;

    session.rafKeys.push(rafKey);

    const instance = trigger.createInstance(id, placeholder, {
      values: mobileScrollValues,
      startPoint: [0.5],
      endPoint: [0.5],
      callback: ({ v }) => {
        rafBatch.schedule(rafKey, () => {
          const isBeforeStart =
            v[0] <= 0 && window.scrollY < trigger.calcTop(placeholder, [0.5]);

          if (isBeforeStart) {
            styleSetter.set(image, "clipPath", DESKTOP_START_CLIP_PATH);
            styleSetter.set(
              image,
              "objectPosition",
              MOBILE_START_OBJECT_POSITION,
            );
            styleSetter.set(detail, "transform", MOBILE_DEFAULT_TRANSFORM);

            if (index === 0) {
              styleSetter.set(detail, "opacity", MOBILE_VISIBLE_OPACITY);
            }

            if (nextDetail) {
              styleSetter.set(nextDetail, "opacity", MOBILE_HIDDEN_OPACITY);
            }

            return;
          }

          styleSetter.set(image, "clipPath", `inset(0px 0px ${v[0]}%)`);
          styleSetter.set(image, "objectPosition", `center ${v[1]}%`);
          styleSetter.set(
            detail,
            "transform",
            `translate3d(0, -${v[2]}vw, 0) scale3d(${v[3]}, ${v[3]}, ${v[3]})`,
          );
          styleSetter.set(detail, "opacity", `${v[4]}`);

          if (nextDetail) {
            styleSetter.set(
              nextDetail,
              "opacity",
              v[5] > 0 ? `${v[5]}` : MOBILE_HIDDEN_OPACITY,
            );
          }
        });
      },
    });

    if (!instance) {
      continue;
    }

    activeInstances.add(id, instance);
    session.instanceIds.push(id);
  }
}

function initSliderAnimations(
  pathname: string,
  sliderId: string,
  vw: number,
): VSliderAnimationSession | null {
  if (typeof window === "undefined" || initializingSliders.has(sliderId)) {
    return null;
  }

  const refs = getCachedDomRefs(sliderId);

  if (!refs) {
    return null;
  }

  initializingSliders.add(sliderId);

  try {
    const session: VSliderAnimationSession = {
      instanceIds: [],
      rafKeys: [],
      cleanups: [],
    };

    if (vw > 1024) {
      initDesktopAnimations(pathname, sliderId, refs, session);
    } else {
      initMobileAnimations(pathname, sliderId, vw, refs, session);
    }

    kickScroll();
    return session;
  } finally {
    initializingSliders.delete(sliderId);
  }
}

export function useVSliderAnimations(sliderId: string) {
  const pathname = usePathname() ?? "";
  const { vw } = dimensionsStore();

  useEffect(() => {
    if (!vw) {
      return;
    }
    cleanupSliderAnimations(sliderId, null);
    const session = initSliderAnimations(pathname, sliderId, vw);

    return () => {
      cleanupSliderAnimations(sliderId, session);
    };
  }, [pathname, sliderId, vw]);
}
