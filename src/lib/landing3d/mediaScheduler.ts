import {
  LANDING_3D_IMAGE_FALLBACK_MAX_WIDTH,
  loadCachedArrayBufferAsset,
  loadSplineRuntimeModule,
} from "./spline.shared";
import { measureViewportDistance } from "./viewportDistance";

export type LandingMediaGroup = {
  /** DOM id of the section the assets belong to (distance source). */
  sectionId: string;
  urls: readonly string[];
  /** Which viewports need these assets. Desktop is > the 3D image fallback width. */
  breakpoint: "desktop" | "mobile" | "all";
  /** scene-buffer goes through the splinecode promise cache shared with the scene clients. */
  kind: "image" | "scene-buffer";
  /**
   * Large payloads are start-gated: they only begin downloading once their
   * section is near the viewport, or once every small task has drained. They
   * are never aborted mid-flight because the splinecode cache is shared.
   */
  large?: boolean;
};

type SchedulerTask = {
  group: LandingMediaGroup;
  url: string;
};

const SCHEDULER_CONCURRENCY = 3;
const FIRST_TICK_IDLE_TIMEOUT_MS = 1500;
const LARGE_TASK_NEAR_VIEWPORTS = 2;

let idleResolver: (() => void) | null = null;
let idlePromise: Promise<void> | null = null;
let nearIdleResolver: (() => void) | null = null;
let nearIdlePromise: Promise<void> | null = null;

/**
 * Resolves once the viewport-priority preload queue has fully drained (and,
 * on desktop, the Spline modules are warm). Deferred consumers — the pano
 * tour iframe — use this to start without ever competing with visible media.
 */
export function whenLandingMediaIdle(): Promise<void> {
  if (!idlePromise) {
    idlePromise = new Promise<void>((resolve) => {
      idleResolver = resolve;
    });
  }

  return idlePromise;
}

/**
 * Resolves as soon as nothing within ~2 viewports of the user is still
 * waiting to download — i.e. their screen is served, even if far sections
 * are still streaming. Scene pre-boot hangs off this rather than full idle,
 * so 3D never waits behind megabytes of far-away image frames.
 */
export function whenLandingMediaNearIdle(): Promise<void> {
  if (!nearIdlePromise) {
    nearIdlePromise = new Promise<void>((resolve) => {
      nearIdleResolver = resolve;
    });
  }

  return nearIdlePromise;
}

function resolveLandingMediaNearIdle(): void {
  // Ensure the promise exists so late subscribers still resolve instantly.
  void whenLandingMediaNearIdle();
  nearIdleResolver?.();
  nearIdleResolver = null;
}

function resolveLandingMediaIdle(): void {
  void whenLandingMediaIdle();
  idleResolver?.();
  idleResolver = null;
  // Full idle implies near idle (covers manifests with no nearby work).
  resolveLandingMediaNearIdle();
}

/**
 * Warms an image through the image cache rather than fetch(). An <img> load
 * shares its cache entry with CSS backgrounds, next/image and EchoView's own
 * Image() preloads, so the renderer reuses this request instead of issuing a
 * second one -- fetch() lands in a different cache partition and measurably
 * doubled every frame download on a cold visit.
 */
function warmImageTask(url: string): Promise<void> {
  return new Promise((resolve) => {
    const image = new window.Image();
    const settle = () => resolve();

    image.decoding = "async";
    image.addEventListener("load", settle, { once: true });
    image.addEventListener("error", settle, { once: true });
    image.src = url;
  });
}

/**
 * Warms the HTTP cache for landing media in distance-from-viewport order.
 * Distances are re-measured every time a download slot frees up, so a scroll
 * immediately redirects the remaining bandwidth to what the user is looking
 * at — no listener bookkeeping and no wasted in-flight bytes.
 */
export function startLandingMediaScheduler(
  manifest: readonly LandingMediaGroup[],
): () => void {
  if (typeof window === "undefined") {
    return () => {};
  }

  const desktopQuery = window.matchMedia(
    `(min-width: ${LANDING_3D_IMAGE_FALLBACK_MAX_WIDTH + 1}px)`,
  );
  const sectionElements = new Map<string, HTMLElement | null>();
  const pendingTasks: SchedulerTask[] = manifest.flatMap((group) =>
    group.urls.map((url) => ({ group, url })),
  );
  let inFlightCount = 0;
  let isStopped = false;
  let hasDrained = false;

  const resolveSectionElement = (sectionId: string): HTMLElement | null => {
    const cachedElement = sectionElements.get(sectionId);

    if (cachedElement) {
      return cachedElement;
    }

    const element = document.getElementById(sectionId);

    sectionElements.set(sectionId, element);

    return element;
  };

  const measureDistance = (sectionId: string): number => {
    const element = resolveSectionElement(sectionId);

    if (!element) {
      return Number.POSITIVE_INFINITY;
    }

    return measureViewportDistance(
      element.getBoundingClientRect(),
      Math.max(window.innerHeight, 1),
    );
  };

  const matchesViewport = (group: LandingMediaGroup): boolean => {
    if (group.breakpoint === "all") {
      return true;
    }

    return group.breakpoint === "desktop"
      ? desktopQuery.matches
      : !desktopQuery.matches;
  };

  // Ordering tiers, lowest first. A scene cannot render at all until its
  // buffer lands, while frames and stills only sharpen a section that already
  // looks right -- so nearby buffers outrank nearby images. Otherwise 80
  // echo-view frames win every slot and the 3D never boots.
  const rankTask = (task: SchedulerTask, distance: number): number => {
    const nearDistance = window.innerHeight * LARGE_TASK_NEAR_VIEWPORTS;
    const isNear = distance <= nearDistance;

    if (Boolean(task.group.large) && !isNear) {
      return 3;
    }

    if (!isNear) {
      return 2;
    }

    return task.group.kind === "scene-buffer" ? 0 : 1;
  };

  const pickNextTaskIndex = (): number => {
    let bestIndex = -1;
    let bestRank = Number.POSITIVE_INFINITY;
    let bestDistance = Number.POSITIVE_INFINITY;

    for (let index = 0; index < pendingTasks.length; index += 1) {
      const task = pendingTasks[index];

      if (!matchesViewport(task.group)) {
        continue;
      }

      const distance = measureDistance(task.group.sectionId);
      const rank = rankTask(task, distance);

      if (rank < bestRank || (rank === bestRank && distance < bestDistance)) {
        bestIndex = index;
        bestRank = rank;
        bestDistance = distance;
      }
    }

    if (bestIndex === -1) {
      return -1;
    }

    // A start-gated payload (tier 3) only begins once nothing else could use
    // the slot, so a far-away 1.5MB scene never competes with visible media.
    if (bestRank === 3 && inFlightCount > 0) {
      return -1;
    }

    return bestIndex;
  };

  const handleQueueDrained = () => {
    if (hasDrained || isStopped) {
      return;
    }

    hasDrained = true;

    const finishIdleTail = () => {
      if (!isStopped) {
        resolveLandingMediaIdle();
      }
    };

    if (desktopQuery.matches) {
      void Promise.allSettled([loadSplineRuntimeModule()]).then(finishIdleTail);
      return;
    }

    finishIdleTail();
  };

  const runTask = async (task: SchedulerTask): Promise<void> => {
    try {
      if (task.group.kind === "scene-buffer") {
        await loadCachedArrayBufferAsset(task.url, task.group.sectionId);
        return;
      }

      await warmImageTask(task.url);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);

      console.warn(`Landing media preload failed: ${message}`);
    }
  };

  const tick = () => {
    if (isStopped) {
      return;
    }

    while (inFlightCount < SCHEDULER_CONCURRENCY) {
      const taskIndex = pickNextTaskIndex();

      if (taskIndex === -1) {
        break;
      }

      const [task] = pendingTasks.splice(taskIndex, 1);

      inFlightCount += 1;
      void runTask(task).finally(() => {
        inFlightCount -= 1;
        tick();
      });
    }

    const nearDistance = window.innerHeight * LARGE_TASK_NEAR_VIEWPORTS;
    const hasNearPendingTask = pendingTasks.some(
      (task) =>
        matchesViewport(task.group) &&
        measureDistance(task.group.sectionId) <= nearDistance,
    );

    if (!hasNearPendingTask) {
      resolveLandingMediaNearIdle();
    }

    if (inFlightCount === 0 && pickNextTaskIndex() === -1) {
      const hasEligiblePendingTask = pendingTasks.some((task) =>
        matchesViewport(task.group),
      );

      if (!hasEligiblePendingTask) {
        handleQueueDrained();
      }
    }
  };

  const startTicking = () => {
    if (!isStopped) {
      tick();
    }
  };
  const idleCallbackId =
    "requestIdleCallback" in window
      ? window.requestIdleCallback(startTicking, {
          timeout: FIRST_TICK_IDLE_TIMEOUT_MS,
        })
      : null;
  const timeoutId =
    idleCallbackId === null
      ? window.setTimeout(startTicking, FIRST_TICK_IDLE_TIMEOUT_MS)
      : null;

  // Breakpoint flips can make previously ineligible groups relevant.
  const handleViewportChange = () => {
    tick();
  };

  desktopQuery.addEventListener("change", handleViewportChange);

  return () => {
    isStopped = true;
    desktopQuery.removeEventListener("change", handleViewportChange);

    if (idleCallbackId !== null) {
      window.cancelIdleCallback(idleCallbackId);
    }

    if (timeoutId !== null) {
      window.clearTimeout(timeoutId);
    }
  };
}
