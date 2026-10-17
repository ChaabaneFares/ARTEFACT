import { notFound } from "next/navigation";

// Unknown paths under a language render that language's 404 inside its own
// layout, instead of falling through to the English global document.
export default function MissingPage() {
  notFound();
}
