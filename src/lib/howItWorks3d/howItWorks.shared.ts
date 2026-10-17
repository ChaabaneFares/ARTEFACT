import type { Locale } from "@/i18n/routing";

export const LANDING_HOW_IT_WORKS_SCENE_ID = "landing-how-it-works";

export const HOW_IT_WORKS_SCENE_MOUNT_SELECTOR =
  "[data-how-it-works-scene-mount]";

export function getHowItWorksRootSelector(sceneId: string): string {
  return `[data-how-it-works-id="${sceneId}"]`;
}

const HOW_IT_WORKS_ASSET_ROOT = "/assets/landing-page/how-it-works";

/**
 * The scene and its still carry the section title, so each language has its
 * own pair. The title text is the only difference, and every page knows its
 * language before any request, so the right files are fetched from the start.
 */
export function getHowItWorksAssets(locale: Locale) {
  const suffix = locale === "en" ? "" : `.${locale}`;
  return {
    sceneUrl: `${HOW_IT_WORKS_ASSET_ROOT}/am-arc-how-it-works.scene${suffix}.splinecode`,
    placeholderImageUrl: `${HOW_IT_WORKS_ASSET_ROOT}/how-it-works-mobile${suffix}.jpg`,
    placeholderFit: PLACEHOLDER_FIT[locale],
  };
}

/**
 * Where each language's still sits inside the English still's desktop box,
 * as fractions of that box: offset (dx, dy) and size (sw, sh). Each still is
 * a tight crop of its title, and the titles differ slightly in footprint, so
 * this keeps the still over the live title the canvas fades in on top of.
 * Measured from renders at the still's pose (see docs/i18n.doc.md).
 */
const PLACEHOLDER_FIT: Record<
  Locale,
  { dx: number; dy: number; sw: number; sh: number }
> = {
  en: { dx: 0, dy: 0, sw: 1, sh: 1 },
  fr: { dx: 0, dy: 0.0137, sw: 1, sh: 0.9863 },
  es: { dx: 0.0105, dy: 0.0122, sw: 0.9706, sh: 0.9802 },
  ar: { dx: 0.0468, dy: 0.0152, sw: 0.897, sh: 1.0487 },
};

export type HowItWorksAssets = ReturnType<typeof getHowItWorksAssets>;
