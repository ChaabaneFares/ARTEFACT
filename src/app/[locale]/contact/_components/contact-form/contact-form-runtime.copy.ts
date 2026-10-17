import { intlLocale } from "@/i18n/format";
import type { Locale } from "@/i18n/routing";
import { attachmentLimits } from "../../_data/contact-runtime";

const en = {
  nameError: "Please fill your name",
  emailError: "Please enter a valid email",
  attachmentError:
    "Please attach up to {count} files, with a total size under {size} MB.",
  deliveryError:
    "Your request could not be sent. Please try again or email the studio.",
  draftName: "Name",
  draftSeparator: ": ",
  draftListSeparator: ", ",
  draftEmail: "Email",
  draftNeeds: "I need",
  draftDocuments: "Documents",
  draftBudget: "Budget (USD)",
  draftUnspecified: "Not specified",
  draftAttachments: "Please attach these files to your email:",
  draftBrief: "Project brief",
  draftContact: "Contact request",
};

export const contactFormRuntimeCopy: Record<Locale, typeof en> = {
  en,
  fr: {
    nameError: "Indiquez votre nom",
    emailError: "Saisissez un email valide",
    attachmentError:
      "Joignez au plus {count} fichiers, de moins de {size} Mo au total.",
    deliveryError: "Envoi impossible. Réessayez ou écrivez au studio.",
    draftName: "Nom",
    draftSeparator: " : ",
    draftListSeparator: ", ",
    draftEmail: "Email",
    draftNeeds: "Besoins",
    draftDocuments: "Documents",
    draftBudget: "Budget (USD)",
    draftUnspecified: "Non précisé",
    draftAttachments: "Joignez ces fichiers à votre email :",
    draftBrief: "Brief projet",
    draftContact: "Demande de contact",
  },
  es: {
    nameError: "Escribe tu nombre",
    emailError: "Escribe un email válido",
    attachmentError:
      "Adjunta hasta {count} archivos, con un total inferior a {size} MB.",
    deliveryError:
      "No se pudo enviar tu solicitud. Reinténtalo o escribe al estudio.",
    draftName: "Nombre",
    draftSeparator: ": ",
    draftListSeparator: ", ",
    draftEmail: "Email",
    draftNeeds: "Busco",
    draftDocuments: "Documentos",
    draftBudget: "Presupuesto (USD)",
    draftUnspecified: "Sin especificar",
    draftAttachments: "Adjunta estos archivos al email:",
    draftBrief: "Brief del proyecto",
    draftContact: "Solicitud de contacto",
  },
  ar: {
    nameError: "أدخل اسمك",
    emailError: "أدخل بريدًا إلكترونيًا صالحًا",
    attachmentError:
      "أرفق ملفات لا يتجاوز عددها {count}، بحجم إجمالي أقل من {size} MB.",
    deliveryError: "تعذّر إرسال طلبك. حاول مجددًا أو راسل الاستوديو.",
    draftName: "الاسم",
    draftSeparator: ": ",
    draftListSeparator: "، ",
    draftEmail: "البريد",
    draftNeeds: "أحتاج",
    draftDocuments: "المستندات",
    draftBudget: "الميزانية (USD)",
    draftUnspecified: "غير محدد",
    draftAttachments: "أرفق هذه الملفات بالبريد:",
    draftBrief: "موجز مشروع",
    draftContact: "طلب تواصل",
  },
};

export function getContactFormRuntimeCopy(locale: Locale) {
  const copy = contactFormRuntimeCopy[locale];
  const number = new Intl.NumberFormat(intlLocale(locale));
  return {
    ...copy,
    attachmentError: copy.attachmentError
      .replace("{count}", number.format(attachmentLimits.count))
      .replace("{size}", number.format(attachmentLimits.bytes / 1024 / 1024)),
  };
}
