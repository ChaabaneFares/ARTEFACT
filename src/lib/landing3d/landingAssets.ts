import { buildEchoViewFrameSources } from "@/components/ui/echoView/echoView.shared";
import type { Locale } from "@/i18n/routing";
import { getHowItWorksAssets } from "@/lib/howItWorks3d/howItWorks.shared";
import type { LandingMediaGroup } from "@/lib/landing3d/mediaScheduler";

/**
 * Reorders a frame sequence coarse-to-fine (every 8th, then 4th, 2nd, rest).
 * The sequence is scrubbed by scroll position, so a spread of frames lets it
 * animate roughly as soon as a few have landed, instead of holding frame 1
 * until the whole 2.9MB run has downloaded on a slow connection.
 */
function orderFramesCoarseToFine(urls: readonly string[]): string[] {
  const ordered: string[] = [];
  const taken = new Set<number>();

  for (const stride of [8, 4, 2, 1]) {
    for (let index = 0; index < urls.length; index += stride) {
      if (!taken.has(index)) {
        taken.add(index);
        ordered.push(urls[index]);
      }
    }
  }

  return ordered;
}

// Viewport-priority preload manifest, consumed by the media scheduler.
// EchoView frame 01 stays out: it is the SSR'd CSS background of each card.
// VSlider images stay out: they render through next/image, which fetches
// optimized /_next/image variants the raw URLs would never warm.
// The hero video stays out: the <video> element owns its own download.
export function buildLandingMediaPreloadManifest(
  locale: Locale,
): readonly LandingMediaGroup[] {
  const howItWorks = getHowItWorksAssets(locale);
  return [
    {
      sectionId: "projects",
      breakpoint: "desktop",
      kind: "image",
      urls: orderFramesCoarseToFine(
        buildEchoViewFrameSources(
          "/assets/landing-page/designs/echo-view",
          41,
        ).slice(1),
      ),
    },
    {
      sectionId: "visualization",
      breakpoint: "desktop",
      kind: "image",
      urls: orderFramesCoarseToFine(
        buildEchoViewFrameSources(
          "/assets/landing-page/visualization/echo-view",
          41,
        ).slice(1),
      ),
    },
    {
      sectionId: "vr",
      breakpoint: "desktop",
      kind: "scene-buffer",
      large: true,
      urls: ["/assets/landing-page/vr/am-arc-vr.scene.splinecode"],
    },
    {
      // Mobile 3D fallback, doubling as the desktop behind-canvas placeholder.
      sectionId: "vr",
      breakpoint: "all",
      kind: "image",
      urls: ["/assets/landing-page/vr/vr-mobile.jpg"],
    },
    {
      sectionId: "media",
      breakpoint: "all",
      kind: "image",
      urls: [
        "/assets/landing-page/media/pastel-pink.jpg",
        "/assets/landing-page/media/villa-pano.jpg",
        "/assets/landing-page/media/light-warm.jpg",
        "/assets/landing-page/media/cozy-cafe.jpg",
      ],
    },
    {
      sectionId: "how-it-works",
      breakpoint: "desktop",
      kind: "scene-buffer",
      urls: [howItWorks.sceneUrl],
    },
    {
      sectionId: "how-it-works",
      breakpoint: "all",
      kind: "image",
      urls: [howItWorks.placeholderImageUrl],
    },
    {
      sectionId: "process",
      breakpoint: "desktop",
      kind: "scene-buffer",
      urls: [
        "/assets/landing-page/process/send-brief.scene.splinecode",
        "/assets/landing-page/process/get-results.scene.splinecode",
      ],
    },
    {
      sectionId: "process",
      breakpoint: "desktop",
      kind: "scene-buffer",
      large: true,
      urls: ["/assets/landing-page/process/be-in-touch.scene.splinecode"],
    },
    {
      sectionId: "process",
      breakpoint: "all",
      kind: "image",
      urls: [
        "/assets/landing-page/process/send-brief-mobile.jpg",
        "/assets/landing-page/process/be-in-touch-mobile.jpg",
        "/assets/landing-page/process/get-results-mobile.jpg",
        "/assets/landing-page/process/process-noise.svg",
      ],
    },
    {
      sectionId: "process",
      breakpoint: "desktop",
      kind: "image",
      urls: [
        "/assets/landing-page/process/send-brief-placeholder.webp",
        "/assets/landing-page/process/be-in-touch-static.webp",
        "/assets/landing-page/process/get-results-placeholder.webp",
      ],
    },
  ];
}
