import type { Locale } from "@/i18n/routing";

const en = { title: "Take a look at some of our" };

export const projectCatalogCopy: Record<Locale, typeof en> = {
  en,
  fr: { title: "Découvrez certains de nos" },
  es: { title: "Explora nuestros" },
  ar: { title: "ألقِ نظرة على بعض أعمالنا" },
};
