import type { Locale } from "@/i18n/routing";

const en = {
  title: "Design",
  sectionLabel: "Design showcase",
  frameLabel: "Interior design showcase sequence",
  responsiveLabel: "What we do",
  buttonLabel: "View more",
  items: {
    interior: {
      title: "Interior design",
      tags: ["Interior", "Styling", "Spatial Design"],
      eyebrow: "projects/interior-design",
    },
    exterior: {
      title: "Exterior design",
      tags: ["Exterior", "Architecture", "Landscape"],
      eyebrow: "projects/exterior-design",
    },
  },
};

export const designCopy: Record<Locale, typeof en> = {
  en,
  fr: {
    title: "Design",
    sectionLabel: "Créations design",
    frameLabel: "Séquence de design intérieur",
    responsiveLabel: "Nos métiers",
    buttonLabel: "Voir plus",
    items: {
      interior: {
        title: "Design intérieur",
        tags: ["Intérieur", "Stylisme", "Aménagement"],
        eyebrow: "projets/design-interieur",
      },
      exterior: {
        title: "Design extérieur",
        tags: ["Extérieur", "Architecture", "Paysage"],
        eyebrow: "projets/design-exterieur",
      },
    },
  },
  es: {
    title: "Diseño",
    sectionLabel: "Muestra de diseño",
    frameLabel: "Secuencia de diseño interior",
    responsiveLabel: "Qué hacemos",
    buttonLabel: "Ver más",
    items: {
      interior: {
        title: "Diseño interior",
        tags: ["Interior", "Estilismo", "Diseño de espacios"],
        eyebrow: "proyectos/diseño-interior",
      },
      exterior: {
        title: "Diseño exterior",
        tags: ["Exterior", "Arquitectura", "Paisajismo"],
        eyebrow: "proyectos/diseño-exterior",
      },
    },
  },
  ar: {
    title: "تصميم",
    sectionLabel: "عرض التصاميم",
    frameLabel: "تسلسل عرض التصميم الداخلي",
    responsiveLabel: "ما نقدمه",
    buttonLabel: "عرض المزيد",
    items: {
      interior: {
        title: "تصميم داخلي",
        tags: ["داخلي", "تنسيق", "تصميم المساحات"],
        eyebrow: "المشاريع / التصميم الداخلي",
      },
      exterior: {
        title: "تصميم خارجي",
        tags: ["خارجي", "عمارة", "تنسيق المواقع"],
        eyebrow: "المشاريع / التصميم الخارجي",
      },
    },
  },
};
