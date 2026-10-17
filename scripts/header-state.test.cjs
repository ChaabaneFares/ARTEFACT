const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");
const ts = require("typescript");

// Exercise the real hook across scroll, resize, menu and footer state changes.
function mountHeader({ width = 1366, scrollY = 0 } = {}) {
  const states = [];
  const refs = [];
  const effects = [];
  const scrollCallbacks = new Map();
  const lenisCallbacks = new Set();
  const lenis = {
    isScrolling: false,
    targetScroll: scrollY,
    on: (_event, callback) => lenisCallbacks.add(callback),
    off: (_event, callback) => lenisCallbacks.delete(callback),
  };
  const timers = new Map();
  const observers = [];
  const window = new EventTarget();
  Object.assign(window, {
    innerWidth: width,
    scrollY,
    matchMedia: () => ({ matches: false }),
  });
  let footerActive = false;
  let stateIndex = 0;
  let refIndex = 0;
  let effectIndex = 0;
  let timerId = 0;
  let current;
  const react = {
    useState(initial) {
      const index = stateIndex++;
      if (!(index in states)) states[index] = initial;
      return [
        states[index],
        (value) => {
          states[index] =
            typeof value === "function" ? value(states[index]) : value;
        },
      ];
    },
    useRef(initial) {
      const index = refIndex++;
      refs[index] ??= { current: initial };
      return refs[index];
    },
    useCallback: (callback) => callback,
    useEffect(effect, dependencies) {
      const index = effectIndex++;
      const previous = effects[index];
      if (
        previous &&
        dependencies.every((value, i) =>
          Object.is(value, previous.dependencies[i]),
        )
      )
        return;
      previous?.cleanup?.();
      effects[index] = { dependencies, cleanup: effect() };
    },
  };
  const source = ts.transpileModule(
    readFileSync(
      path.resolve(
        __dirname,
        "../src/components/layout/header/header.client.logic.ts",
      ),
      "utf8",
    ),
    {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
      },
    },
  ).outputText;
  const exports = {};
  const mocks = {
    react,
    "next/navigation": { usePathname: () => "/" },
    "@/components/ui/cursor/cursor.effects": { clearCursorBlend() {} },
    "@/lib/lenis": { initLenis: () => lenis, startLenis() {}, stopLenis() {} },
    "@/lib/scrollInteraction/scrollManager": {
      default: {
        createInstance: (id, callback) => scrollCallbacks.set(id, callback),
        removeInstance: (id) => scrollCallbacks.delete(id),
      },
    },
  };
  vm.runInNewContext(source, {
    exports,
    require: (name) => {
      assert.ok(name in mocks, `Unexpected import ${name}`);
      return mocks[name];
    },
    window,
    document: { body: {}, querySelector: () => (footerActive ? {} : null) },
    setTimeout: (callback) => {
      timers.set(++timerId, callback);
      return timerId;
    },
    clearTimeout: (id) => timers.delete(id),
    MutationObserver: class {
      constructor(callback) {
        this.callback = callback;
        observers.push(this);
      }
      observe(_target, options) {
        this.connected = true;
        this.options = options;
      }
      disconnect() {
        this.connected = false;
      }
    },
  });
  const render = () => {
    stateIndex = refIndex = effectIndex = 0;
    current = exports.useHeaderLogic();
    return current;
  };
  render();
  render(); // Reflect synchronous mount measurements.
  return {
    get state() {
      return current;
    },
    scroll(y) {
      lenis.isScrolling = false;
      window.scrollY = y;
      scrollCallbacks.forEach((callback) => {
        callback();
      });
      return render();
    },
    smoothScroll(actual, target) {
      window.scrollY = actual;
      lenis.isScrolling = true;
      lenis.targetScroll = target;
      lenisCallbacks.forEach((callback) => {
        callback();
      });
      return render();
    },
    resize(width) {
      window.innerWidth = width;
      window.dispatchEvent(new Event("resize"));
      return render();
    },
    toggle() {
      current.toggleMenu();
      return render();
    },
    close() {
      current.closeMenu();
      render();
      [...timers.values()].forEach((callback) => {
        callback();
      });
      timers.clear();
      return render();
    },
    footer(active) {
      footerActive = active;
      observers
        .filter((observer) => observer.connected)
        .forEach((observer) => {
          observer.callback();
        });
      return render();
    },
    removeFooter() {
      footerActive = false;
      observers
        .filter((observer) => observer.connected && observer.options.childList)
        .forEach((observer) => {
          observer.callback([{ type: "childList" }]);
        });
      return render();
    },
    cleanup() {
      effects.forEach((effect) => {
        effect.cleanup?.();
      });
      assert.equal(scrollCallbacks.size, 0);
      assert.equal(lenisCallbacks.size, 0);
      assert.ok(observers.every((observer) => !observer.connected));
    },
  };
}

test("desktop swaps the brand and hides links only beyond the 10px boundary", () => {
  const header = mountHeader();
  assert.equal(header.state.hasScrolled, false);
  assert.equal(header.scroll(10).hideTopLinks, false);
  assert.equal(header.scroll(11).hasScrolled, true);
  assert.equal(header.state.hideTopLinks, true);
  assert.equal(header.scroll(5).hideTopLinks, false);
  header.cleanup();
});

test("removing an active footer on navigation restores the estimate", () => {
  const header = mountHeader();
  assert.equal(header.footer(true).hideQuoteButton, true);
  assert.equal(header.removeFooter().hideQuoteButton, false);
  header.cleanup();
});

test("mobile keeps the symbol even when scrolling and updates on resize", () => {
  const header = mountHeader({ width: 390, scrollY: 400 });
  assert.equal(header.state.hasScrolled, false);
  assert.equal(header.resize(769).hasScrolled, true);
  assert.equal(header.resize(768).hasScrolled, false);
  header.cleanup();
});

test("menu hiding is independent of brand switching and preserves scroll state", () => {
  const header = mountHeader();
  assert.equal(header.toggle().hideTopLinks, true);
  assert.equal(header.state.hasScrolled, false);
  assert.equal(header.close().hideTopLinks, false);
  header.scroll(100);
  header.toggle();
  assert.equal(header.close().hideTopLinks, true);
  assert.equal(header.state.hasScrolled, true);
  header.cleanup();
});

test("estimate visibility follows the reversible footer boundary", () => {
  const header = mountHeader();
  assert.equal(header.state.hideQuoteButton, false);
  assert.equal(header.footer(true).hideQuoteButton, true);
  assert.equal(header.footer(false).hideQuoteButton, false);
  header.cleanup();
});

test("returning to the top reveals the brand before smooth scrolling settles", () => {
  const header = mountHeader({ scrollY: 1000 });
  assert.equal(header.state.hasScrolled, true);
  assert.equal(header.smoothScroll(900, 0).hasScrolled, false);
  assert.equal(header.state.hideTopLinks, false);
  assert.equal(header.smoothScroll(2, 11).hasScrolled, true);
  assert.equal(header.smoothScroll(200, 10).hasScrolled, false);
  header.cleanup();
});
