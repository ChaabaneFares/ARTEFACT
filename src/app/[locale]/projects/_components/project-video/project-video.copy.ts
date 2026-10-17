import type { Locale } from "@/i18n/routing";

const en = {
  animation: "{name} animation",
  play: "Play {name}",
  captions: "English",
  music: "[Background music]",
};

export const projectVideoCopy: Record<Locale, typeof en> = {
  en,
  fr: {
    animation: "Animation {name}",
    play: "Lire {name}",
    captions: "Français",
    music: "[Musique de fond]",
  },
  es: {
    animation: "Animación de {name}",
    play: "Ver {name}",
    captions: "Español",
    music: "[Música de fondo]",
  },
  ar: {
    animation: "تحريك {name}",
    play: "تشغيل {name}",
    captions: "العربية",
    music: "[موسيقى خلفية]",
  },
};
