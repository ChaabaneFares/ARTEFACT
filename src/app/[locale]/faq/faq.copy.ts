import type { Locale } from "@/i18n/routing";

const en = {
  generalLabel: "Working with the studio",
  glossaryLabel: "CGI terminology",
  separatorLabel: "CGI glossary",
  separator: "computer generated imagery (CGI)",
};

export const faqCopy: Record<Locale, typeof en> = {
  en,
  fr: {
    generalLabel: "Travailler avec le studio",
    glossaryLabel: "Terminologie CGI",
    separatorLabel: "Lexique CGI",
    separator: "images de synthèse (CGI)",
  },
  es: {
    generalLabel: "Trabajar con el estudio",
    glossaryLabel: "Términos CGI",
    separatorLabel: "Glosario CGI",
    separator: "imágenes digitales (CGI)",
  },
  ar: {
    generalLabel: "العمل مع الاستوديو",
    glossaryLabel: "مصطلحات CGI",
    separatorLabel: "مسرد CGI",
    separator: "صور مولّدة بالحاسوب (CGI)",
  },
};
