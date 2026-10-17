"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import {
  getHowItWorksRootSelector,
  HOW_IT_WORKS_SCENE_MOUNT_SELECTOR,
} from "@/lib/howItWorks3d/howItWorks.shared";
import { getHowItWorksSceneController } from "@/lib/howItWorks3d/howItWorksSceneController";
import { LANDING_3D_IMAGE_FALLBACK_MAX_WIDTH } from "@/lib/landing3d/spline.shared";
import { createDOMCache } from "@/lib/scrollInteraction/createDOMCache";
import { createInstanceRegistry } from "@/lib/scrollInteraction/createInstanceRegistry";
import { createSmartStyleSetter } from "@/lib/scrollInteraction/createSmartStyleSetter";
import {
  createRAFBatch,
  getScrollTrigger,
  kickScroll,
} from "@/lib/scrollInteraction/scrollTrigger";
import { dimensionsStore } from "@/store/dimensionsStore";
import styles from "./how-it-works.module.css";

const activeInstances = createInstanceRegistry();
const domCache = createDOMCache();
const rafBatch = createRAFBatch();

const HOW_IT_WORKS_SCROLL_ROTATION_RANGE = [0, 0.5] as const;
const HOW_IT_WORKS_SCROLL_START_POINT = [0.5] as const;
const HOW_IT_WORKS_SCROLL_END_POINT = [0] as const;

// Tablet/mobile fallback: the live scene is a static image, so mimic the 3D
// model's scroll-driven rotation by tilting that image through the section.
// rotateX crosses zero near the section center (most readable), rotateY adds a
// faint horizontal turn that echoes the desktop pointer parallax.
const HOW_IT_WORKS_IMAGE_ROTATE_X = [9, -9] as const;
const HOW_IT_WORKS_IMAGE_ROTATE_Y = [-5, 5] as const;
const HOW_IT_WORKS_IMAGE_PERSPECTIVE = 1000;

let imageStyleSetter: ReturnType<typeof createSmartStyleSetter> | null = null;
let styledImageEl: HTMLElement | null = null;

type HowItWorksAnimateProps = {
  sceneId: string;
};

type HowItWorksDomRefs = {
  root: HTMLElement;
  sceneMount: HTMLElement;
};

type HowItWorksAnimationSession = {
  instanceIds: string[];
  rafKeys: string[];
};

const cachedDomRefs = new Map<string, HowItWorksDomRefs>();

function getCacheKey(sceneId: string, suffix: string): string {
  return `how-it-works-${sceneId}-${suffix}`;
}

function getCachedDomRefs(sceneId: string): HowItWorksDomRefs | null {
  const cached = cachedDomRefs.get(sceneId);

  if (
    cached &&
    document.contains(cached.root) &&
    document.contains(cached.sceneMount)
  ) {
    return cached;
  }

  const root = domCache.get<HTMLElement>(getCacheKey(sceneId, "root"), () =>
    document.querySelector<HTMLElement>(getHowItWorksRootSelector(sceneId)),
  );

  if (!root) {
    return null;
  }

  const sceneMount = domCache.get<HTMLElement>(
    getCacheKey(sceneId, "scene-mount"),
    HOW_IT_WORKS_SCENE_MOUNT_SELECTOR,
    root,
  );

  if (!sceneMount) {
    return null;
  }

  const refs = {
    root,
    sceneMount,
  };

  cachedDomRefs.set(sceneId, refs);
  return refs;
}

function clearCachedDomRefs(sceneId: string) {
  cachedDomRefs.delete(sceneId);
  domCache.clear();
}

function cleanupHowItWorksAnimations(
  sceneId: string,
  session: HowItWorksAnimationSession | null,
) {
  const trigger = getScrollTrigger();

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
  });

  if (styledImageEl) {
    styledImageEl.style.transform = "";
    styledImageEl.style.transformOrigin = "";
    styledImageEl.style.willChange = "";
  }

  imageStyleSetter?.clearCache();
  imageStyleSetter = null;
  styledImageEl = null;

  clearCachedDomRefs(sceneId);
}

function initHowItWorksAnimations(
  pathname: string,
  vw: number,
  sceneId: string,
): HowItWorksAnimationSession | null {
  if (typeof window === "undefined") {
    return null;
  }

  const refs = getCachedDomRefs(sceneId);
  const trigger = getScrollTrigger();

  if (!refs || !trigger) {
    return null;
  }

  const instanceId = `how-it-works-scroll-${pathname}-${sceneId}-${vw}`;
  const rafKey = `${instanceId}-frame`;
  const session = {
    instanceIds: [instanceId],
    rafKeys: [rafKey],
  };

  const isImageMode = vw <= LANDING_3D_IMAGE_FALLBACK_MAX_WIDTH;
  const imageEl = isImageMode
    ? refs.sceneMount.querySelector<HTMLElement>(`.${styles.mobileScene}`)
    : null;

  if (isImageMode && imageEl) {
    imageEl.style.transformOrigin = "center center";
    imageEl.style.willChange = "transform";
    imageStyleSetter = createSmartStyleSetter(imageEl);
    styledImageEl = imageEl;

    const instance = trigger.createInstance(instanceId, refs.sceneMount, {
      values: [
        [...HOW_IT_WORKS_IMAGE_ROTATE_X],
        [...HOW_IT_WORKS_IMAGE_ROTATE_Y],
      ],
      startPoint: [...HOW_IT_WORKS_SCROLL_START_POINT],
      endPoint: [...HOW_IT_WORKS_SCROLL_END_POINT],
      callback: ({ v }) => {
        rafBatch.schedule(rafKey, () => {
          imageStyleSetter?.set(
            "transform",
            `perspective(${HOW_IT_WORKS_IMAGE_PERSPECTIVE}px) rotateX(${v[0] ?? 0}deg) rotateY(${v[1] ?? 0}deg)`,
          );
        });
      },
    });

    if (!instance) {
      return null;
    }

    activeInstances.add(instanceId, instance);
    return session;
  }

  const instance = trigger.createInstance(instanceId, refs.sceneMount, {
    values: [[...HOW_IT_WORKS_SCROLL_ROTATION_RANGE]],
    startPoint: [...HOW_IT_WORKS_SCROLL_START_POINT],
    endPoint: [...HOW_IT_WORKS_SCROLL_END_POINT],
    callback: ({ v }) => {
      rafBatch.schedule(rafKey, () => {
        const controller = getHowItWorksSceneController(sceneId);

        controller?.setScrollRotationX(v[0] ?? 0);
      });
    },
  });

  if (!instance) {
    return null;
  }

  activeInstances.add(instanceId, instance);
  return session;
}

export default function HowItWorksAnimate({ sceneId }: HowItWorksAnimateProps) {
  const pathname = usePathname();
  const { vw } = dimensionsStore();

  useEffect(() => {
    const session = initHowItWorksAnimations(
      pathname ?? "landing",
      vw,
      sceneId,
    );

    kickScroll();

    return () => {
      cleanupHowItWorksAnimations(sceneId, session);
    };
  }, [pathname, sceneId, vw]);

  return null;
}
