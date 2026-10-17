import type { Metadata } from "next";
import "./globals.css";

import NotFoundContent from "@/app/[locale]/_components/not-found/not-found-content";
import Initializer from "@/components/initializer/initializer";
import Layout from "@/components/layout/layout";
import { poppins } from "@/config/fonts";

export const metadata: Metadata = {
  title: "404 | Artefact Studio",
};

// URLs that match no language at all are served in English.
export default function GlobalNotFound() {
  return (
    <html lang="en" dir="ltr">
      <body className={`${poppins.variable} ${poppins.className}`}>
        <Initializer />
        <Layout locale="en">
          <NotFoundContent />
        </Layout>
      </body>
    </html>
  );
}
