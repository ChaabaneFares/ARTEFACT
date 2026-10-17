import Link from "next/link";
import { type Locale, localizePath } from "@/i18n/routing";
import { getContactOptions } from "../../_data/contact";
import type { ContactMode } from "../../_data/contact-runtime";
import ContactAttachmentButton from "./components/contact-attachment-button/contact-attachment-button";
import ContactAttachmentInput from "./components/contact-attachment-input/contact-attachment-input";
import ContactAttachments from "./components/contact-attachments/contact-attachments";
import ContactChoice from "./components/contact-choice/contact-choice";
import ContactFeedback from "./components/contact-feedback/contact-feedback";
import ContactFormPanel from "./components/contact-form-panel/contact-form-panel";
import ContactInput from "./components/contact-input/contact-input";
import ContactModeContent from "./components/contact-mode-content/contact-mode-content";
import ContactSubmit from "./components/contact-submit/contact-submit";
import ContactTab from "./components/contact-tabs/components/contact-tab/contact-tab";
import ContactTabs from "./components/contact-tabs/contact-tabs";
import ContactFormClient from "./contact-form.client";
import { contactFormCopy } from "./contact-form.copy";
import styles from "./contact-form.module.css";
import { getContactFormRuntimeCopy } from "./contact-form-runtime.copy";

function PrivacyNote({ locale }: { locale: Locale }) {
  const copy = contactFormCopy[locale];
  return (
    <p className={styles.deliveryNote}>
      {copy.privacyNote}{" "}
      <Link href={localizePath("/privacyandpolicy", locale)}>
        {copy.privacy}
      </Link>
    </p>
  );
}
function Submit({ label, sending }: { label: string; sending: string }) {
  return (
    <ContactSubmit label={label} sending={sending}>
      <span className={styles.submitFill} aria-hidden="true" />
    </ContactSubmit>
  );
}
function Choices({
  group,
  labels,
  className,
}: {
  group: "needs" | "documents" | "budget";
  labels: readonly { value: string; label: string }[];
  className: string;
}) {
  return (
    <div className={className}>
      {labels.map(({ value, label }) => (
        <ContactChoice key={value} group={group} label={label} value={value} />
      ))}
    </div>
  );
}
export default function ContactForm({
  initialMode,
  locale,
}: {
  initialMode: ContactMode;
  locale: Locale;
}) {
  const copy = contactFormCopy[locale];
  const {
    desktopNeeds,
    mobileNeeds,
    desktopDocuments,
    mobileDocuments,
    budgets,
  } = getContactOptions(locale);
  return (
    <ContactFormClient
      initialMode={initialMode}
      locale={locale}
      labels={getContactFormRuntimeCopy(locale)}
      optionLabels={Object.fromEntries(
        [
          ...desktopNeeds,
          ...mobileNeeds,
          ...desktopDocuments,
          ...mobileDocuments,
          ...budgets,
        ].map((option) => [option.value, option.label]),
      )}
      closeLabel={copy.close}
      successContent={
        <>
          <h2 id="contact-thanks">{copy.thanks}</h2>
          <p id="contact-thanks-message">{copy.thanksMessage}</p>
        </>
      }
    >
      <h1 className={styles.title} data-page-transition-item>
        {copy.title}
        <br />{" "}
        <span className={styles.headlineLine}>
          {copy.headline}
          <em>{copy.help}</em>
        </span>
      </h1>

      <ContactTabs label={copy.tabs}>
        <ContactTab mode="brief">{copy.brief}</ContactTab>
        <ContactTab mode="contact">{copy.contact}</ContactTab>
        <span className={styles.tabBackground} aria-hidden="true" />
        <span className={styles.tabIndicator} aria-hidden="true" />
      </ContactTabs>
      <ContactFormPanel>
        <ContactModeContent mode="brief">
          <fieldset className={styles.group} aria-labelledby="needs-label">
            <div className={styles.options}>
              <p id="needs-label">{copy.needs}</p>
              <Choices
                group="needs"
                labels={desktopNeeds}
                className={styles.desktopOptions}
              />
              <Choices
                group="needs"
                labels={mobileNeeds}
                className={styles.mobileOptions}
              />
            </div>
          </fieldset>
        </ContactModeContent>
        <div className={styles.fields}>
          <ContactInput name="name" label={copy.name} />
          <ContactInput name="email" label={copy.email} />
          <ContactInput name="message" label={copy.message} />
        </div>
        <div className={styles.attachments}>
          <ContactAttachmentInput label={copy.attachmentInput} />
          <ContactModeContent mode="contact">
            <PrivacyNote locale={locale} />
          </ContactModeContent>
          <div className={styles.attachmentActions}>
            <ContactAttachmentButton label={copy.attachment}>
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path
                  d="m9.5 13.5 6-6a3 3 0 0 1 4.2 4.2l-8 8a5 5 0 0 1-7.1-7.1l8-8"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </ContactAttachmentButton>
            <ContactModeContent mode="contact">
              <Submit label={copy.send} sending={copy.sending} />
            </ContactModeContent>
          </div>
          <ContactAttachments removeLabel={copy.remove} />
        </div>
        <ContactModeContent mode="brief">
          <fieldset className={styles.group} aria-labelledby="documents-label">
            <div className={`${styles.options} ${styles.documents}`}>
              <p id="documents-label">{copy.documents}</p>
              <Choices
                group="documents"
                labels={desktopDocuments}
                className={styles.desktopOptions}
              />
              <Choices
                group="documents"
                labels={mobileDocuments}
                className={styles.mobileOptions}
              />
            </div>
          </fieldset>
          <fieldset className={styles.group} aria-labelledby="budgets-label">
            <div className={`${styles.options} ${styles.budgets}`}>
              <p id="budgets-label">{copy.budget}</p>
              <Choices
                group="budget"
                labels={budgets}
                className={styles.budgetOptions}
              />
            </div>
          </fieldset>
          <PrivacyNote locale={locale} />
          <div className={styles.submitArea}>
            <Submit label={copy.request} sending={copy.sending} />
          </div>
        </ContactModeContent>
        <ContactFeedback
          website={copy.website}
          draft={copy.draft}
          manualAttachments={copy.manualAttachments}
        />
      </ContactFormPanel>
    </ContactFormClient>
  );
}
