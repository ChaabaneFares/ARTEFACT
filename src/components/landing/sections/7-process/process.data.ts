import { intlLocale } from "@/i18n/format";
import type { Locale } from "@/i18n/routing";
import { processCopy } from "./process.copy";

const PROCESS_ITEMS = [
  {
    sceneId: "send-brief",
    sceneUrl: "/assets/landing-page/process/send-brief.scene.splinecode",
    objectId: "51b96b16-0a87-48a2-a9da-f9a080e1fac2",
    mobileImageUrl: "/assets/landing-page/process/send-brief-mobile.jpg",
    staticImageUrl: "/assets/landing-page/process/send-brief-placeholder.webp",
    useStaticScene: false,
    variant: "default" as const,
  },
  {
    sceneId: "be-in-touch",
    sceneUrl: "/assets/landing-page/process/be-in-touch.scene.splinecode",
    objectId: "c177f679-17e5-4d0d-be42-4c0bc7a87f65",
    mobileImageUrl: "/assets/landing-page/process/be-in-touch-mobile.jpg",
    staticImageUrl: "/assets/landing-page/process/be-in-touch-static.webp",
    materialOverride: {
      materialId: "53b3c7c2-3345-40dd-abc0-6a49853cecd7",
      meshIds: [
        "fc382e6e-e9f9-4846-bce8-fa768013aff0",
        "e683c988-a8f8-44ff-b31c-322e9362c998",
      ],
    },
    useStaticScene: false,
    variant: "right" as const,
  },
  {
    sceneId: "get-results",
    sceneUrl: "/assets/landing-page/process/get-results.scene.splinecode",
    objectId: "e6b11c2f-5a25-44c4-9d03-cc2554c66ccb",
    mobileImageUrl: "/assets/landing-page/process/get-results-mobile.jpg",
    staticImageUrl: "/assets/landing-page/process/get-results-placeholder.webp",
    useStaticScene: false,
    variant: "default" as const,
  },
] satisfies Array<{
  sceneId: keyof typeof processCopy.en.items;
  sceneUrl: string;
  objectId: string;
  mobileImageUrl: string;
  staticImageUrl?: string;
  materialOverride?: {
    materialId: string;
    meshIds: string[];
  };
  useStaticScene?: boolean;
  variant: "default" | "right";
}>;

export function getProcessItems(locale: Locale) {
  const numberFormat = new Intl.NumberFormat(intlLocale(locale), {
    minimumIntegerDigits: 2,
  });
  return PROCESS_ITEMS.map((item, index) => ({
    ...item,
    ...processCopy[locale].items[item.sceneId],
    number: numberFormat.format(index + 1),
  }));
}
