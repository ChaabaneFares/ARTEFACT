"use client";

export function mountPointerGlow(
  glow: HTMLDivElement,
  angleRef: { current: number },
) {
  const motionQuery = window.matchMedia(
    "(min-width: 769px) and (hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)",
  );
  let frame: number | null = null;
  let displayedAngle = angleRef.current;
  const stop = () => {
    if (frame !== null) window.cancelAnimationFrame(frame);
    frame = null;
    angleRef.current = displayedAngle;
  };
  const handleMove = (event: MouseEvent) => {
    if (!motionQuery.matches || document.hidden) return;
    const pointerAngle =
      (Math.atan2(
        window.innerHeight / 2 - event.clientY,
        window.innerWidth / 2 - event.clientX,
      ) *
        180) /
        Math.PI -
      90;
    // Keep an unbounded angle so full turns continue through the atan2 seam.
    const delta =
      ((((pointerAngle - angleRef.current) % 360) + 540) % 360) - 180;
    angleRef.current += delta;
    if (frame !== null) return;

    let previousTime = performance.now();
    const rotate = (time: number) => {
      const elapsed = Math.max(0, Math.min(time - previousTime, 64));
      previousTime = time;
      const remaining = angleRef.current - displayedAngle;
      displayedAngle += remaining * (1 - Math.exp(-elapsed / 100));
      if (Math.abs(remaining) < 0.01) {
        displayedAngle = angleRef.current;
        glow.style.setProperty("--glow-angle", `${displayedAngle}deg`);
        frame = null;
        return;
      }
      glow.style.setProperty("--glow-angle", `${displayedAngle}deg`);
      frame = window.requestAnimationFrame(rotate);
    };
    frame = window.requestAnimationFrame(rotate);
  };
  const handleMotionChange = () => {
    if (!motionQuery.matches || document.hidden) stop();
  };

  window.addEventListener("mousemove", handleMove);
  motionQuery.addEventListener("change", handleMotionChange);
  document.addEventListener("visibilitychange", handleMotionChange);
  return () => {
    window.removeEventListener("mousemove", handleMove);
    motionQuery.removeEventListener("change", handleMotionChange);
    document.removeEventListener("visibilitychange", handleMotionChange);
    stop();
  };
}
