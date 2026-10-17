import type { Locale } from "@/i18n/routing";

const en = {
  label: "Artefact Studio contact footer",
  headline: { start: "We are always", line: "happy to", accent: "help" },
  sendBrief: "Send brief",
  contactUs: "Contact us",
  estimate: "Estimate project",
  privacy: "Privacy Policy",
  credit: "Design & Development",
  profileNotConfigured: "{label} profile not configured",
  copyFeedback: {
    hover: "Click to copy",
    copied: "Copied",
    failed: "Copy failed",
    unavailable: "Copy unavailable",
  },
};

export const footerCopy: Record<Locale, typeof en> = {
  en,
  fr: {
    label: "Pied de page contact d’Artefact Studio",
    headline: { start: "Toujours ravis", line: "de vous", accent: "aider" },
    sendBrief: "Votre brief",
    contactUs: "Contact",
    estimate: "Estimer un projet",
    privacy: "Confidentialité",
    credit: "Design & développement",
    profileNotConfigured: "Profil {label} non configuré",
    copyFeedback: {
      hover: "Copier",
      copied: "Copié",
      failed: "Échec de la copie",
      unavailable: "Copie indisponible",
    },
  },
  es: {
    label: "Pie de página de contacto de Artefact Studio",
    headline: { start: "Siempre aquí", line: "para", accent: "ayudarte" },
    sendBrief: "Enviar brief",
    contactUs: "Contáctanos",
    estimate: "Pedir presupuesto",
    privacy: "Privacidad",
    credit: "Diseño y desarrollo",
    profileNotConfigured: "Perfil de {label} no configurado",
    copyFeedback: {
      hover: "Copiar",
      copied: "Copiado",
      failed: "Error al copiar",
      unavailable: "Copia no disponible",
    },
  },
  ar: {
    label: "تذييل التواصل مع Artefact Studio",
    headline: { start: "نحن دائمًا", line: "سعداء", accent: "بمساعدتك" },
    sendBrief: "أرسل موجزك",
    contactUs: "تواصل معنا",
    estimate: "اطلب عرض سعر",
    privacy: "سياسة الخصوصية",
    credit: "التصميم والتطوير",
    profileNotConfigured: "حساب {label} غير مُعدّ",
    copyFeedback: {
      hover: "انقر للنسخ",
      copied: "تم النسخ",
      failed: "تعذّر النسخ",
      unavailable: "النسخ غير متاح",
    },
  },
};
