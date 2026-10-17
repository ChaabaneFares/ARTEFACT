"use client";

function canAnimatePointer() {
  return (
    window.innerWidth > 768 &&
    window.matchMedia("(hover: hover) and (pointer: fine)").matches &&
    !window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

export function mountMenuMotion(root: HTMLElement) {
  const animations = new Map<HTMLElement, Animation>();
  const animate = (element: HTMLElement, x: number, y: number) => {
    const from = getComputedStyle(element).transform;
    animations.get(element)?.cancel();
    const to = `translate(${x}px, ${y}px)`;
    element.style.transform = to;
    const animation = element.animate(
      [{ transform: from }, { transform: to }],
      { duration: 500, easing: "cubic-bezier(0.77, 0, 0.175, 1)" },
    );
    animations.set(element, animation);
  };
  const cleanups = [
    ...root.querySelectorAll<HTMLElement>("[data-menu-motion]"),
  ].map((control) => {
    const move = (event: MouseEvent) => {
      if (!canAnimatePointer()) return;
      const element = control.querySelector<HTMLElement>("span") ?? control;
      const rect = element.getBoundingClientRect();
      animate(
        element,
        ((event.clientX - rect.left - element.offsetWidth / 2) /
          element.offsetWidth) *
          30,
        ((event.clientY - rect.top - element.offsetHeight / 2) /
          element.offsetHeight) *
          20,
      );
    };
    const leave = () => {
      for (const target of [
        control,
        ...control.querySelectorAll<HTMLElement>("span"),
      ])
        if (target.style.transform) animate(target, 0, 0);
    };
    control.addEventListener("mousemove", move);
    control.addEventListener("mouseleave", leave);
    control.addEventListener("blur", leave);
    return () => {
      control.removeEventListener("mousemove", move);
      control.removeEventListener("mouseleave", leave);
      control.removeEventListener("blur", leave);
    };
  });
  return () => {
    cleanups.forEach((cleanup) => {
      cleanup();
    });
    animations.forEach((animation, element) => {
      animation.cancel();
      element.style.transform = "none";
    });
    animations.clear();
  };
}
