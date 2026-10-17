"use client";

import { useEffect } from "react";
import { createBatchStyleSetter } from "@/lib/scrollInteraction/createSmartStyleSetter";
import scrollManager from "@/lib/scrollInteraction/scrollManager";
import { kickScroll } from "@/lib/scrollInteraction/scrollTrigger";
import { dimensionsStore } from "@/store/dimensionsStore";
import type { ProjectCategory } from "../project-catalog/project-catalog.types";

const clamp = (value: number) => Math.max(0, Math.min(1, value));

export function useProjectMotionAnimation(category: ProjectCategory) {
  const { vw } = dimensionsStore();
  useEffect(() => {
    const root = document.querySelector<HTMLElement>("[data-project-catalog]");
    const hero = root?.querySelector<HTMLElement>("[data-project-hero]");
    const gallery = root?.querySelector<HTMLElement>("[data-project-gallery]");
    const content = hero?.firstElementChild as HTMLElement | undefined;
    const cards = [
      ...(gallery?.querySelectorAll<HTMLElement>("[data-project-card]") ?? []),
    ];
    if (!root || !hero || !gallery || !content || !cards.length || !vw) return;
    root.dataset.projectCategory = category;
    const setter = createBatchStyleSetter();
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let reduced = motion.matches;
    let heroTop = 0;
    let heroHeight = 1;
    let contentLimit = 0;
    let rangeStart = 0;
    let rangeEnd = 1;
    let cardHeights: number[] = [];
    const update = () => {
      const scroll = window.scrollY;
      const linear = clamp((scroll - rangeStart) / (rangeEnd - rangeStart));
      const progress = 1 - (1 - linear) ** 2;
      if (vw > 768) {
        setter.set(
          hero,
          "opacity",
          reduced
            ? "1"
            : String(
                (1 -
                  clamp((scroll - heroTop) / Math.round(heroHeight * 0.65))) **
                  2,
              ),
        );
        setter.set(
          content,
          "transform",
          `translate3d(0, ${Math.max(0, Math.min(contentLimit, scroll - heroTop))}px, 0)`,
        );
        cards.forEach((card, index) => {
          setter.set(
            card,
            "transform",
            reduced
              ? ""
              : `translate3d(0, ${progress * cardHeights[index] * (index % 2 === 0 ? -0.7 : 0.6)}px, 0)`,
          );
        });
      } else {
        setter.set(hero, "opacity", "");
        setter.set(content, "transform", "");
        cards.forEach((card) => {
          setter.set(card, "transform", "");
        });
      }
    };
    const measure = () => {
      hero.style.opacity = "";
      content.style.transform = "";
      cards.forEach((card) => {
        card.style.transform = "";
      });
      const y = window.scrollY;
      const heroRect = hero.getBoundingClientRect();
      const contentRect = content.getBoundingClientRect();
      const galleryRect = gallery.getBoundingClientRect();
      heroTop = heroRect.top + y;
      heroHeight = heroRect.height;
      contentLimit = Math.max(0, heroRect.height - contentRect.height);
      cardHeights = cards.map((card) =>
        Number.parseFloat(getComputedStyle(card).height),
      );
      const firstTop =
        galleryRect.top +
        y +
        Number.parseFloat(getComputedStyle(gallery).paddingTop);
      rangeStart = Math.round(
        firstTop + cardHeights[0] / 2 - window.innerHeight,
      );
      rangeEnd = Math.round(galleryRect.bottom + y + galleryRect.height * 0.1);
      setter.clearAll();
      update();
    };
    const motionChange = () => {
      reduced = motion.matches;
      update();
    };
    const id = "project-catalog-motion";
    scrollManager.createInstance(id, update, { useRAF: true });
    const resize = new ResizeObserver(measure);
    resize.observe(gallery);
    resize.observe(hero);
    window.addEventListener("resize", measure);
    motion.addEventListener("change", motionChange);
    measure();
    kickScroll();
    return () => {
      scrollManager.removeInstance(id);
      resize.disconnect();
      window.removeEventListener("resize", measure);
      motion.removeEventListener("change", motionChange);
      hero.style.opacity = "";
      content.style.transform = "";
      cards.forEach((card) => {
        card.style.transform = "";
      });
    };
  }, [category, vw]);
}
