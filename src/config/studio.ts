export type StudioSocialKey = "be" | "up" | "insta" | "telegram" | "whs";

const publicProfile = (value: string | undefined) => {
  if (!value?.trim()) return undefined;
  try {
    const url = new URL(value.trim());
    return url.protocol === "https:" ? url.href : undefined;
  } catch {
    return undefined;
  }
};

export const studioContact = {
  email: "chaabane@artefactstudio.org",
  address: process.env.NEXT_PUBLIC_STUDIO_ADDRESS?.trim() || "",
  socials: [
    {
      key: "up",
      label: "Upwork",
      href: publicProfile(process.env.NEXT_PUBLIC_STUDIO_UPWORK_URL),
    },
    {
      key: "be",
      label: "Behance",
      href: publicProfile(process.env.NEXT_PUBLIC_STUDIO_BEHANCE_URL),
    },
    {
      key: "telegram",
      label: "Telegram",
      href: publicProfile(process.env.NEXT_PUBLIC_STUDIO_TELEGRAM_URL),
    },
    {
      key: "insta",
      label: "Instagram",
      href:
        publicProfile(process.env.NEXT_PUBLIC_STUDIO_INSTAGRAM_URL) ??
        "https://www.instagram.com/artefact_studio_design/",
    },
    {
      key: "whs",
      label: "WhatsApp",
      href: publicProfile(process.env.NEXT_PUBLIC_STUDIO_WHATSAPP_URL),
    },
  ] satisfies readonly {
    key: StudioSocialKey;
    label: string;
    href: string | undefined;
  }[],
} as const;
