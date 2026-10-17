const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { test } = require("node:test");
const ts = require("typescript");

// Check transitive imports: removing a directive does not make a component a
// server component if another client component still imports it.
const root = path.resolve(__dirname, "..");
function files(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const location = path.join(directory, entry.name);
    return entry.isDirectory() ? files(location) : [location];
  });
}
const sourceFiles = files(path.join(root, "src")).filter((file) =>
  /\.(?:ts|tsx|json)$/.test(file),
);
const modules = new Map();
for (const file of sourceFiles) {
  const source = fs.readFileSync(file, "utf8");
  const ast = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true);
  modules.set(file, { ast, source });
}
function resolve(from, specifier) {
  const base = specifier.startsWith("@/")
    ? path.join(root, "src", specifier.slice(2))
    : specifier.startsWith(".")
      ? path.resolve(path.dirname(from), specifier)
      : null;
  if (!base) return null;
  return [
    base,
    `${base}.ts`,
    `${base}.tsx`,
    `${base}.json`,
    path.join(base, "index.ts"),
    path.join(base, "index.tsx"),
  ].find((candidate) => modules.has(candidate));
}
function runtimeImports(file, includeDynamic = true) {
  const imports = [];
  const { ast } = modules.get(file);
  function visit(node) {
    if (ts.isImportDeclaration(node)) {
      const clause = node.importClause;
      if (clause?.isTypeOnly) return;
      const bindings = clause?.namedBindings;
      if (
        !clause?.name &&
        bindings &&
        ts.isNamedImports(bindings) &&
        bindings.elements.every((item) => item.isTypeOnly)
      )
        return;
      imports.push(node.moduleSpecifier.text);
    } else if (
      ts.isExportDeclaration(node) &&
      node.moduleSpecifier &&
      !node.isTypeOnly
    ) {
      if (
        node.exportClause &&
        ts.isNamedExports(node.exportClause) &&
        node.exportClause.elements.every((item) => item.isTypeOnly)
      )
        return;
      imports.push(node.moduleSpecifier.text);
    } else if (
      includeDynamic &&
      ts.isCallExpression(node) &&
      node.expression.kind === ts.SyntaxKind.ImportKeyword &&
      ts.isStringLiteral(node.arguments[0])
    ) {
      imports.push(node.arguments[0].text);
    }
    ts.forEachChild(node, visit);
  }
  visit(ast);
  return imports.map((specifier) => resolve(file, specifier)).filter(Boolean);
}
const clients = new Map();
function follow(file, chain) {
  if (clients.has(file)) return;
  clients.set(file, [...chain, file]);
  for (const dependency of runtimeImports(file))
    follow(dependency, clients.get(file));
}
for (const [file, { ast }] of modules) {
  if (
    ast.statements.some(
      (node) =>
        ts.isExpressionStatement(node) &&
        ts.isStringLiteral(node.expression) &&
        node.expression.text === "use client",
    )
  )
    follow(file, []);
}
function assertServer(relative) {
  const file = path.join(root, relative);
  assert.ok(modules.has(file), `Missing server component: ${relative}`);
  assert.ok(
    !clients.has(file),
    `Server content entered the client graph:\n${clients
      .get(file)
      ?.map((item) => path.relative(root, item))
      .join(" -> ")}`,
  );
}
test("all route entry points and shared composition stay outside the client graph", () => {
  for (const file of sourceFiles.filter((file) =>
    /\/app\/(?:.*\/)?(?:page|layout|not-found)\.tsx$/.test(file),
  ))
    assertServer(path.relative(root, file));
  for (const file of [
    "src/components/layout/layout.tsx",
    "src/components/layout/header/header.tsx",
    "src/components/layout/header/menu/menu.tsx",
    "src/components/layout/footer/footer.tsx",
    "src/components/ui/brand-intro/brand-intro.tsx",
    "src/components/ui/VSlider/Vslider.tsx",
    "src/components/ui/VSlider/components/service-slides/service-slides.tsx",
    "src/components/ui/echoView/echoView.tsx",
    "src/components/ui/virtual-tour/components/drag-instruction-icon/drag-instruction-icon.tsx",
  ])
    assertServer(file);
});
test("every page section composes its static content on the server", () => {
  for (const file of [
    "src/components/landing/landing.tsx",
    ...[
      "1-hero/hero",
      "2-design/design",
      "3-visualization/visualization",
      "4-vr/vr",
      "5-media/media",
      "6-how-it-works/how-it-works",
      "7-process/process",
    ].map((section) => `src/components/landing/sections/${section}.tsx`),
    "src/app/[locale]/services/_components/services-hero/services-hero.tsx",
    "src/app/[locale]/services/_components/services-hero/components/service-navigation/service-navigation.tsx",
    "src/app/[locale]/projects/_components/project-catalog/project-catalog.tsx",
    "src/app/[locale]/projects/_components/project-card/project-card.tsx",
    "src/app/[locale]/projects/_components/project-video/project-video.tsx",
    "src/app/[locale]/about/_components/about-content/about-content.tsx",
    "src/app/[locale]/contact/_components/contact-form/contact-form.tsx",
    "src/app/[locale]/contact/_components/contact-info/contact-info.tsx",
    "src/app/[locale]/faq/_components/faq-hero/faq-hero.tsx",
    "src/app/[locale]/faq/_components/faq-section/faq-section.tsx",
    "src/app/[locale]/faq/_components/faq-section/components/faq-item/faq-item.tsx",
  ])
    assertServer(file);
});
test("content collections and social configuration are not shipped as client modules", () => {
  // Every language's copy for a component lives in one module; a client
  // import would ship all four languages to every visitor. `*-runtime.ts`
  // modules hold the few constants client controls need and are exempt.
  for (const file of sourceFiles.filter(
    (file) =>
      /\.copy\.ts$/.test(file) ||
      (/\/_data\//.test(file) && !/-runtime\.ts$/.test(file)),
  ))
    assertServer(path.relative(root, file));
  for (const file of [
    "src/app/[locale]/projects/_data/projects.ts",
    "src/app/[locale]/contact/_data/contact.ts",
    "src/app/[locale]/faq/_data/faq.ts",
    "src/app/[locale]/services/_data/services.ts",
    "src/app/[locale]/about/_data/about.ts",
    "src/app/[locale]/privacyandpolicy/_data/privacy.ts",
    "src/config/studio.ts",
    "src/components/landing/sections/2-design/design.data.json",
    "src/components/landing/sections/3-visualization/visualization.data.json",
  ])
    assertServer(file);
});

test("optional motion controllers are reachable only through dynamic imports", () => {
  function reachable(file, includeDynamic, seen = new Set()) {
    if (seen.has(file)) return seen;
    seen.add(file);
    for (const dependency of runtimeImports(file, includeDynamic))
      reachable(dependency, includeDynamic, seen);
    return seen;
  }
  for (const [owner, controller] of [
    [
      "src/components/layout/header/menu/menu.client.logic.ts",
      "src/components/layout/header/menu/menu.animate.ts",
    ],
    [
      "src/components/ui/pointer-glow/pointer-glow.logic.ts",
      "src/components/ui/pointer-glow/pointer-glow.animate.ts",
    ],
    [
      "src/app/[locale]/projects/_components/project-filter/project-filter.logic.ts",
      "src/app/[locale]/projects/_components/project-filter/project-filter.animate.ts",
    ],
    [
      "src/components/ui/VSlider/VSliderCta.logic.ts",
      "src/components/ui/VSlider/VSliderCta.animate.ts",
    ],
    [
      "src/components/ui/VSlider/components/service-slides/components/service-cta-mouse-area/service-cta-mouse-area.logic.ts",
      "src/components/ui/VSlider/components/service-slides/components/service-cta-mouse-area/service-cta-mouse-area.animate.ts",
    ],
    [
      "src/components/layout/footer/footerButton.logic.ts",
      "src/components/layout/footer/footerButton.animate.ts",
    ],
  ]) {
    const source = path.join(root, owner);
    const animation = path.join(root, controller);
    assert.ok(
      !reachable(source, false).has(animation),
      `${controller} entered the initial import graph`,
    );
    assert.ok(
      reachable(source, true).has(animation),
      `${controller} is missing its dynamic loader`,
    );
  }
});

test("client subcomponents own colocated logic and do not import parent hooks", () => {
  for (const directory of [
    "src/components/layout/header/components",
    "src/components/layout/header/menu/components",
    "src/app/[locale]/projects/_components/project-card/components",
    "src/app/[locale]/projects/_components/project-catalog/components",
    "src/app/[locale]/contact/_components/contact-form/components",
  ]) {
    for (const file of files(path.join(root, directory)).filter((file) =>
      file.endsWith(".tsx"),
    )) {
      const logic = file.replace(/\.tsx$/, ".logic.ts");
      assert.ok(
        modules.has(logic),
        `${path.relative(root, file)} has no owned logic hook`,
      );
      for (const dependency of runtimeImports(file)) {
        assert.ok(
          !dependency.endsWith(".logic.ts") || dependency === logic,
          `${path.relative(root, file)} imports another component's logic`,
        );
      }
    }
  }
});
