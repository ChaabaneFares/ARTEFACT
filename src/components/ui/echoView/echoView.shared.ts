export const ECHO_VIEW_STAGE_SELECTOR = "[data-echo-view-stage]";
export const ECHO_VIEW_CARD_SELECTOR = "[data-echo-view-card]";
export const ECHO_VIEW_SCALE_WRAP_SELECTOR = "[data-echo-view-scale-wrap]";
export const ECHO_VIEW_CANVAS_SELECTOR = "[data-echo-view-canvas]";

export const ECHO_VIEW_FRAME_WIDTH = 1280;
export const ECHO_VIEW_FRAME_HEIGHT = 720;
export const ECHO_VIEW_START_POINT = [0, 0.5] as const;
export const ECHO_VIEW_END_POINT = [0, 1] as const;
export const ECHO_VIEW_SCALE_START_POINT = [0] as const;
export const ECHO_VIEW_SCALE_END_POINT = [0.5, 1] as const;
export const ECHO_VIEW_SCALE_FROM = 0.7;
export const ECHO_VIEW_SCALE_TO = 1;

export type EchoViewData = {
  id?: string;
  title: string;
  index: string;
  sectionLabel: string;
  frameLabel: string;
  frameSources: readonly string[];
  fallbackImage?: string;
  frameWidth?: number;
  frameHeight?: number;
  startPoint?: readonly number[];
  endPoint?: readonly number[];
  scaleFrom?: number;
  scaleTo?: number;
  scaleStartPoint?: readonly number[];
  scaleEndPoint?: readonly number[];
};

export type ResolvedEchoViewData = {
  id: string;
  title: string;
  index: string;
  sectionLabel: string;
  frameLabel: string;
  frameSources: readonly string[];
  fallbackImage: string;
  frameWidth: number;
  frameHeight: number;
  startPoint: readonly number[];
  endPoint: readonly number[];
  scaleFrom: number;
  scaleTo: number;
  scaleStartPoint: readonly number[];
  scaleEndPoint: readonly number[];
};

export function getEchoViewRootSelector(id: string): string {
  return `[data-echo-view-root="${id}"]`;
}

// Frames are scrubbed by scroll, so the whole sequence is downloaded on a
// cold visit -- by far the heaviest thing on the landing page. They are
// pre-encoded to WebP at the width the card actually renders (see
// scripts/encode-echo-frames.mjs), which is ~31% smaller than the source
// JPEGs. Pre-encoding rather than Next's on-demand optimizer is deliberate:
// with a cold optimizer cache the first visitor's 80+ transformations starve
// the rest of the page. Re-run the script if the source frames change.
export function buildEchoViewFrameSources(
  basePath: string,
  frameCount: number,
): string[] {
  return Array.from({ length: frameCount }, (_, index) => {
    const frameNumber = String(index + 1).padStart(2, "0");
    return `${basePath}/frame-${frameNumber}.webp`;
  });
}

export function resolveEchoViewData(
  data: EchoViewData,
  fallbackId: string,
): ResolvedEchoViewData {
  const frameSources = data.frameSources;
  const fallbackImage = data.fallbackImage ?? frameSources[0] ?? "";
  const sectionLabel = data.sectionLabel;
  const frameLabel = data.frameLabel;

  return {
    id: data.id ?? fallbackId,
    title: data.title,
    index: data.index,
    sectionLabel,
    frameLabel,
    frameSources,
    fallbackImage,
    frameWidth: data.frameWidth ?? ECHO_VIEW_FRAME_WIDTH,
    frameHeight: data.frameHeight ?? ECHO_VIEW_FRAME_HEIGHT,
    startPoint: data.startPoint ?? ECHO_VIEW_START_POINT,
    endPoint: data.endPoint ?? ECHO_VIEW_END_POINT,
    scaleFrom: data.scaleFrom ?? ECHO_VIEW_SCALE_FROM,
    scaleTo: data.scaleTo ?? ECHO_VIEW_SCALE_TO,
    scaleStartPoint: data.scaleStartPoint ?? ECHO_VIEW_SCALE_START_POINT,
    scaleEndPoint: data.scaleEndPoint ?? ECHO_VIEW_SCALE_END_POINT,
  };
}
