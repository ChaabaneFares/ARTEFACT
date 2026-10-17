// Generates the how-it-works Spline scene for every language.
//
//   node scripts/localize-spline-scenes.mjs
//
// The scene's only text is one Spline TextGeometry ("How It Works"), laid out
// at runtime from a TTF by the Spline runtime. A `.splinecode` file is msgpack
// (msgpackr records) with five Spline extension types, which round-trips byte
// for byte, so each language is the English scene with the title, its font,
// its size and its text box changed. Nothing else in the scene moves.
//
// Every scene points at a self-hosted TTF reduced to the glyphs of its own
// title (a few KB) instead of the full 155 KB font the editor exported from
// fonts.gstatic.com, so no language waits on a third-party font at boot.
//
// The matching stills are produced by scripts/how-it-works-stills.html; see
// docs/i18n.doc.md.

import { readFile, writeFile } from "node:fs/promises";
import { addExtension, Packr } from "msgpackr";
import opentype from "opentype.js";
import subsetFont from "subset-font";

const ROOT = new URL(
  "../public/assets/landing-page/how-it-works/",
  import.meta.url,
);
const SOURCE = new URL("am-arc-how-it-works.scene.splinecode", ROOT);

// The editor's export: Poppins SemiBold, the weight of the site's headings.
const POPPINS_600 =
  "https://fonts.gstatic.com/s/poppins/v20/pxiByp8kv8JHgFVrLEj6V1tvFP-KUEg.ttf";

const ARABIC_600 = {
  key: "ReadexPro_600",
  url: "https://fonts.gstatic.com/s/readexpro/v27/SLXnc1bJ7HE5YDoGPuzj_dh8uc7wUy8ZQQyX2KY8TL0kGZN6blTCP0Omgg.ttf",
};

const ENGLISH_TITLE = "How It Works";

/**
 * Each title was chosen to cover the English footprint at the same size, so
 * the section reads the same in every language. `scale` only ever shrinks a
 * title that would otherwise outgrow it.
 */
const TITLES = {
  en: { text: ENGLISH_TITLE, font: { key: "Poppins_600", url: POPPINS_600 } },
  fr: { text: "Le processus", font: { key: "Poppins_600", url: POPPINS_600 } },
  es: { text: "Así funciona", font: { key: "Poppins_600", url: POPPINS_600 } },
  ar: { text: "طريقة العمل", font: ARABIC_600 },
};

class SplineExtension {
  constructor(type, value) {
    this.type = type;
    this.value = value;
  }
}
for (const type of [1, 2, 3, 4, 5, 6]) {
  const Class = class extends SplineExtension {
    constructor(value) {
      super(type, value);
    }
  };
  addExtension({
    Class,
    type,
    write: (instance) => instance.value,
    read: (value) => new Class(value),
  });
}
const codec = new Packr({ structuredClone: true });
const unwrap = (value) =>
  value instanceof SplineExtension ? value.value : value;

function findTextGeometry(scene) {
  const found = [];
  const visit = (node) => {
    const object = unwrap(node);
    if (object?.data?.geometry?.type === "TextGeometry")
      found.push(object.data.geometry);
    for (const child of unwrap(object?.children) ?? []) visit(child);
  };
  for (const node of unwrap(scene.scene.objects)) visit(node);
  if (found.length !== 1)
    throw new Error(`Expected one TextGeometry, found ${found.length}`);
  return found[0];
}

const fontCache = new Map();
async function loadFont(url) {
  if (!fontCache.has(url)) {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`${response.status} ${url}`);
    fontCache.set(url, Buffer.from(await response.arrayBuffer()));
  }
  return fontCache.get(url);
}

function advance(fontBuffer, text, size) {
  const font = opentype.parse(
    fontBuffer.buffer.slice(
      fontBuffer.byteOffset,
      fontBuffer.byteOffset + fontBuffer.byteLength,
    ),
  );
  return font.getAdvanceWidth(text, size, { kerning: true });
}

const source = await readFile(SOURCE);
const template = findTextGeometry(codec.unpack(source));
const englishFont = await loadFont(POPPINS_600);
const englishWidth = advance(englishFont, ENGLISH_TITLE, template.fontSize);
// The editor sized the text box a hair wider than the measured advance.
const boxRatio = template.width / englishWidth;
const heightRatio = template.height / (template.fontSize * template.lineHeight);

for (const [locale, title] of Object.entries(TITLES)) {
  const scene = codec.unpack(source);
  const geometry = findTextGeometry(scene);
  const fontBuffer = await loadFont(title.font.url);
  const naturalWidth = advance(fontBuffer, title.text, template.fontSize);
  const scale = Math.min(1, englishWidth / naturalWidth);
  const fontSize = Number((template.fontSize * scale).toFixed(3));

  const fileName = `how-it-works-${locale}.ttf`;
  const subset = await subsetFont(fontBuffer, title.text, {
    targetFormat: "truetype",
  });
  await writeFile(new URL(`fonts/${fileName}`, ROOT), subset);

  geometry.text = title.text;
  geometry.font = title.font.key;
  geometry.fontSize = fontSize;
  geometry.width = advance(fontBuffer, title.text, fontSize) * boxRatio;
  geometry.height = fontSize * geometry.lineHeight * heightRatio;
  const fonts = unwrap(scene.shared.fonts);
  for (const key of Object.keys(fonts)) delete fonts[key];
  fonts[title.font.key] = {
    name: title.font.key,
    url: `/assets/landing-page/how-it-works/fonts/${fileName}`,
  };

  const output =
    locale === "en"
      ? "am-arc-how-it-works.scene.splinecode"
      : `am-arc-how-it-works.scene.${locale}.splinecode`;
  await writeFile(new URL(output, ROOT), codec.pack(scene));
  console.log(
    `${locale}: "${title.text}" size ${fontSize}, font ${subset.length} B -> ${output}`,
  );
}
