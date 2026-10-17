import { Poppins } from "next/font/google";

// Shared by the `[locale]` root layout and the global 404 document, so both
// reference one font definition rather than two hashed copies.
export const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-poppins",
  display: "swap",
});

/**
 * Readex Pro, Arabic subset, variable weight (one 23 KB file for every
 * weight). It is self-hosted rather than loaded through next/font so that it
 * is preloaded on Arabic pages only: next/font would preload it on every page
 * that shares the root layout. The @font-face lives in globals.css, limited
 * to the Arabic Unicode range, so Latin text stays in Poppins.
 */
export const ARABIC_FONT_URL = "/assets/fonts/readex-pro-arabic-v27.woff2";
