import type { Locale } from "@/i18n/routing";

const en = {
  notFound: "Project not found | Artefact Studio",
  view: "{name} — view {number}",
};

export const projectDetailCopy: Record<Locale, typeof en> = {
  en,
  fr: {
    notFound: "Projet introuvable | Artefact Studio",
    view: "{name} — vue {number}",
  },
  es: {
    notFound: "Proyecto no encontrado | Artefact Studio",
    view: "{name} — vista {number}",
  },
  ar: {
    notFound: "المشروع غير موجود | Artefact Studio",
    view: "{name} — لقطة {number}",
  },
};
