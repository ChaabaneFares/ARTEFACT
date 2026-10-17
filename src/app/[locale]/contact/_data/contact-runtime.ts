export const studioEmail = "chaabane@artefactstudio.org";
export const attachmentLimits = { count: 10, bytes: 3 * 1024 * 1024 } as const;

export type ContactFields = { name: string; email: string; message: string };
export type ContactErrors = Partial<Record<keyof ContactFields, string>>;
export type ContactMode = "brief" | "contact";

export type ContactFormLabels = {
  nameError: string;
  emailError: string;
  attachmentError: string;
  deliveryError: string;
  draftName: string;
  draftSeparator: string;
  draftListSeparator: string;
  draftEmail: string;
  draftNeeds: string;
  draftDocuments: string;
  draftBudget: string;
  draftUnspecified: string;
  draftAttachments: string;
  draftBrief: string;
  draftContact: string;
};
