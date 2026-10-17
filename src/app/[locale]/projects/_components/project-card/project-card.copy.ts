import type { Locale } from "@/i18n/routing";

const en = {
  viewProject: "View project",
  view: "View {name}",
  tour: "{name} — virtual tour {id}",
};

export const projectCardCopy: Record<Locale, typeof en> = {
  en,
  fr: {
    viewProject: "Découvrir",
    view: "Voir {name}",
    tour: "{name} — visite virtuelle {id}",
  },
  es: {
    viewProject: "Ver proyecto",
    view: "Ver {name}",
    tour: "{name} — tour virtual {id}",
  },
  ar: {
    viewProject: "عرض المشروع",
    view: "عرض {name}",
    tour: "{name} — جولة افتراضية {id}",
  },
};
