"use client";

import { useContactFile } from "./contact-file.logic";

export default function ContactFile({
  file,
  removeLabel,
  index,
}: {
  file: File;
  removeLabel: string;
  index: number;
}) {
  const { busy, remove } = useContactFile(index);
  return (
    <li>
      <button
        type="button"
        onClick={remove}
        aria-label={removeLabel.replace("{file}", file.name)}
        disabled={busy}
      >
        <span aria-hidden="true">×</span>
        {file.name}
      </button>
    </li>
  );
}
