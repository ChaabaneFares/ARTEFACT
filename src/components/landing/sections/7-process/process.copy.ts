import type { Locale } from "@/i18n/routing";

const en = {
  section: "Artefact Studio process section",
  items: {
    "send-brief": {
      title: "Send brief",
      description:
        "Send us a completed brief along with documents & requirements to estimate the project & get started.",
    },
    "be-in-touch": {
      title: "Be in touch",
      description:
        "Review preliminary results and leave your feedback for us to continue or make corrections.",
    },
    "get-results": {
      title: "Get results",
      description:
        "Get your services with perfect quality design, details and visualization.",
    },
  },
};

export const processCopy: Record<Locale, typeof en> = {
  en,
  fr: {
    section: "Méthode Artefact Studio",
    items: {
      "send-brief": {
        title: "Votre brief",
        description:
          "Envoyez-nous un brief complet, vos documents et vos besoins pour chiffrer le projet et démarrer.",
      },
      "be-in-touch": {
        title: "Échanges",
        description:
          "Examinez les premiers résultats et donnez votre avis pour que nous poursuivions ou corrigions.",
      },
      "get-results": {
        title: "Le résultat",
        description:
          "Recevez un travail irréprochable : design, détails et visualisation.",
      },
    },
  },
  es: {
    section: "Proceso de Artefact Studio",
    items: {
      "send-brief": {
        title: "Enviar brief",
        description:
          "Envíanos tu brief completo, documentos y requisitos para presupuestar el proyecto y empezar.",
      },
      "be-in-touch": {
        title: "Hablemos",
        description:
          "Revisa los primeros resultados y danos tu opinión para que continuemos o hagamos ajustes.",
      },
      "get-results": {
        title: "Resultados",
        description:
          "Recibe un diseño, unos detalles y una visualización de calidad impecable.",
      },
    },
  },
  ar: {
    section: "مراحل العمل في Artefact Studio",
    items: {
      "send-brief": {
        title: "أرسل موجزك",
        description:
          "أرسل موجزًا مكتملًا مع المستندات والمتطلبات لتقدير تكلفة المشروع والبدء في العمل.",
      },
      "be-in-touch": {
        title: "نتواصل",
        description:
          "راجع النتائج الأولية وشاركنا ملاحظاتك كي نواصل العمل أو نجري التعديلات.",
      },
      "get-results": {
        title: "تسلّم عملك",
        description:
          "احصل على خدمات بتصميم وتفاصيل وإظهار معماري بجودة مثالية.",
      },
    },
  },
};
