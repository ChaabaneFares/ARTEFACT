"use client";

import { useEffect } from "react";
import scrollManager from "@/lib/scrollInteraction/scrollManager";
import {
  createRAFBatch,
  kickScroll,
} from "@/lib/scrollInteraction/scrollTrigger";
import { dimensionsStore } from "@/store/dimensionsStore";

const HERO_ROOT_SELECTOR = "[data-hero-root]";
const HERO_STICKY_AREA_SELECTOR = "[data-hero-sticky-area]";
const HERO_TITLE_SELECTOR = "[data-hero-title]";
const HERO_COPY_SELECTOR = "[data-hero-copy]";
const HERO_SCROLL_LAYER_SELECTOR = "[data-hero-scroll-layer]";
const HERO_VIDEO_SELECTOR = "[data-hero-video]";
const HERO_TIMELINE_DURATION = 18;
const HERO_TITLE_START = 5.5 / HERO_TIMELINE_DURATION;
const HERO_TITLE_END = 9.5 / HERO_TIMELINE_DURATION;
const HERO_COPY_START = 10.5 / HERO_TIMELINE_DURATION;
const HERO_COPY_END = 16.5 / HERO_TIMELINE_DURATION;
const HERO_SCROLL_INSTANCE_ID = "hero-scroll";

const rafBatch = createRAFBatch();

function clamp01(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.max(0, Math.min(1, value));
}

function formatNumber(value: number): string {
  return Number(value.toFixed(3)).toString();
}

function lerp(from: number, to: number, progress: number): number {
  return from + (to - from) * progress;
}

function easeOutQuad(progress: number): number {
  return 1 - (1 - progress) * (1 - progress);
}

function resolveHeroProgress(scrollArea: HTMLElement): number {
  const rect = scrollArea.getBoundingClientRect();
  const scrollDistance = Math.max(
    scrollArea.offsetHeight - window.innerHeight,
    1,
  );

  return clamp01(-rect.top / scrollDistance);
}

function applyPinnedState(root: HTMLElement, scrollArea: HTMLElement) {
  const rect = scrollArea.getBoundingClientRect();
  const scrollDistance = Math.max(
    scrollArea.offsetHeight - window.innerHeight,
    0,
  );

  if (rect.top > 0) {
    root.style.position = "absolute";
    root.style.top = "0px";
    root.style.left = "";
    root.style.right = "";
    root.style.width = "";
    return;
  }

  if (rect.bottom <= window.innerHeight) {
    root.style.position = "absolute";
    root.style.top = `${formatNumber(scrollDistance)}px`;
    root.style.left = "";
    root.style.right = "";
    root.style.width = "";
    return;
  }

  root.style.position = "fixed";
  root.style.top = "0px";
  root.style.left = "0px";
  root.style.right = "0px";
  root.style.width = "100%";
}

function initHeroAnimation(_vw: number): (() => void) | null {
  const root = document.querySelector<HTMLElement>(HERO_ROOT_SELECTOR);
  const scrollArea = document.querySelector<HTMLElement>(
    HERO_STICKY_AREA_SELECTOR,
  );
  const title = root?.querySelector<HTMLElement>(HERO_TITLE_SELECTOR);
  const copy = root?.querySelector<HTMLElement>(HERO_COPY_SELECTOR);
  const copyItems = [
    ...Array.from(copy?.querySelectorAll<HTMLElement>("h6, h3") ?? []),
    copy?.querySelector<HTMLElement>(".btn-container"),
  ].filter((item): item is HTMLElement => Boolean(item));
  const scrollLayer = root?.querySelector<HTMLElement>(
    HERO_SCROLL_LAYER_SELECTOR,
  );
  const video = root?.querySelector<HTMLVideoElement>(HERO_VIDEO_SELECTOR);

  if (!root || !scrollArea || !title || !copy || !scrollLayer) {
    return null;
  }

  const applyScrollTransforms = () => {
    applyPinnedState(root, scrollArea);

    const progress = resolveHeroProgress(scrollArea);
    const titleProgress = clamp01(
      (progress - HERO_TITLE_START) / (HERO_TITLE_END - HERO_TITLE_START),
    );
    const copyProgress = clamp01(
      (progress - HERO_COPY_START) / (HERO_COPY_END - HERO_COPY_START),
    );
    const easedScrollProgress = easeOutQuad(progress);
    const easedTitleProgress = easeOutQuad(titleProgress);
    const easedCopyProgress = easeOutQuad(copyProgress);

    scrollLayer.style.opacity = formatNumber(lerp(0, 1, easedScrollProgress));
    title.style.opacity = formatNumber(lerp(1, 0, easedTitleProgress));
    title.style.transform = `translate3d(0, ${formatNumber(
      lerp(0, -20, easedTitleProgress),
    )}px, 0)`;
    copyItems.forEach((item) => {
      item.style.opacity = formatNumber(easedCopyProgress);
      item.style.transform = `translate3d(0, ${formatNumber(
        lerp(20, 0, easedCopyProgress),
      )}px, 0)`;
    });

    if (video) {
      if (progress >= 1 && !video.paused) {
        video.pause();
      } else if (progress < 1 && video.paused) {
        void video.play().catch(() => {});
      }
    }
  };

  const requestUpdate = () => {
    rafBatch.schedule("hero-scroll-frame", () => {
      applyScrollTransforms();
    });
  };

  requestUpdate();
  scrollManager.createInstance(HERO_SCROLL_INSTANCE_ID, requestUpdate, {
    useRAF: false,
  });
  window.addEventListener("resize", requestUpdate, { passive: true });

  return () => {
    scrollManager.removeInstance(HERO_SCROLL_INSTANCE_ID);
    window.removeEventListener("resize", requestUpdate);
    rafBatch.cancel("hero-scroll-frame");
    root.style.position = "";
    root.style.top = "";
    root.style.left = "";
    root.style.right = "";
    root.style.width = "";
    scrollLayer.style.opacity = "";
    title.style.opacity = "";
    title.style.transform = "";
    copyItems.forEach((item) => {
      item.style.opacity = "";
      item.style.transform = "";
    });
  };
}

export default function HeroAnimate() {
  const { vw } = dimensionsStore();

  useEffect(() => {
    const cleanup = initHeroAnimation(vw);

    kickScroll();

    return () => {
      cleanup?.();
    };
  }, [vw]);

  return null;
}
