// Pre-encodes the EchoView scroll sequences to WebP.
//
// The frames are immutable art assets that are all downloaded on a cold visit,
// making them the heaviest thing on the landing page. Encoding them ahead of
// time gives the same saving as Next's image optimizer without the on-demand
// encode: with a cold optimizer cache the first visitor's 80+ transformations
// starve the rest of the page (measured: 0 of 5 scenes ready, 3 blank stages).
//
// Run after changing any frame source: node scripts/encode-echo-frames.mjs

import { readdir, stat } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const FRAME_DIRECTORIES = [
  "public/assets/landing-page/designs/echo-view",
  "public/assets/landing-page/visualization/echo-view",
];
// Matches the widest the card renders (78.53vw) without upscaling the source.
const TARGET_WIDTH = 1200;
const QUALITY = 75;

async function encodeDirectory(directory) {
  const entries = await readdir(directory);
  const frames = entries.filter((entry) => entry.endsWith(".jpg")).sort();
  let sourceBytes = 0;
  let outputBytes = 0;

  for (const frame of frames) {
    const sourcePath = path.join(directory, frame);
    const outputPath = path.join(directory, frame.replace(/\.jpg$/, ".webp"));

    await sharp(sourcePath)
      .resize({ width: TARGET_WIDTH, withoutEnlargement: true })
      .webp({ quality: QUALITY })
      .toFile(outputPath);

    sourceBytes += (await stat(sourcePath)).size;
    outputBytes += (await stat(outputPath)).size;
  }

  return { directory, count: frames.length, sourceBytes, outputBytes };
}

const results = [];

for (const directory of FRAME_DIRECTORIES) {
  results.push(await encodeDirectory(directory));
}

let totalSource = 0;
let totalOutput = 0;

for (const result of results) {
  totalSource += result.sourceBytes;
  totalOutput += result.outputBytes;
  console.log(
    `${result.directory}: ${result.count} frames, ` +
      `${Math.round(result.sourceBytes / 1024)}KB -> ${Math.round(result.outputBytes / 1024)}KB`,
  );
}

console.log(
  `total: ${Math.round(totalSource / 1024)}KB -> ${Math.round(totalOutput / 1024)}KB ` +
    `(${100 - Math.round((totalOutput * 100) / totalSource)}% smaller)`,
);
