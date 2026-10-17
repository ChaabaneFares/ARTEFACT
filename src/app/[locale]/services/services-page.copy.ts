import type { Locale } from "@/i18n/routing";

const en = { buttonLabel: "View more" };
export const servicesPageCopy: Record<Locale, typeof en> = {
  en,
  fr: { buttonLabel: "Voir plus" },
  es: { buttonLabel: "Ver más" },
  ar: { buttonLabel: "عرض المزيد" },
};
