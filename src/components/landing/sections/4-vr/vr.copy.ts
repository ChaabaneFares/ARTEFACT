import type { Locale } from "@/i18n/routing";

const en = {
  section: "Virtual reality showcase",
  headset: "Artefact Studio VR headset",
  scene: "Artefact Studio VR object scene",
  drag: "Click + Drag",
  tour: {
    title: "Artefact Studio {degrees} virtual tour",
    loading: "Loading virtual tour",
    start: "Start interacting with the virtual tour",
    stop: "Stop interacting with the virtual tour",
  },
};

export const vrCopy: Record<Locale, typeof en> = {
  en,
  fr: {
    section: "Présentation VR",
    headset: "Casque VR Artefact Studio",
    scene: "Scène VR Artefact Studio",
    drag: "Cliquer + glisser",
    tour: {
      title: "Visite virtuelle {degrees} Artefact Studio",
      loading: "Chargement de la visite",
      start: "Interagir avec la visite virtuelle",
      stop: "Cesser d’interagir avec la visite",
    },
  },
  es: {
    section: "Muestra VR",
    headset: "Visor VR de Artefact Studio",
    scene: "Escena VR de Artefact Studio",
    drag: "Clic + arrastrar",
    tour: {
      title: "Tour virtual {degrees} de Artefact Studio",
      loading: "Cargando tour virtual",
      start: "Empieza a interactuar con el tour virtual",
      stop: "Deja de interactuar con el tour virtual",
    },
  },
  ar: {
    section: "عرض الواقع الافتراضي",
    headset: "نظارة VR من Artefact Studio",
    scene: "مشهد VR من Artefact Studio",
    drag: "انقر واسحب",
    tour: {
      title: "جولة افتراضية بزاوية {degrees} من Artefact Studio",
      loading: "جارٍ تحميل الجولة",
      start: "بدء التفاعل مع الجولة الافتراضية",
      stop: "إيقاف التفاعل مع الجولة الافتراضية",
    },
  },
};
