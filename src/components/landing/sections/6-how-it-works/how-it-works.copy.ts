import type { Locale } from "@/i18n/routing";

/** `title` is the text the scene and its still show for each language. */
const en = {
  title: "How it works",
  section: "How it works showcase",
  scene: "How Artefact Studio works 3D scene",
};

export const howItWorksCopy: Record<Locale, typeof en> = {
  en,
  fr: {
    title: "Le processus",
    section: "Présentation du processus",
    scene: "Scène 3D du processus d’Artefact Studio",
  },
  es: {
    title: "Así funciona",
    section: "Muestra de cómo funciona",
    scene: "Escena 3D de cómo trabaja Artefact Studio",
  },
  ar: {
    title: "طريقة العمل",
    section: "عرض طريقة العمل",
    scene: "مشهد ثلاثي الأبعاد لطريقة عمل Artefact Studio",
  },
};
