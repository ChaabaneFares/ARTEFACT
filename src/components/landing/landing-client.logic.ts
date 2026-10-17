"use client";

import { useEffect } from "react";
import type { Locale } from "@/i18n/routing";
import { buildLandingMediaPreloadManifest } from "@/lib/landing3d/landingAssets";
import {
  startLandingMediaScheduler,
  whenLandingMediaNearIdle,
} from "@/lib/landing3d/mediaScheduler";
import { startScenePreboot } from "@/lib/landing3d/sceneBootGate";
import { createBatchStyleSetter } from "@/lib/scrollInteraction/createSmartStyleSetter";
import scrollManager from "@/lib/scrollInteraction/scrollManager";
import {
  createRAFBatch,
  kickScroll,
} from "@/lib/scrollInteraction/scrollTrigger";

const SECTION_NOISE_OVERLAY_SELECTOR = "[data-section-noise-overlay]";
const SECTION_NOISE_SCROLL_ID = "landing-section-noise-overlay";
const SECTION_NOISE_MIN_FADE_DISTANCE = 180;
const SECTION_NOISE_FADE_VIEWPORT_RATIO = 0.18;
const SCENE_PREBOOT_MAX_DELAY_MS = 3000;
const sectionNoiseStyleSetter = createBatchStyleSetter();
const sectionNoiseRafBatch = createRAFBatch();

function clamp01(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.max(0, Math.min(1, value));
}

function formatOpacity(value: number): string {
  return Number(value.toFixed(3)).toString();
}

export function useLandingClient(locale: Locale) {
  useEffect(
    () => startLandingMediaScheduler(buildLandingMediaPreloadManifest(locale)),
    [locale],
  );

  // As soon as the user's own screen is served, warm every 3D scene one at a
  // time (the boot gate still waits for a pause in scrolling), so scenes are
  // ready before the user reaches them instead of booting mid-scroll and
  // freezing Lenis. The timeout keeps slow connections from delaying 3D
  // behind far-away image frames.
  useEffect(() => {
    let isCancelled = false;

    const beginPreboot = () => {
      if (!isCancelled) {
        startScenePreboot();
      }
    };
    const prebootTimerId = window.setTimeout(
      beginPreboot,
      SCENE_PREBOOT_MAX_DELAY_MS,
    );

    void whenLandingMediaNearIdle().then(beginPreboot);

    return () => {
      isCancelled = true;
      window.clearTimeout(prebootTimerId);
    };
  }, []);

  useEffect(() => {
    const overlay = document.querySelector<HTMLElement>(
      SECTION_NOISE_OVERLAY_SELECTOR,
    );
    const process = document.getElementById("process");

    if (!overlay || !process) {
      return;
    }

    const updateOverlay = () => {
      const fadeDistance = Math.max(
        SECTION_NOISE_MIN_FADE_DISTANCE,
        window.innerHeight * SECTION_NOISE_FADE_VIEWPORT_RATIO,
      );
      const processRect = process.getBoundingClientRect();
      const fadeInProgress = clamp01(
        (window.innerHeight - processRect.top) / fadeDistance,
      );
      const fadeOutProgress = clamp01(processRect.bottom / fadeDistance);
      const opacity = Math.min(fadeInProgress, fadeOutProgress);
      const isVisible = opacity > 0.001;

      sectionNoiseStyleSetter.set(
        overlay,
        "opacity",
        isVisible ? formatOpacity(opacity) : "0",
      );
      sectionNoiseStyleSetter.set(
        overlay,
        "visibility",
        isVisible ? "visible" : "hidden",
      );
    };
    const scheduleOverlayUpdate = () => {
      sectionNoiseRafBatch.schedule(
        `${SECTION_NOISE_SCROLL_ID}-frame`,
        updateOverlay,
      );
    };

    scrollManager.createInstance(
      SECTION_NOISE_SCROLL_ID,
      scheduleOverlayUpdate,
      {
        useRAF: false,
      },
    );
    window.addEventListener("resize", scheduleOverlayUpdate, { passive: true });
    scheduleOverlayUpdate();
    kickScroll();

    return () => {
      scrollManager.removeInstance(SECTION_NOISE_SCROLL_ID);
      sectionNoiseRafBatch.cancel(`${SECTION_NOISE_SCROLL_ID}-frame`);
      window.removeEventListener("resize", scheduleOverlayUpdate);
      sectionNoiseStyleSetter.set(overlay, "opacity", "");
      sectionNoiseStyleSetter.set(overlay, "visibility", "");
    };
  }, []);
}
