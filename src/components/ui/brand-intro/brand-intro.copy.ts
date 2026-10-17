import type { Locale } from "@/i18n/routing";

const en = { caption: "powered by", label: "Powered by Vawzen" };

export const brandIntroCopy: Record<Locale, typeof en> = {
  en,
  fr: { caption: "propulsé par", label: "Propulsé par Vawzen" },
  es: { caption: "impulsado por", label: "Impulsado por Vawzen" },
  ar: { caption: "بدعم من", label: "بدعم من Vawzen" },
};
