"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { createBatchStyleSetter } from "@/lib/scrollInteraction/createSmartStyleSetter";
import { createRAFBatch } from "@/lib/scrollInteraction/optimizations";
import scrollManager from "@/lib/scrollInteraction/scrollManager";
import { kickScroll } from "@/lib/scrollInteraction/scrollTrigger";
import { dimensionsStore } from "@/store/dimensionsStore";

const clamp01 = (value: number) => Math.max(0, Math.min(1, value));
const easeOut = (value: number, power = 2) => 1 - (1 - clamp01(value)) ** power;

type Range = { top: number; height: number };

export function useAboutAnimation() {
  const pathname = usePathname();
  const { vw } = dimensionsStore();
  useEffect(() => {
    const root = document.querySelector<HTMLElement>("[data-about-page]");
    if (!root || !vw) return;
    const title = root.querySelector<HTMLElement>("[data-about-title]");
    const eyebrow = root.querySelector<HTMLElement>("[data-about-eyebrow]");
    const introduction = root.querySelector<HTMLElement>(
      "[data-about-introduction]",
    );
    const dark = root.querySelector<HTMLElement>("[data-about-dark]");
    const members = root.querySelector<HTMLElement>("[data-about-members]");
    const photos = [
      ...root.querySelectorAll<HTMLElement>("[data-about-photo]"),
    ];
    const rows = [...root.querySelectorAll<HTMLElement>("[data-about-row]")];
    const statements = [
      ...root.querySelectorAll<HTMLElement>("[data-about-statement]"),
    ];
    if (!title || !introduction || !dark || !members || photos.length !== 2) {
      return;
    }

    const setter = createBatchStyleSetter();
    const raf = createRAFBatch();
    const key = `about-${pathname}`;
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let reducedMotion = motion.matches;
    const mobile = vw <= 768;
    const inlineDirection = document.documentElement.dir === "rtl" ? -1 : 1;
    let vh = window.innerHeight;
    let photoRanges: Range[] = [];
    let memberRange: Range = { top: 0, height: 1 };
    let statementRanges: Range[] = [];

    const update = () => {
      const y = window.scrollY;
      const first = photoRanges[0];
      const second = photoRanges[1];
      if (!first || !second) return;
      const memberProgress = clamp01(
        (y - Math.round(memberRange.top - memberRange.height * 0.05 - vh)) /
          (Math.round(memberRange.top + memberRange.height * 1.05) -
            Math.round(memberRange.top - memberRange.height * 0.05 - vh)),
      );
      rows.forEach((row, index) => {
        setter.set(
          row,
          "transform",
          reducedMotion
            ? "none"
            : `translateX(${inlineDirection * (index === 0 ? -5 : 5) * (1 - memberProgress * 2)}%)`,
        );
      });

      let introOpacity = 0;
      let cover = 0;
      if (mobile) {
        cover =
          y >= Math.round(first.top + first.height * 0.1 + 20 - vh * 0.2)
            ? 1
            : 0;
        introOpacity = cover;
        setter.set(title, "opacity", cover ? "0" : "1");
        if (eyebrow) setter.set(eyebrow, "opacity", cover ? "0" : "1");
        photos.forEach((photo) => {
          setter.set(
            photo,
            "transform",
            reducedMotion ? "none" : "translateY(10%)",
          );
        });
      } else {
        // Reference trigger ranges use the initial, scaled image bounds.
        const start = Math.round(first.top + first.height * 1.5 * 0.17 - vh);
        const end = Math.round(first.top + first.height * 1.5 * 0.8);
        const time = clamp01((y - start) / (end - start)) * 13.3;
        setter.set(
          photos[0],
          "transform",
          `scale(${reducedMotion ? 1 : 1.5 - 0.5 * easeOut(time / 8)})`,
        );
        cover = time >= 5 ? 1 : 0;
        introOpacity = cover * (1 - easeOut((time - 10) / 3.3));
        const secondTime =
          clamp01(
            (y - Math.round(second.top - vh)) /
              (Math.round(second.top + second.height * 1.5 * 0.3) -
                Math.round(second.top - vh)),
          ) * 8;
        setter.set(
          photos[1],
          "transform",
          `scale(${reducedMotion ? 1 : 1.5 - 0.5 * easeOut(secondTime / 6)})`,
        );
        setter.set(
          photos[1],
          "opacity",
          `${1 - easeOut((secondTime - 6) / 2)}`,
        );
      }
      const memberFade =
        1 - easeOut((memberProgress * 20 - (mobile ? 5 : 4)) / 3.3);
      setter.set(introduction, "opacity", `${introOpacity * memberFade}`);
      setter.set(dark, "opacity", `${cover}`);

      statements.forEach((statement, index) => {
        const range = statementRanges[index];
        const progress = clamp01(
          (y - Math.round(range.top + range.height / 2 - vh)) / vh,
        );
        const opacity =
          progress < 0.3
            ? (progress / 0.3) ** 3
            : progress > 0.7
              ? (1 - (progress - 0.7) / 0.3) ** 3
              : 1;
        setter.set(statement, "opacity", `${opacity}`);
      });
    };

    const measure = () => {
      vh = window.innerHeight;
      // offsetTop/offsetHeight exclude the transforms owned by this controller.
      const rootTop = root.getBoundingClientRect().top + window.scrollY;
      photoRanges = photos.map((photo) => ({
        top: rootTop + photo.offsetTop,
        height: photo.offsetHeight,
      }));
      memberRange = {
        top: rootTop + members.offsetTop,
        height: members.offsetHeight,
      };
      statementRanges = statements.map((statement) => ({
        top:
          rootTop +
          (statement.parentElement?.offsetTop ?? 0) +
          statement.offsetTop,
        height: statement.offsetHeight,
      }));
      update();
    };
    const scheduleMeasure = () => raf.schedule(`${key}-measure`, measure);
    const changeMotion = () => {
      reducedMotion = motion.matches;
      update();
    };
    const observer = new ResizeObserver(scheduleMeasure);
    observer.observe(root);
    motion.addEventListener("change", changeMotion);
    window.addEventListener("resize", scheduleMeasure);
    scrollManager.createInstance(key, update, { useRAF: true });
    measure();
    kickScroll();

    return () => {
      scrollManager.removeInstance(key);
      observer.disconnect();
      raf.cancelAll();
      motion.removeEventListener("change", changeMotion);
      window.removeEventListener("resize", scheduleMeasure);
      [...photos, ...rows].forEach((element) => {
        element.style.transform = "";
        element.style.opacity = "";
      });
      [title, eyebrow, introduction, dark, ...statements].forEach((element) => {
        if (element) element.style.opacity = "";
      });
      setter.clearAll();
    };
  }, [pathname, vw]);
}
