import type { Locale } from "@/i18n/routing";

/** English paths; `localizePath` turns them into each language's URL. */
export const headerLinks = {
  estimate: "/contact",
  main: [
    { key: "services", href: "/services" },
    { key: "projects", href: "/projects" },
    { key: "about", href: "/about" },
    { key: "contact", href: "/contact" },
    { key: "faq", href: "/faq" },
  ],
  top: ["services", "projects", "faq", "about"],
} as const;

export type HeaderLinkKey = (typeof headerLinks.main)[number]["key"];

const en = {
  navigation: "Main navigation",
  home: "Artefact home",
  openMenu: "Open menu",
  closeMenu: "Close menu",
  closeMenuBackground: "Close menu background",
  estimate: "Estimate project",
  menuEstimate: "Estimate Project",
  getInTouch: "Get in touch",
  copyEmail: "Copy {email}",
  social: "Social",
  profileNotConfigured: "{label} profile not configured",
  links: {
    services: "Services",
    projects: "Projects",
    about: "About",
    contact: "Contacts",
    faq: "FAQ",
  } satisfies Record<HeaderLinkKey, string>,
  emailFeedback: {
    hover: "Click to copy",
    copied: "copied ✓",
    copiedStatus: "Email copied",
    unavailable: "Copy unavailable",
    unavailableStatus: "Copy unavailable. Select the email to copy it.",
  },
  language: "Change language",
};

export type HeaderCopy = typeof en;

export const headerCopy: Record<Locale, HeaderCopy> = {
  en,
  fr: {
    navigation: "Navigation principale",
    home: "Accueil Artefact",
    openMenu: "Ouvrir le menu",
    closeMenu: "Fermer le menu",
    closeMenuBackground: "Fermer le menu",
    estimate: "Estimer un projet",
    menuEstimate: "Estimer un projet",
    getInTouch: "Écrivez-nous",
    copyEmail: "Copier {email}",
    social: "Réseaux",
    profileNotConfigured: "Profil {label} non configuré",
    links: {
      services: "Services",
      projects: "Projets",
      about: "À propos",
      contact: "Contact",
      faq: "FAQ",
    },
    emailFeedback: {
      hover: "Copier",
      copied: "copié ✓",
      copiedStatus: "Email copié",
      unavailable: "Copie indisponible",
      unavailableStatus:
        "Copie indisponible. Sélectionnez l’email pour le copier.",
    },
    language: "Changer de langue",
  },
  es: {
    navigation: "Navegación principal",
    home: "Inicio de Artefact",
    openMenu: "Abrir menú",
    closeMenu: "Cerrar menú",
    closeMenuBackground: "Cerrar menú",
    estimate: "Pedir presupuesto",
    menuEstimate: "Pedir presupuesto",
    getInTouch: "Escríbenos",
    copyEmail: "Copiar {email}",
    social: "Redes",
    profileNotConfigured: "Perfil de {label} no configurado",
    links: {
      services: "Servicios",
      projects: "Proyectos",
      about: "Nosotros",
      contact: "Contacto",
      faq: "FAQ",
    },
    emailFeedback: {
      hover: "Copiar",
      copied: "copiado ✓",
      copiedStatus: "Email copiado",
      unavailable: "Copia no disponible",
      unavailableStatus:
        "Copia no disponible. Selecciona el email para copiarlo.",
    },
    language: "Cambiar idioma",
  },
  ar: {
    navigation: "التنقل الرئيسي",
    home: "الصفحة الرئيسية لـ Artefact",
    openMenu: "فتح القائمة",
    closeMenu: "إغلاق القائمة",
    closeMenuBackground: "إغلاق القائمة",
    estimate: "اطلب عرض سعر",
    menuEstimate: "اطلب عرض سعر",
    getInTouch: "تواصل معنا",
    copyEmail: "نسخ {email}",
    social: "تابعنا",
    profileNotConfigured: "حساب {label} غير مُعدّ",
    links: {
      services: "الخدمات",
      projects: "المشاريع",
      about: "من نحن",
      contact: "تواصل معنا",
      faq: "الأسئلة الشائعة",
    },
    emailFeedback: {
      hover: "انقر للنسخ",
      copied: "تم النسخ ✓",
      copiedStatus: "تم نسخ البريد الإلكتروني",
      unavailable: "النسخ غير متاح",
      unavailableStatus: "النسخ غير متاح. حدّد البريد الإلكتروني لنسخه.",
    },
    language: "تغيير اللغة",
  },
};
