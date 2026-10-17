const DEFAULT_SITE_URL = "https://artefact-studio.space";

const normalizeUrl = (value?: string) => {
  if (!value) {
    return undefined;
  }

  const withProtocol = value.startsWith("http") ? value : `https://${value}`;
  return withProtocol.replace(/\/$/, "");
};

const fromEnv = normalizeUrl(
  process.env.SITE_URL || process.env.NEXT_PUBLIC_SITE_URL,
);

const fromVercel = normalizeUrl(
  process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL,
);

export const SITE_NAME = "Artefact Studio";
export const SITE_DESCRIPTION =
  "Architecture, interior and exterior design, and immersive visualization from Artefact Studio.";
export const SITE_URL = fromEnv || fromVercel || DEFAULT_SITE_URL;
