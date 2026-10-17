"use client";

export function mountFooterButtonMotion(button: HTMLAnchorElement) {
  const move = (event: MouseEvent) => {
    if (
      window.innerWidth <= 1024 ||
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
  const leave = () => {
    button.style.transform = "none";
  };
  button.addEventListener("mousemove", move);
  button.addEventListener("mouseleave", leave);
  return () => {
    button.removeEventListener("mousemove", move);
    button.removeEventListener("mouseleave", leave);
    button.style.transform = "none";
  };
}
