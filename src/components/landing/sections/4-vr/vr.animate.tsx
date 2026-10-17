"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import {
  getVrRootSelector,
  VR_SCENE_MOUNT_SELECTOR,
} from "@/lib/landingVr/vr.shared";
import { getVrSceneController } from "@/lib/landingVr/vrSceneController";
import { createDOMCache } from "@/lib/scrollInteraction/createDOMCache";
import { createInstanceRegistry } from "@/lib/scrollInteraction/createInstanceRegistry";
import {
  createRAFBatch,
  getScrollTrigger,
  kickScroll,
} from "@/lib/scrollInteraction/scrollTrigger";
import { dimensionsStore } from "@/store/dimensionsStore";

const activeInstances = createInstanceRegistry();
const domCache = createDOMCache();
const rafBatch = createRAFBatch();

const VR_SCROLL_ROTATION_RANGE = [0, 0.5] as const;
const VR_SCROLL_START_POINT = [0.5] as const;
const VR_SCROLL_END_POINT = [0] as const;

type VrAnimateProps = {
  sceneId: string;
};

type VrDomRefs = {
  root: HTMLElement;
  sceneMount: HTMLElement;
};

type VrAnimationSession = {
  instanceIds: string[];
  rafKeys: string[];
};

const cachedDomRefs = new Map<string, VrDomRefs>();

function getCacheKey(sceneId: string, suffix: string): string {
  return `vr-${sceneId}-${suffix}`;
}

function getCachedDomRefs(sceneId: string): VrDomRefs | null {
  const cached = cachedDomRefs.get(sceneId);

  if (
    cached &&
    document.contains(cached.root) &&
    document.contains(cached.sceneMount)
  ) {
    return cached;
  }

  const root = domCache.get<HTMLElement>(getCacheKey(sceneId, "root"), () =>
    document.querySelector<HTMLElement>(getVrRootSelector(sceneId)),
  );

  if (!root) {
    return null;
  }

  const sceneMount = domCache.get<HTMLElement>(
    getCacheKey(sceneId, "scene-mount"),
    VR_SCENE_MOUNT_SELECTOR,
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

function cleanupVrAnimations(
  sceneId: string,
  session: VrAnimationSession | null,
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

  clearCachedDomRefs(sceneId);
}

function initVrAnimations(
  pathname: string,
  vw: number,
  sceneId: string,
): VrAnimationSession | null {
  if (typeof window === "undefined") {
    return null;
  }

  const refs = getCachedDomRefs(sceneId);
  const trigger = getScrollTrigger();

  if (!refs || !trigger) {
    return null;
  }

  const instanceId = `vr-scroll-${pathname}-${sceneId}-${vw}`;
  const rafKey = `${instanceId}-frame`;
  const session = {
    instanceIds: [instanceId],
    rafKeys: [rafKey],
  };

  const instance = trigger.createInstance(instanceId, refs.sceneMount, {
    values: [[...VR_SCROLL_ROTATION_RANGE]],
    startPoint: [...VR_SCROLL_START_POINT],
    endPoint: [...VR_SCROLL_END_POINT],
    callback: ({ v }) => {
      rafBatch.schedule(rafKey, () => {
        const controller = getVrSceneController(sceneId);

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

export default function VrAnimate({ sceneId }: VrAnimateProps) {
  const pathname = usePathname();
  const { vw } = dimensionsStore();

  useEffect(() => {
    const session = initVrAnimations(pathname ?? "landing", vw, sceneId);

    kickScroll();

    return () => {
      cleanupVrAnimations(sceneId, session);
    };
  }, [pathname, sceneId, vw]);

  return null;
}
