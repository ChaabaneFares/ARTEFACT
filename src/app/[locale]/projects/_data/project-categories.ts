import type { Locale } from "@/i18n/routing";
import type {
  ProjectCategories,
  ProjectCategory,
} from "../_components/project-catalog/project-catalog.types";

export const categoryHashes: Record<ProjectCategory, string> = {
  Projects: "",
  Interior: "In",
  Exterior: "Ex",
  Animation: "Ani",
  "3D Rendering": "3dr",
  Concept: "Con",
  "Virtual tour": "VR",
  "3D Model": "3dm",
};
export const desktopCategories: readonly ProjectCategory[] = [
  "Projects",
  "Interior",
  "Exterior",
  "Animation",
  "3D Rendering",
  "Concept",
  "Virtual tour",
  "3D Model",
];
export const mobileCategories: readonly ProjectCategory[] = [
  "Projects",
  "Interior",
  "Exterior",
  "Concept",
  "Animation",
  "3D Rendering",
  "Virtual tour",
  "3D Model",
];

const en = {
  Projects: "Projects",
  Interior: "Interior",
  Exterior: "Exterior",
  Animation: "Animation",
  "3D Rendering": "3D Rendering",
  Concept: "Concept",
  "Virtual tour": "Virtual tour",
  "3D Model": "3D Model",
  Plan: "Plan",
  rendering: "Rendering",
};

export const categoryLabels: Record<Locale, typeof en> = {
  en,
  fr: {
    Projects: "Projets",
    Interior: "Intérieur",
    Exterior: "Extérieur",
    Animation: "Animation",
    "3D Rendering": "Rendu 3D",
    Concept: "Concept",
    "Virtual tour": "Visite 360°",
    "3D Model": "Modèle 3D",
    Plan: "Plan",
    rendering: "Rendu",
  },
  es: {
    Projects: "Proyectos",
    Interior: "Interior",
    Exterior: "Exterior",
    Animation: "Animación",
    "3D Rendering": "Render 3D",
    Concept: "Concepto",
    "Virtual tour": "Tour virtual",
    "3D Model": "Modelo 3D",
    Plan: "Plano",
    rendering: "Render",
  },
  ar: {
    Projects: "المشاريع",
    Interior: "داخلي",
    Exterior: "خارجي",
    Animation: "تحريك",
    "3D Rendering": "تصيير 3D",
    Concept: "مفاهيمي",
    "Virtual tour": "جولة افتراضية",
    "3D Model": "نموذج 3D",
    Plan: "مخطط",
    rendering: "تصيير",
  },
};

export function getProjectCategories(locale: Locale): ProjectCategories {
  const labels = categoryLabels[locale];
  const option = (id: ProjectCategory) => ({
    id,
    hash: categoryHashes[id],
    label: labels[id],
    mobileLabel: id === "3D Rendering" ? labels.rendering : labels[id],
  });
  return {
    desktop: desktopCategories.map(option),
    mobile: mobileCategories.map(option),
  };
}

export type { ProjectCategory } from "../_components/project-catalog/project-catalog.types";
