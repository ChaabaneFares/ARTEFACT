import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import sharp from "sharp";

const out = resolve(process.argv[2] || "/tmp/artefact-brand-logos");
await mkdir(out, { recursive: true });
for (const name of [
  "artefact-lockup",
  "artefact-mark",
  "artefact-vertical-lockup",
  "artefact-wordmark-vertical",
  "artefact-copyright-rail",
]) {
  await sharp(`public/assets/brand/${name}.svg`, { density: 288 })
    .png()
    .toFile(`${out}/${name}.png`);
}
process.stdout.write(`Rendered exact SVG branding into ${out}\n`);
