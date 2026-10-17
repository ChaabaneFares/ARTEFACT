import type { Locale } from "@/i18n/routing";

const en = {
  title: "Visualization",
  sectionLabel: "Visualization showcase",
  frameLabel: "Visualization showcase sequence",
  responsiveLabel: "What we do",
  buttonLabel: "View more",
  items: {
    rendering: {
      title: "3D Rendering",
      tags: ["Rendering", "CGI", "Still Images"],
      eyebrow: "projects/3d-rendering",
    },
    animation: {
      title: "Animation",
      tags: ["Animation", "Motion", "Storytelling"],
      eyebrow: "projects/animation",
    },
    tour: {
      title: "Virtual tour",
      tags: ["Virtual Tour", "Interactive", "Immersive"],
      eyebrow: "projects/virtual-tour",
    },
  },
};

export const visualizationCopy: Record<Locale, typeof en> = {
  en,
  fr: {
    title: "Visualisation",
    sectionLabel: "Créations visuelles",
    frameLabel: "Séquence de visualisation",
    responsiveLabel: "Nos métiers",
    buttonLabel: "Voir plus",
    items: {
      rendering: {
        title: "Rendu 3D",
        tags: ["Rendu", "CGI", "Images fixes"],
        eyebrow: "projets/rendu-3d",
      },
      animation: {
        title: "Animation",
        tags: ["Animation", "Mouvement", "Récit"],
        eyebrow: "projets/animation",
      },
      tour: {
        title: "Visite virtuelle",
        tags: ["Visite 360°", "Interactif", "Immersif"],
        eyebrow: "projets/visite-virtuelle",
      },
    },
  },
  es: {
    title: "Visualización",
    sectionLabel: "Muestra de visualización",
    frameLabel: "Secuencia de visualización",
    responsiveLabel: "Qué hacemos",
    buttonLabel: "Ver más",
    items: {
      rendering: {
        title: "Render 3D",
        tags: ["Renders", "CGI", "Imágenes fijas"],
        eyebrow: "proyectos/render-3d",
      },
      animation: {
        title: "Animación",
        tags: ["Animación", "Movimiento", "Narrativa"],
        eyebrow: "proyectos/animación",
      },
      tour: {
        title: "Tour virtual",
        tags: ["Tour virtual", "Interactivo", "Inmersivo"],
        eyebrow: "proyectos/tour-virtual",
      },
    },
  },
  ar: {
    title: "إظهار معماري",
    sectionLabel: "عرض الإظهار المعماري",
    frameLabel: "تسلسل عرض الإظهار المعماري",
    responsiveLabel: "ما نقدمه",
    buttonLabel: "عرض المزيد",
    items: {
      rendering: {
        title: "تصيير 3D",
        tags: ["تصيير", "CGI", "صور ثابتة"],
        eyebrow: "المشاريع / التصيير 3D",
      },
      animation: {
        title: "تحريك",
        tags: ["تحريك", "حركة", "سرد قصصي"],
        eyebrow: "المشاريع / التحريك",
      },
      tour: {
        title: "جولة افتراضية",
        tags: ["جولة افتراضية", "تفاعلية", "غامرة"],
        eyebrow: "المشاريع / الجولات الافتراضية",
      },
    },
  },
};
