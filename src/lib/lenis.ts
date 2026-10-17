import Lenis from "@studio-freight/lenis";

type LenisRuntime = {
  instance: Lenis | null;
  rafId: number | null;
};

declare global {
  var __artefactLenisRuntime: LenisRuntime | undefined;
}

function getRuntime() {
  if (globalThis.__artefactLenisRuntime) {
    return globalThis.__artefactLenisRuntime;
  }

  globalThis.__artefactLenisRuntime = {
    instance: null,
    rafId: null,
  };

  return globalThis.__artefactLenisRuntime;
}

const runtime = getRuntime();

function runLenisFrame(time: number) {
  runtime.instance?.raf(time);
  runtime.rafId = window.requestAnimationFrame(runLenisFrame);
}

export function initLenis() {
  if (typeof window === "undefined") {
    return null;
  }

  if (!runtime.instance) {
    runtime.instance = new Lenis();
  }

  if (runtime.rafId === null) {
    runtime.rafId = window.requestAnimationFrame(runLenisFrame);
  }

  return runtime.instance;
}

export function startLenis() {
  runtime.instance?.start();
}

export function stopLenis() {
  runtime.instance?.stop();
}

export function destroyLenis() {
  if (runtime.rafId !== null) {
    window.cancelAnimationFrame(runtime.rafId);
    runtime.rafId = null;
  }

  runtime.instance?.destroy();
  runtime.instance = null;
}
