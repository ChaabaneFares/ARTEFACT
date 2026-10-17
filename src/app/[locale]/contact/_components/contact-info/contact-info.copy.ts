import type { Locale } from "@/i18n/routing";

const en = {
  privacy: "Privacy Policy",
  unconfigured: "{social} profile not configured",
  emailCopied: "Email copied",
  copied: "copied ✓",
  click: "Click to copy",
  email: "Email: ",
};

export const contactInfoCopy: Record<Locale, typeof en> = {
  en,
  fr: {
    privacy: "Confidentialité",
    unconfigured: "Profil {social} non configuré",
    emailCopied: "Email copié",
    copied: "copié ✓",
    click: "Copier",
    email: "Email : ",
  },
  es: {
    privacy: "Privacidad",
    unconfigured: "Perfil de {social} no configurado",
    emailCopied: "Email copiado",
    copied: "copiado ✓",
    click: "Copiar",
    email: "Email: ",
  },
  ar: {
    privacy: "سياسة الخصوصية",
    unconfigured: "حساب {social} غير مُعدّ",
    emailCopied: "تم نسخ البريد",
    copied: "تم النسخ ✓",
    click: "انقر للنسخ",
    email: "البريد: ",
  },
};
