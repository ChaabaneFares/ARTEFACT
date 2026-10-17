// Run against `next start` after a production build. This sends no form data.
import { readFile } from "node:fs/promises";

const base = new URL(process.argv[2] || "http://localhost:3100");
const manifest = JSON.parse(
  await readFile(".next/prerender-manifest.json", "utf8"),
);
const routes = new Set([
  "/",
  "/services",
  "/projects",
  "/about",
  "/contact",
  "/contact?mode=contact",
  "/faq",
  "/privacyandpolicy",
]);
for (const route of Object.keys(manifest.routes)) {
  if (!route.split("/").some((part) => part.startsWith("_"))) routes.add(route);
}
const failures = [];
const assets = new Set();
const links = new Set();
const addAsset = (value, parent = base) => {
  try {
    const url = new URL(decode(value), parent);
    if (url.origin === base.origin) assets.add(`${url.pathname}${url.search}`);
  } catch {
    failures.push({ value, error: "Invalid local asset URL" });
  }
};
const decode = (value) =>
  value
    .replaceAll("&amp;", "&")
    .replaceAll("&#x27;", "'")
    .replaceAll("&quot;", '"');
async function request(path, method = "GET") {
  try {
    const response = await fetch(new URL(path, base), {
      method,
      signal: AbortSignal.timeout(30000),
    });
    const type = response.headers.get("content-type") || "";
    const body =
      method === "GET" && /html|xml|text/.test(type)
        ? await response.text()
        : "";
    if (method === "GET" && !body) await response.arrayBuffer();
    return { response, body };
  } catch (error) {
    failures.push({ path, error: String(error) });
    return null;
  }
}
async function parallel(items, callback) {
  const queue = [...items];
  await Promise.all(
    Array.from({ length: 4 }, async () => {
      while (queue.length) await callback(queue.shift());
    }),
  );
}
await parallel(routes, async (route) => {
  const result = await request(route);
  if (!result) return;
  const { response, body } = result;
  if (response.status !== 200)
    failures.push({ route, status: response.status });
  if (response.headers.get("content-type")?.includes("text/html")) {
    if (!/<main[\s>]/.test(body) || !/<h1[\s>]/.test(body))
      failures.push({
        route,
        error: "Missing server-rendered main or heading",
      });
    // Inspect actual HTML, excluding serialized Flight payloads. Content in a
    // script alone does not prove it was rendered before client hydration.
    const markup = body.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "");
    const requireMarkup = (pattern, section) => {
      if (!pattern.test(markup))
        failures.push({ route, error: `Missing server-rendered ${section}` });
    };
    if (route === "/") {
      for (const id of [
        "projects",
        "visualization",
        "vr",
        "media",
        "how-it-works",
        "process",
      ])
        requireMarkup(new RegExp(`id="${id}"`), `landing section ${id}`);
      requireMarkup(/data-hero-root/, "landing hero");
    }
    if (
      route === "/projects" &&
      (markup.match(/<article[^>]*data-project-card/g) ?? []).length !== 16
    )
      failures.push({
        route,
        error: "Missing initial server-rendered project cards",
      });
    if (
      route === "/faq" &&
      (markup.match(/id="[^"]+-answer"/g) ?? []).length !== 20
    )
      failures.push({ route, error: "Missing server-rendered FAQ answers" });
    if (route === "/services") {
      for (const id of [
        "interior",
        "exterior",
        "rendering",
        "animation",
        "virtual-tour",
      ])
        requireMarkup(new RegExp(`<article[^>]*id="${id}"`), `service ${id}`);
    }
    if (route.startsWith("/contact")) {
      requireMarkup(/id="contact-name"/, "contact name control");
      requireMarkup(/id="contact-email"/, "contact email control");
      requireMarkup(/id="contact-message"/, "contact message control");
      requireMarkup(/Privacy Policy/, "contact privacy information");
      if (route === "/contact") {
        for (const id of ["needs-label", "documents-label", "budgets-label"])
          requireMarkup(new RegExp(`id="${id}"`), `brief group ${id}`);
      }
    }
    if (route === "/about") {
      requireMarkup(/data-about-introduction/, "studio introduction");
      requireMarkup(/data-about-members/, "studio portraits");
      requireMarkup(/data-about-statement/, "studio philosophy");
    }
    if (route === "/privacyandpolicy")
      requireMarkup(/data-privacy-content/, "privacy policy");
    if (route.startsWith("/projects/"))
      requireMarkup(/<img[^>]*alt="[^"]+view 1"/, "selected project image");
    if (!/<link[^>]*rel="canonical"/.test(body))
      failures.push({ route, error: "Missing canonical URL" });
    const shouldHaveFooter =
      !route.startsWith("/projects/") && !route.startsWith("/contact");
    if (/<section[^>]*\sdata-footer-root/.test(body) !== shouldHaveFooter)
      failures.push({ route, error: "Incorrect shared footer composition" });
    if (!shouldHaveFooter && body.includes("data-footer-root"))
      failures.push({
        route,
        error: "Hidden shared footer leaked into RSC payload",
      });
    if (
      shouldHaveFooter &&
      !body.includes("/assets/brand/vawzen-wordmark-stacked.svg")
    )
      failures.push({ route, error: "Missing Vawzen footer credit" });
    if ((body.match(/data-brand-intro/g) ?? []).length !== 1)
      failures.push({
        route,
        error: "Missing or duplicate initial brand intro",
      });
    if (!/<a[^>]*class="[^"]*quoteButton/.test(body))
      failures.push({ route, error: "Missing header estimate CTA" });
    if (!/<img[^>]*src="\/assets\/brand\/artefact-logo\.svg"/.test(body))
      failures.push({ route, error: "Missing Artefact header logo" });
  }
  for (const match of body.matchAll(
    /<(?:img|source|video|script|link)[^>]*\s(?:src|href)="([^"]+)"/g,
  )) {
    addAsset(match[1]);
  }
  for (const match of body.matchAll(/\s(?:srcset|imagesrcset)="([^"]+)"/gi)) {
    for (const candidate of match[1].split(","))
      addAsset(candidate.trim().split(/\s+/)[0]);
  }
  for (const match of body.matchAll(/<video[^>]*\sposter="([^"]+)"/g)) {
    addAsset(match[1]);
  }
  for (const match of body.matchAll(/<a[^>]*href="([^"]+)"/g)) {
    const url = new URL(decode(match[1]), base);
    if (url.origin === base.origin && !url.pathname.startsWith("/_next/"))
      links.add(url.pathname);
  }
});
await parallel(
  [...links].filter((link) => !routes.has(link)),
  async (link) => {
    const result = await request(link, "HEAD");
    if (result && result.response.status !== 200)
      failures.push({ link, status: result.response.status });
  },
);
const checkedAssets = new Set();
while (checkedAssets.size < assets.size) {
  await parallel(
    [...assets].filter((asset) => !checkedAssets.has(asset)),
    async (asset) => {
      checkedAssets.add(asset);
      // Next's image optimizer serves GET, but can reject HEAD with 400.
      const css = new URL(asset, base).pathname.endsWith(".css");
      const result = await request(
        asset,
        css || asset.startsWith("/_next/image?") ? "GET" : "HEAD",
      );
      if (result && !result.response.ok)
        failures.push({ asset, status: result.response.status });
      if (css && result) {
        for (const match of result.body.matchAll(
          /url\(\s*['"]?([^'")\s]+)['"]?\s*\)/g,
        )) {
          addAsset(match[1], new URL(asset, base));
        }
      }
    },
  );
}
for (const path of [
  "/production-audit-missing",
  "/landing/sections/1-hero/hero",
  "/projects/production-audit-missing",
]) {
  const result = await request(path);
  if (
    result &&
    (result.response.status !== 404 || !result.body.includes("Back to home"))
  )
    failures.push({ path, error: "Missing usable 404 response" });
}
console.log(
  JSON.stringify(
    {
      base: base.origin,
      routes: routes.size,
      internalLinks: links.size,
      assets: assets.size,
      failures,
    },
    null,
    2,
  ),
);
if (failures.length) process.exitCode = 1;
