import type { Locale } from "@/i18n/routing";

const en = {
  questions: "Questions",
  desktopAnd: "&",
  mobileAnd: "and",
  answers: " answers",
  intro:
    "Most common questions about CGI, our studio and the process in general.",
  scroll: "Scroll",
  connector: " and ",
  click: "click",
  ending: " on the section and find the answer.",
};

export const faqHeroCopy: Record<Locale, typeof en> = {
  en,
  fr: {
    questions: "Questions",
    desktopAnd: "&",
    mobileAnd: "et",
    answers: " réponses",
    intro:
      "Les questions fréquentes sur la CGI, notre studio et notre méthode de travail.",
    scroll: "Faites défiler",
    connector: " et ",
    click: "cliquez",
    ending: " sur la rubrique pour trouver la réponse.",
  },
  es: {
    questions: "Preguntas",
    desktopAnd: "y",
    mobileAnd: "y",
    answers: " respuestas",
    intro:
      "Las preguntas más comunes sobre CGI, nuestro estudio y el proceso en general.",
    scroll: "Desplázate",
    connector: " y ",
    click: "haz clic",
    ending: " en la sección para encontrar la respuesta.",
  },
  ar: {
    questions: "أسئلة",
    desktopAnd: "و",
    mobileAnd: "و",
    answers: "أجوبة",
    intro: "أكثر الأسئلة شيوعًا حول CGI واستوديونا ومراحل العمل عمومًا.",
    scroll: "مرّر",
    connector: " و",
    click: "انقر",
    ending: " على القسم لتجد الإجابة.",
  },
};
