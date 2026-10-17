import type { Locale } from "@/i18n/routing";

const en = {
  eyebrow: "Services",
  lines: [
    "From concept design to design",
    "developments and CGI visualization,",
    "we've got everything covered.",
  ],
};

export const servicesHeroCopy: Record<Locale, typeof en> = {
  en,
  fr: {
    eyebrow: "Services",
    lines: [
      "Du concept au développement,",
      "du design à la visualisation CGI,",
      "nous prenons tout en charge.",
    ],
  },
  es: {
    eyebrow: "Servicios",
    lines: [
      "Del concepto al desarrollo",
      "del diseño y la visualización CGI,",
      "nos encargamos de todo.",
    ],
  },
  ar: {
    eyebrow: "الخدمات",
    lines: [
      "من الفكرة إلى تطوير التصميم",
      "والإظهار المعماري بتقنية CGI،",
      "نتولّى كل التفاصيل.",
    ],
  },
};
