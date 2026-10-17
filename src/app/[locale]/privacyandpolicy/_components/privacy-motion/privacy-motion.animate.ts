import { createBatchStyleSetter } from "@/lib/scrollInteraction/createSmartStyleSetter";
import scrollManager from "@/lib/scrollInteraction/scrollManager";
import { kickScroll } from "@/lib/scrollInteraction/scrollTrigger";

export function mountPrivacyMotion() {
  const content = document.querySelector<HTMLElement>("[data-privacy-content]");
  const elements = Array.from(
    content?.querySelectorAll<HTMLElement>("[data-privacy-parallax]") ?? [],
  );
  if (!content || !elements.length) return () => {};
  const media = window.matchMedia("(prefers-reduced-motion: reduce)");
  const setter = createBatchStyleSetter();
  const items = elements.map((element) => ({
    element,
    speed: Number(element.dataset.privacyParallax) * 0.1,
    top: 0,
    height: 0,
    y: 0,
  }));
  const update = () => {
    for (const item of items) {
      const position = item.top - window.scrollY;
      if (window.innerWidth <= 768 || media.matches) item.y = 0;
      else if (position < window.innerHeight && position + item.height > 0)
        item.y =
          (position + item.height * 0.5 - window.innerHeight * 0.5) *
          item.speed;
      setter.set(item.element, "transform", `translate3d(0, ${item.y}px, 0)`);
    }
  };
  const measure = () => {
    for (const item of items) {
      const rect = item.element.getBoundingClientRect();
      item.top = rect.top + window.scrollY - item.y;
      item.height = rect.height;
    }
    update();
  };
  measure();
  scrollManager.createInstance("privacy:content-parallax", update, {
    useRAF: true,
  });
  const observer = new ResizeObserver(measure);
  observer.observe(content);
  window.addEventListener("resize", measure);
  media.addEventListener("change", update);
  kickScroll();
  return () => {
    scrollManager.removeInstance("privacy:content-parallax");
    observer.disconnect();
    window.removeEventListener("resize", measure);
    media.removeEventListener("change", update);
    for (const item of items) item.element.style.removeProperty("transform");
  };
}
