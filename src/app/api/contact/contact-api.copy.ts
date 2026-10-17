import type { Locale } from "@/i18n/routing";
import { intlLocale } from "../../../i18n/format";
import { attachmentLimits } from "../../[locale]/contact/_data/contact-runtime";

const en = {
  origin: "This request could not be verified. Please reload and try again.",
  format: "Please send the contact form again.",
  large:
    "Attachments are too large. Please use files under {size} MB in total.",
  unreadable: "The contact form could not be read. Please try again.",
  honeypot: "This request could not be verified.",
  details: "Please fill your name and a valid email address.",
  selections: "Please check your project selections.",
  attachments:
    "Please attach up to {count} files, with a total size under {size} MB.",
  unconfigured:
    "Online delivery is not available yet. Please use the email draft below to contact the studio.",
  unavailable:
    "Online delivery is unavailable. Please use the email draft below.",
  failed:
    "Your request could not be sent. Please try again or use the email draft below.",
  unconfirmed:
    "Delivery could not be confirmed. Please use the email draft below.",
};

export const contactApiCopy: Record<Locale, typeof en> = {
  en,
  fr: {
    origin:
      "Cette demande n’a pas pu être vérifiée. Rechargez la page et réessayez.",
    format: "Renvoyez le formulaire de contact.",
    large:
      "Pièces jointes trop volumineuses. Leur total doit être inférieur à {size} Mo.",
    unreadable: "Le formulaire est illisible. Veuillez réessayer.",
    honeypot: "Cette demande n’a pas pu être vérifiée.",
    details: "Indiquez votre nom et une adresse email valide.",
    selections: "Vérifiez les choix de votre projet.",
    attachments:
      "Joignez au plus {count} fichiers, de moins de {size} Mo au total.",
    unconfigured:
      "L’envoi en ligne n’est pas encore disponible. Contactez le studio avec le brouillon ci-dessous.",
    unavailable:
      "L’envoi en ligne est indisponible. Utilisez le brouillon ci-dessous.",
    failed: "L’envoi a échoué. Réessayez ou utilisez le brouillon ci-dessous.",
    unconfirmed:
      "L’envoi n’a pas pu être confirmé. Utilisez le brouillon ci-dessous.",
  },
  es: {
    origin:
      "No se pudo verificar esta solicitud. Recarga la página y reinténtalo.",
    format: "Reenvía el formulario de contacto.",
    large:
      "Los archivos pesan demasiado. Usa archivos con un total inferior a {size} MB.",
    unreadable: "No se pudo leer el formulario. Reinténtalo.",
    honeypot: "No se pudo verificar esta solicitud.",
    details: "Escribe tu nombre y un email válido.",
    selections: "Revisa las opciones de tu proyecto.",
    attachments:
      "Adjunta hasta {count} archivos, con un total inferior a {size} MB.",
    unconfigured:
      "El envío en línea aún no está disponible. Usa el borrador de abajo para escribir al estudio.",
    unavailable:
      "El envío en línea no está disponible. Usa el borrador de abajo.",
    failed:
      "No se pudo enviar tu solicitud. Reinténtalo o usa el borrador de abajo.",
    unconfirmed: "No se pudo confirmar el envío. Usa el borrador de abajo.",
  },
  ar: {
    origin: "تعذّر التحقق من الطلب. أعد تحميل الصفحة وحاول مجددًا.",
    format: "أرسل نموذج التواصل مجددًا.",
    large: "المرفقات كبيرة جدًا. استخدم ملفات بحجم إجمالي أقل من {size} MB.",
    unreadable: "تعذّرت قراءة النموذج. حاول مجددًا.",
    honeypot: "تعذّر التحقق من الطلب.",
    details: "أدخل اسمك وبريدًا إلكترونيًا صالحًا.",
    selections: "تحقق من خيارات مشروعك.",
    attachments:
      "أرفق ملفات لا يتجاوز عددها {count}، بحجم إجمالي أقل من {size} MB.",
    unconfigured:
      "الإرسال عبر الإنترنت غير متاح بعد. استخدم مسودة البريد أدناه لمراسلة الاستوديو.",
    unavailable: "الإرسال عبر الإنترنت غير متاح. استخدم المسودة أدناه.",
    failed: "تعذّر إرسال طلبك. حاول مجددًا أو استخدم المسودة أدناه.",
    unconfirmed: "تعذّر تأكيد الإرسال. استخدم المسودة أدناه.",
  },
};

export function getContactApiCopy(locale: Locale) {
  const copy = contactApiCopy[locale];
  const number = new Intl.NumberFormat(intlLocale(locale));
  const format = (text: string) =>
    text
      .replace("{count}", number.format(attachmentLimits.count))
      .replace("{size}", number.format(attachmentLimits.bytes / 1024 / 1024));
  return {
    ...copy,
    large: format(copy.large),
    attachments: format(copy.attachments),
  };
}
