"use client";

const RIPPLE_EASING = "cubic-bezier(0.333333333, 0.666666667, 0.666666667, 1)";

export function mountVSliderCtaMotion(button: HTMLAnchorElement) {
  const ripple = button.querySelector<HTMLSpanElement>("[data-cta-ripple]");
  let animation: Animation | null = null;
  const animateRipple = (entering: boolean) => {
    if (!ripple) return;
    const current = getComputedStyle(ripple);
    const from = entering
      ? { transform: "translateY(-100%)", borderRadius: "50px" }
      : { transform: current.transform, borderRadius: current.borderRadius };
    animation?.cancel();
    ripple.style.opacity = "1";
    const to = {
      transform: `translateY(${entering ? 0 : 100}%)`,
      borderRadius: entering ? "0px" : "50px",
    };
    animation = ripple.animate([from, to], {
      duration: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? 0
        : 500,
      easing: RIPPLE_EASING,
      fill: "forwards",
    });
  };
  const enter = () => animateRipple(true);
  const blur = () => animateRipple(false);
  const leave = () => {
    animateRipple(false);
    button.style.transform = "none";
  };
  const move = (event: MouseEvent) => {
    if (
      window.innerWidth <= 1024 ||
      button.closest("[data-cta-mouse-area]") ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    )
      return;
    const { left, top, width, height } = button.getBoundingClientRect();
    const x = Math.max(
      -width / 10,
      Math.min(width / 10, event.clientX - left - width / 2),
    );
    const y = Math.max(
      -height / 10,
      Math.min(height / 10, event.clientY - top - height / 2),
    );
    button.style.transform = `translate3d(${x}px, ${y}px, 0)`;
  };
  button.addEventListener("mouseenter", enter);
  button.addEventListener("mouseleave", leave);
  button.addEventListener("mousemove", move);
  button.addEventListener("focus", enter);
  button.addEventListener("blur", blur);
  if (button.matches(":hover") || document.activeElement === button) enter();
  return () => {
    button.removeEventListener("mouseenter", enter);
    button.removeEventListener("mouseleave", leave);
    button.removeEventListener("mousemove", move);
    button.removeEventListener("focus", enter);
    button.removeEventListener("blur", blur);
    animation?.cancel();
    button.style.transform = "none";
  };
}
