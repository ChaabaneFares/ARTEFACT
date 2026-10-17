"use client";

const SOURCE_EASING = "cubic-bezier(0.333333333, 0.666666667, 0.666666667, 1)";

export function mountServiceCtaMotion(area: HTMLDivElement) {
  let animation: Animation | null = null;
  const enabled = () =>
    window.innerWidth > 1024 &&
    !window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const animate = (x: number, y: number, duration: number) => {
    const from = getComputedStyle(area).transform;
    animation?.cancel();
    animation = area.animate(
      [{ transform: from }, { transform: `translate3d(${x}px, ${y}px, 0)` }],
      { duration, easing: SOURCE_EASING, fill: "forwards" },
    );
  };

  const move = (event: MouseEvent) => {
    if (!enabled() || !(event.target instanceof HTMLElement)) return;
    const target = event.target;
    if (!target.offsetWidth) return;
    const rect = target.getBoundingClientRect();
    const x =
      ((event.clientX - rect.left - target.offsetWidth / 2) /
        target.offsetWidth) *
      40;
    const y = 30 * ((event.clientY - rect.top) / 130 - 0.5);
    animate(x, y, 300);
  };

  const leave = () => {
    if (enabled()) animate(0, 0, 500);
    else animation?.cancel();
  };

  const desktop = window.matchMedia("(min-width: 1025px)");
  const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const reset = () => animation?.cancel();
  area.addEventListener("mousemove", move);
  area.addEventListener("mouseleave", leave);
  desktop.addEventListener("change", reset);
  motion.addEventListener("change", reset);
  return () => {
    area.removeEventListener("mousemove", move);
    area.removeEventListener("mouseleave", leave);
    desktop.removeEventListener("change", reset);
    motion.removeEventListener("change", reset);
    reset();
  };
}
