import type { Locale } from "@/i18n/routing";

const en = {
  architecture: "Architecture.",
  design: "Design.",
  visualization: "Visualization",
  estimate: "Estimate project",
  projects: "View projects",
  eyebrow: "Who we are",
  description:
    "A team of expert architects and designers who create cozy, modern, and minimalist spaces.",
  more: "Learn more",
};

export const heroCopy: Record<Locale, typeof en> = {
  en,
  fr: {
    architecture: "Architecture.",
    design: "Design.",
    visualization: "Visualisation",
    estimate: "Estimer un projet",
    projects: "Nos projets",
    eyebrow: "Le studio",
    description:
      "Architectes et designers experts, nous créons des espaces chaleureux, modernes et épurés.",
    more: "Découvrir",
  },
  es: {
    architecture: "Arquitectura.",
    design: "Diseño.",
    visualization: "Visualización",
    estimate: "Pedir presupuesto",
    projects: "Ver proyectos",
    eyebrow: "Nosotros",
    description:
      "Arquitectos y diseñadores expertos en espacios acogedores, modernos y minimalistas.",
    more: "Conoce más",
  },
  ar: {
    architecture: "عمارة.",
    design: "تصميم.",
    visualization: "إظهار معماري",
    estimate: "اطلب عرض سعر",
    projects: "عرض المشاريع",
    eyebrow: "من نحن",
    description:
      "فريق من المعماريين والمصممين الخبراء يبتكر مساحات دافئة وعصرية وبسيطة.",
    more: "اعرف المزيد",
  },
};
