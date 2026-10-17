import { createBatchStyleSetter } from "@/lib/scrollInteraction/createSmartStyleSetter";
import scrollManager from "@/lib/scrollInteraction/scrollManager";
import { kickScroll } from "@/lib/scrollInteraction/scrollTrigger";

export function mountFaqEffects() {
  const root = document.querySelector<HTMLElement>("[data-faq-page]");
  const hero = root?.querySelector<HTMLElement>("[data-faq-hero]");
  const content = root?.querySelector<HTMLElement>("[data-faq-hero-content]");
  const dark = root?.querySelector<HTMLElement>("[data-faq-hero-dark]");
  const fade = root?.querySelector<HTMLElement>("[data-faq-mobile-fade]");
  if (!root || !hero || !content || !dark) return () => {};
  const styles = createBatchStyleSetter();
  const media = window.matchMedia("(prefers-reduced-motion: reduce)");
  let heroTop = 0;
  let heroHeight = 1;
  let mobile = false;
  const update = () => {
    const progress = Math.min(
      1,
      Math.max(0, window.scrollY / (window.innerHeight * 0.4)),
    );
    styles.set(
      content,
      "transform",
      mobile || media.matches ? "" : `translate3d(0, ${window.scrollY}px, 0)`,
    );
    styles.set(
      dark,
      "opacity",
      mobile || media.matches ? "0" : String(1 - (1 - progress) ** 2),
    );
    if (fade)
      styles.set(
        fade,
        "opacity",
        fade.dataset.dismissed === "true" || media.matches
          ? "0"
          : String(
              0.7 *
                (1 -
                  Math.min(
                    1,
                    Math.max(
                      0,
                      (window.scrollY - heroTop) / (heroHeight * 0.5),
                    ),
                  )) **
                  2,
            ),
      );
  };
  const measure = () => {
    const bounds = hero.getBoundingClientRect();
    heroTop = bounds.top + window.scrollY;
    heroHeight = bounds.height;
    mobile = window.innerWidth <= 768;
    update();
  };
  measure();
  scrollManager.createInstance("faq:hero-fade", update, { useRAF: true });
  const observer = new ResizeObserver(measure);
  observer.observe(hero);
  const fadeObserver = new MutationObserver(update);
  if (fade)
    fadeObserver.observe(fade, {
      attributes: true,
      attributeFilter: ["data-dismissed"],
    });
  window.addEventListener("resize", measure);
  media.addEventListener("change", update);
  kickScroll();
  return () => {
    scrollManager.removeInstance("faq:hero-fade");
    observer.disconnect();
    fadeObserver.disconnect();
    window.removeEventListener("resize", measure);
    media.removeEventListener("change", update);
    dark.style.removeProperty("opacity");
    content.style.removeProperty("transform");
    fade?.style.removeProperty("opacity");
  };
}
