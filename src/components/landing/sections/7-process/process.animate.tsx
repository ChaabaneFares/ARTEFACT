"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import {
  getProcessRootSelector,
  PROCESS_CARD_CONTENT_SELECTOR,
  PROCESS_CARD_SELECTOR,
  PROCESS_ILLUSTRATION_SELECTOR,
} from "@/lib/landingProcess/process.shared";
import { getProcessSceneController } from "@/lib/landingProcess/processSceneController";
import { createDOMCache } from "@/lib/scrollInteraction/createDOMCache";
import { createInstanceRegistry } from "@/lib/scrollInteraction/createInstanceRegistry";
import { createBatchStyleSetter } from "@/lib/scrollInteraction/createSmartStyleSetter";
import scrollManager from "@/lib/scrollInteraction/scrollManager";
import {
  createRAFBatch,
  getScrollTrigger,
  kickScroll,
  refreshScrollMeasurements,
} from "@/lib/scrollInteraction/scrollTrigger";
import { dimensionsStore } from "@/store/dimensionsStore";

const activeInstances = createInstanceRegistry();
const domCache = createDOMCache();
const styleSetter = createBatchStyleSetter();
const rafBatch = createRAFBatch();

const FIRST_PROCESS_SCROLL_ROTATION_RANGE = [-0.5, 0.25] as const;
const PROCESS_SCROLL_ROTATION_RANGE = [0, 0.5] as const;
const PROCESS_SCROLL_START_POINT = [0] as const;
const PROCESS_SCROLL_END_POINT = [0] as const;
const PROCESS_CARD_START_X_PERCENT = 100;
const PROCESS_CONTENT_START_X_PERCENT = -87;
const PROCESS_ILLUSTRATION_START_X_PERCENT = 100;
const PROCESS_DESKTOP_BREAKPOINT = 768;

type ProcessAnimateProps = {
  sectionId: string;
};

type ProcessCardRef = {
  content: HTMLElement;
  element: HTMLElement;
  end: number;
  index: number;
  inlineDirection: number;
  illustration: HTMLElement;
  sceneId: string;
  start: number;
};

type ProcessDomRefs = {
  cards: ProcessCardRef[];
  root: HTMLElement;
};

type ProcessAnimationSession = {
  instanceIds: string[];
  rafKeys: string[];
  scrollIds: string[];
};

let cachedDomRefs: ProcessDomRefs | null = null;

function clamp01(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.max(0, Math.min(1, value));
}

function lerp(from: number, to: number, progress: number): number {
  return from + (to - from) * progress;
}

function formatPercent(value: number): string {
  return Number(value.toFixed(3)).toString();
}

function measureCardRange(element: HTMLElement): {
  end: number;
  start: number;
} {
  const rect = element.getBoundingClientRect();
  const absoluteTop = rect.top + window.scrollY;
  const start = absoluteTop - window.innerHeight;

  return {
    start,
    end: absoluteTop,
  };
}

function resolveCardProgress(card: ProcessCardRef): number {
  const distance = card.end - card.start;

  if (distance <= 0) {
    return window.scrollY >= card.end ? 1 : 0;
  }

  return clamp01((window.scrollY - card.start) / distance);
}

function applyCardTransforms(card: ProcessCardRef, progress: number) {
  const direction = (card.index % 2 === 0 ? 1 : -1) * card.inlineDirection;
  const cardTranslate = lerp(
    PROCESS_CARD_START_X_PERCENT * direction,
    0,
    progress,
  );
  const contentTranslate = lerp(
    PROCESS_CONTENT_START_X_PERCENT * direction,
    0,
    progress,
  );

  styleSetter.set(
    card.element,
    "transform",
    `translate3d(${formatPercent(cardTranslate)}%, 0, 0)`,
  );
  styleSetter.set(
    card.content,
    "transform",
    `translate3d(${formatPercent(contentTranslate)}%, 0, 0)`,
  );
}

function resetCardTransforms(cards: ProcessCardRef[]) {
  cards.forEach((card) => {
    styleSetter.set(card.element, "transform", "");
    styleSetter.set(card.content, "transform", "");
    styleSetter.set(card.illustration, "transform", "");
  });
}

function updateCardMeasurements(cards: ProcessCardRef[]) {
  cards.forEach((card) => {
    const { end, start } = measureCardRange(card.element);

    card.start = start;
    card.end = end;
  });
  refreshScrollMeasurements();
}

function updateCardTransforms(cards: ProcessCardRef[], isDesktop: boolean) {
  cards.forEach((card) => {
    const progress = resolveCardProgress(card);

    if (isDesktop) {
      applyCardTransforms(card, progress);
      return;
    }

    const direction = (card.index % 2 === 0 ? -1 : 1) * card.inlineDirection;
    const translate = lerp(
      PROCESS_ILLUSTRATION_START_X_PERCENT * direction,
      0,
      progress,
    );

    styleSetter.set(
      card.illustration,
      "transform",
      `translateX(${formatPercent(translate)}%)`,
    );
  });
}

function getCachedDomRefs(sectionId: string): ProcessDomRefs | null {
  if (
    cachedDomRefs &&
    document.contains(cachedDomRefs.root) &&
    cachedDomRefs.cards.every(
      ({ content, element, illustration }) =>
        document.contains(element) &&
        document.contains(content) &&
        document.contains(illustration),
    )
  ) {
    return cachedDomRefs;
  }

  const root = domCache.get<HTMLElement>(`process-${sectionId}-root`, () =>
    document.querySelector<HTMLElement>(getProcessRootSelector(sectionId)),
  );

  if (!root) {
    return null;
  }

  const inlineDirection = document.documentElement.dir === "rtl" ? -1 : 1;
  const cards = Array.from(
    root.querySelectorAll<HTMLElement>(PROCESS_CARD_SELECTOR),
  )
    .map((element, index) => {
      const sceneId = element.dataset.processSceneMount;
      const content = element.querySelector<HTMLElement>(
        PROCESS_CARD_CONTENT_SELECTOR,
      );
      const illustration = element.querySelector<HTMLElement>(
        PROCESS_ILLUSTRATION_SELECTOR,
      );

      if (!sceneId || !content || !illustration) {
        return null;
      }

      const { end, start } = measureCardRange(element);

      return {
        content,
        element,
        end,
        index,
        inlineDirection,
        illustration,
        sceneId,
        start,
      };
    })
    .filter((card): card is ProcessCardRef => card !== null);

  if (cards.length === 0) {
    return null;
  }

  cachedDomRefs = {
    root,
    cards,
  };

  return cachedDomRefs;
}

function clearCachedDomRefs() {
  cachedDomRefs = null;
  domCache.clear();
}

function cleanupProcessAnimations(
  session: ProcessAnimationSession | null,
  sectionId: string,
) {
  const trigger = getScrollTrigger();
  const refs = getCachedDomRefs(sectionId);

  session?.rafKeys.forEach((key) => {
    rafBatch.cancel(key);
  });

  session?.scrollIds.forEach((id) => {
    scrollManager.removeInstance(id);
  });

  session?.instanceIds.forEach((id) => {
    activeInstances.remove(id);

    try {
      trigger?.removeInstance(id);
    } catch (_) {
      // no-op
    }
  });

  if (refs) {
    resetCardTransforms(refs.cards);
  }

  clearCachedDomRefs();
}

function initProcessAnimations(
  pathname: string,
  vw: number,
  sectionId: string,
): ProcessAnimationSession | null {
  if (typeof window === "undefined") {
    return null;
  }

  const refs = getCachedDomRefs(sectionId);
  const trigger = getScrollTrigger();

  if (!refs) {
    return null;
  }

  const instanceIds: string[] = [];
  const rafKeys: string[] = [];
  const scrollIds: string[] = [];
  const isDesktop = vw > PROCESS_DESKTOP_BREAKPOINT;

  updateCardMeasurements(refs.cards);

  const cardScrollId = `process-cards-${pathname}-${sectionId}-${vw}`;
  const cardRafKey = `${cardScrollId}-frame`;
  const updateCards = () => {
    rafBatch.schedule(cardRafKey, () => {
      updateCardTransforms(refs.cards, isDesktop);
    });
  };

  scrollManager.createInstance(cardScrollId, updateCards, {
    useRAF: false,
  });

  scrollIds.push(cardScrollId);
  rafKeys.push(cardRafKey);
  updateCards();

  if (!trigger) {
    if (scrollIds.length === 0) {
      return null;
    }

    return {
      instanceIds,
      rafKeys,
      scrollIds,
    };
  }

  for (const { element, index, sceneId } of refs.cards) {
    const instanceId = `process-scroll-${pathname}-${sceneId}-${vw}`;
    const rafKey = `${instanceId}-frame`;
    const rotationRange =
      index === 0
        ? FIRST_PROCESS_SCROLL_ROTATION_RANGE
        : PROCESS_SCROLL_ROTATION_RANGE;

    const instance = trigger.createInstance(instanceId, element, {
      values: [[...rotationRange]],
      startPoint: [...PROCESS_SCROLL_START_POINT],
      endPoint: [...PROCESS_SCROLL_END_POINT],
      callback: ({ v }) => {
        rafBatch.schedule(rafKey, () => {
          const controller = getProcessSceneController(sceneId);

          controller?.setScrollRotationX(v[0] ?? 0);
        });
      },
    });

    if (!instance) {
      continue;
    }

    activeInstances.add(instanceId, instance);
    instanceIds.push(instanceId);
    rafKeys.push(rafKey);
  }

  if (instanceIds.length === 0 && scrollIds.length === 0) {
    return null;
  }

  return {
    instanceIds,
    rafKeys,
    scrollIds,
  };
}

export default function ProcessAnimate({ sectionId }: ProcessAnimateProps) {
  const pathname = usePathname();
  const { vw } = dimensionsStore();

  useEffect(() => {
    const session = initProcessAnimations(pathname ?? "landing", vw, sectionId);
    const refreshMobileMeasurements = () => {
      const refs = getCachedDomRefs(sectionId);

      if (refs) {
        updateCardMeasurements(refs.cards);
        updateCardTransforms(refs.cards, false);
      }
    };
    // Keep the entrance range correct after lazy content loads or the viewport
    // height changes without crossing a width breakpoint.
    const resizeObserver =
      vw <= PROCESS_DESKTOP_BREAKPOINT
        ? new ResizeObserver(refreshMobileMeasurements)
        : null;

    if (resizeObserver) {
      resizeObserver.observe(document.documentElement);
      window.addEventListener("resize", refreshMobileMeasurements);
    }

    kickScroll();

    return () => {
      resizeObserver?.disconnect();
      window.removeEventListener("resize", refreshMobileMeasurements);
      cleanupProcessAnimations(session, sectionId);
    };
  }, [pathname, sectionId, vw]);

  return null;
}
