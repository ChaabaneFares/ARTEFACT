import type { Locale } from "@/i18n/routing";

const en = {
  videos: "Featured Videos",
  animations: "Featured Animations",
  play: "Play {title}",
  fullscreen: "Open {title} fullscreen",
  musicCaption: "[Background music]",
  motion: {
    fallbackTitle: "Featured animation",
    captionLanguage: "English",
  },
};

export const mediaCopy: Record<Locale, typeof en> = {
  en,
  fr: {
    videos: "Vidéos à la une",
    animations: "Animations à la une",
    play: "Lire {title}",
    fullscreen: "Ouvrir {title} en plein écran",
    musicCaption: "[Musique de fond]",
    motion: {
      fallbackTitle: "Animation à la une",
      captionLanguage: "Français",
    },
  },
  es: {
    videos: "Videos destacados",
    animations: "Animaciones destacadas",
    play: "Ver {title}",
    fullscreen: "Ver {title} a pantalla completa",
    musicCaption: "[Música de fondo]",
    motion: {
      fallbackTitle: "Animación destacada",
      captionLanguage: "Español",
    },
  },
  ar: {
    videos: "فيديوهات مختارة",
    animations: "أعمال تحريك مختارة",
    play: "تشغيل {title}",
    fullscreen: "فتح {title} بملء الشاشة",
    musicCaption: "[موسيقى خلفية]",
    motion: { fallbackTitle: "عمل تحريك مختار", captionLanguage: "العربية" },
  },
};
