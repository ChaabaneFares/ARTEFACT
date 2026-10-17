import type { Locale } from "@/i18n/routing";

const en = {
  title: ["We help people feel", "good in a space."],
  introduction:
    "A team of expert architects and designers who create cozy, modern, and minimalist spaces.",
  clients:
    "For each of our clients, we create spaces that are truly unique to them by listening, solving problems, and being creative.",
};

const portraits = [
  "/assets/about/member-01.jpg",
  "/assets/about/member-02.jpg",
  "/assets/about/member-03.jpg",
  "/assets/about/member-04.jpg",
  "/assets/about/member-05.jpg",
  "/assets/about/member-06.jpg",
] as const;

const aboutText: Record<Locale, typeof en> = {
  en,
  fr: {
    title: ["Nous vous aidons à", "être bien dans un lieu."],
    introduction:
      "Architectes et designers experts, nous créons des espaces chaleureux, modernes et épurés.",
    clients:
      "À l’écoute de chaque client, nous créons des espaces qui lui sont propres en résolvant les problèmes avec créativité.",
  },
  es: {
    title: ["Te ayudamos a estar", "bien en tu espacio."],
    introduction:
      "Arquitectos y diseñadores expertos en espacios acogedores, modernos y minimalistas.",
    clients:
      "Creamos espacios únicos para cada cliente, escuchando, resolviendo problemas y aportando creatividad.",
  },
  ar: {
    title: ["نساعدك على الشعور", "بالراحة في المكان."],
    introduction:
      "فريق من المعماريين والمصممين الخبراء يبتكر مساحات دافئة وعصرية وبسيطة.",
    clients:
      "نصغي إلى كل عميل ونحلّ التحديات بإبداع، لنبتكر مساحات فريدة تعبّر عنه.",
  },
};

export function getAboutContent(locale: Locale) {
  return { ...aboutText[locale], portraits };
}
