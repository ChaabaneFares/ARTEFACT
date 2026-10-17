import type { Locale } from "@/i18n/routing";

const en = {
  eyebrow: "About",
  heroAlt: "Warm minimalist interior with natural materials",
  memberAlt: "Studio team member",
  studioAlt: "Contemporary architectural interior",
  philosophy: "Philosophy",
  less: "Less is more",
  worldwide: "Worldwide,",
  work: " we work with",
};

export const aboutContentCopy: Record<Locale, typeof en> = {
  en,
  fr: {
    eyebrow: "À propos",
    heroAlt: "Intérieur minimaliste chaleureux aux matériaux naturels",
    memberAlt: "Membre du studio",
    studioAlt: "Intérieur architectural contemporain",
    philosophy: "Philosophie",
    less: "Moins, c’est plus",
    worldwide: "Partout,",
    work: " nous travaillons avec",
  },
  es: {
    eyebrow: "Nosotros",
    heroAlt: "Interior minimalista acogedor con materiales naturales",
    memberAlt: "Miembro del estudio",
    studioAlt: "Interior arquitectónico contemporáneo",
    philosophy: "Filosofía",
    less: "Menos es más",
    worldwide: "En todo el mundo,",
    work: " trabajamos con",
  },
  ar: {
    eyebrow: "من نحن",
    heroAlt: "مساحة داخلية دافئة وبسيطة بمواد طبيعية",
    memberAlt: "عضو فريق الاستوديو",
    studioAlt: "مساحة داخلية بطابع معماري معاصر",
    philosophy: "فلسفتنا",
    less: "الأقل أكثر",
    worldwide: "حول العالم،",
    work: " نعمل مع",
  },
};
