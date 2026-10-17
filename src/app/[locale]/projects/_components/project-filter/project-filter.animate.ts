"use client";

export function animateProjectFilter(
  ripple: HTMLSpanElement,
  reveal: boolean,
  first: boolean,
  active: boolean,
  hovered: boolean,
) {
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const animation = ripple.animate(
    reveal
      ? [
          {
            transform: "translateY(-100%)",
            borderRadius: "50px",
            opacity: 1,
          },
          { transform: "translateY(0)", borderRadius: "0px", opacity: 1 },
        ]
      : [
          { transform: "translateY(0)", borderRadius: "0px", opacity: 1 },
          { transform: "translateY(101%)", borderRadius: "50px", opacity: 1 },
        ],
    {
      duration: reduced ? 0 : 500,
      delay: first && active && !hovered && !reduced ? 300 : 0,
      easing: "cubic-bezier(0.333333, 0.666667, 0.666667, 1)",
      fill: "forwards",
    },
  );
  return () => animation.cancel();
}
