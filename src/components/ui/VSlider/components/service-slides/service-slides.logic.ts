"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import {
  activateCursorLabel,
  clearCursorBlend,
} from "@/components/ui/cursor/cursor.effects";
import { createBatchStyleSetter } from "@/lib/scrollInteraction/createSmartStyleSetter";
import { createRAFBatch } from "@/lib/scrollInteraction/optimizations";
import scrollManager from "@/lib/scrollInteraction/scrollManager";
import { kickScroll } from "@/lib/scrollInteraction/scrollTrigger";
import { dimensionsStore } from "@/store/dimensionsStore";
import styles from "./service-slides.module.css";

const clamp01 = (value: number) => Math.max(0, Math.min(1, value));

export function useServiceSlidesAnimation(sliderId: string) {
  const pathname = usePathname();
  const { vw } = dimensionsStore();
  useEffect(() => {
    const root = document.querySelector<HTMLElement>(
      `[data-vslider-id="${sliderId}"] [data-service-slides]`,
    );
    if (!root || !vw) return;
    const setter = createBatchStyleSetter();
    const raf = createRAFBatch();
    const layers = [
      ...root.querySelectorAll<HTMLElement>("[data-service-layer]"),
    ];
    const images = layers.map((layer) =>
      layer.querySelector<HTMLImageElement>("img"),
    );
    const pictures = [
      ...root.querySelectorAll<HTMLElement>(`.${styles.picture}`),
    ];
    const mobileImages = pictures.map((picture) =>
      picture.querySelector<HTMLImageElement>("img"),
    );
    // Measure once per viewport change. Scroll frames only calculate/write styles.
    let top = 0;
    let vh = window.innerHeight;
    let ranges: Array<{ top: number; height: number }> = [];
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    let reducedMotion = motionQuery.matches;
    const update = () => {
      if (vw > 768) {
        layers.forEach((layer, index) => {
          const progress = clamp01((window.scrollY - top - vh * index) / vh);
          setter.set(
            layer,
            "clipPath",
            index === layers.length - 1
              ? ""
              : `inset(0 0 ${progress * 100}% 0)`,
          );
          const image = images[index];
          if (image) {
            const previous =
              index === 0
                ? 0
                : clamp01((window.scrollY - top - vh * (index - 1)) / vh);
            const hasExit = index < layers.length - 1;
            const phaseCount = Number(index > 0) + Number(hasExit);
            const imageProgress =
              (previous + (hasExit ? progress : 0)) / Math.max(1, phaseCount);
            setter.set(
              image,
              "objectPosition",
              `center ${reducedMotion ? 50 : 50 + imageProgress * 10}%`,
            );
          }
        });
      } else {
        mobileImages.forEach((image, index) => {
          if (!image) return;
          const range = ranges[index];
          const progress = clamp01(
            (window.scrollY + vh - range.top) / (vh + range.height),
          );
          setter.set(
            image,
            "objectPosition",
            `center ${reducedMotion ? 50 : 50 + progress * 10}%`,
          );
        });
      }
    };
    const handleMotionChange = () => {
      reducedMotion = motionQuery.matches;
      update();
    };
    motionQuery.addEventListener("change", handleMotionChange);
    const id = `service-slides-${pathname}-${sliderId}`;
    scrollManager.createInstance(id, update, { useRAF: true });
    const measure = () => {
      vh = window.innerHeight;
      top = root.getBoundingClientRect().top + window.scrollY;
      ranges = pictures.map((picture) => {
        const rect = picture.getBoundingClientRect();
        return { top: rect.top + window.scrollY, height: rect.height };
      });
      update();
    };
    const scheduleMeasure = () => raf.schedule(`${id}-measure`, measure);
    const observer = new ResizeObserver(scheduleMeasure);
    observer.observe(root);
    window.addEventListener("resize", scheduleMeasure);
    // The label is rendered with the slide, in the page's language.
    const enter = (event: MouseEvent) =>
      activateCursorLabel({
        label: (event.currentTarget as HTMLElement).dataset.cursorLabel ?? "",
      });
    layers.forEach((layer) => {
      layer.addEventListener("mouseenter", enter);
      layer.addEventListener("mouseleave", clearCursorBlend);
    });
    measure();
    kickScroll();
    return () => {
      scrollManager.removeInstance(id);
      observer.disconnect();
      raf.cancelAll();
      motionQuery.removeEventListener("change", handleMotionChange);
      window.removeEventListener("resize", scheduleMeasure);
      layers.forEach((layer) => {
        layer.style.clipPath = "";
        layer.removeEventListener("mouseenter", enter);
        layer.removeEventListener("mouseleave", clearCursorBlend);
      });
      [...images, ...mobileImages].forEach((image) => {
        if (image) image.style.objectPosition = "";
      });
      clearCursorBlend();
      setter.clearAll();
    };
  }, [pathname, sliderId, vw]);
}
