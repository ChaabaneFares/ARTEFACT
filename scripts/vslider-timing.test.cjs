const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { test } = require("node:test");
const vm = require("node:vm");
const ts = require("typescript");

const source = ts.transpileModule(
  fs.readFileSync(
    path.join(
      __dirname,
      "../src/components/ui/VSlider/VSliderAnimations.logic.ts",
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

// Run the real controller against the original image-height rows, exercising
// registered scroll/resize callbacks without duplicating its math.
function mountSlider({ height = 900, rowHeight = 400, count = 3 } = {}) {
  const window = new EventTarget();
  Object.assign(window, { innerHeight: height, scrollY: 0 });
  const rootTop = 5000;
  const callbacks = new Map();
  let cleanup;
  let observer;
  let reads = 0;
  const rows = Array.from({ length: count }, (_, index) => ({
    getBoundingClientRect() {
      reads++;
      return {
        top:
          rootTop +
          (window.innerHeight - rowHeight) * 0.5 +
          index * rowHeight -
          window.scrollY,
        height: rowHeight,
      };
    },
  }));
  const images = rows.map(() => ({ style: {} }));
  const layers = images.map((image) => ({
    style: {},
    querySelector: () => image,
  }));
  const root = {
    querySelectorAll(selector) {
      if (selector === ".desktopProject") return rows;
      if (selector === ".desktopMediaLayer") return layers;
      return [];
    },
  };
  const mocks = {
    react: {
      useEffect: (effect) => {
        cleanup = effect();
      },
    },
    "next/navigation": { usePathname: () => "/" },
    "@/store/dimensionsStore": { dimensionsStore: () => ({ vw: 1366 }) },
    "./VSlider.module.css": {
      default: {
        desktopProject: "desktopProject",
        desktopMediaLayer: "desktopMediaLayer",
      },
    },
    "@/lib/scrollInteraction/createDOMCache": {
      createDOMCache: () => ({
        get: (_key, read) => read(),
        getAll: (_key, read) => read(),
        clear() {},
      }),
    },
    "@/lib/scrollInteraction/createInstanceRegistry": {
      createInstanceRegistry: () => ({ add() {}, remove() {} }),
    },
    "@/lib/scrollInteraction/createSmartStyleSetter": {
      createBatchStyleSetter: () => ({
        set: (element, property, value) => {
          element.style[property] = value;
        },
      }),
    },
    "@/lib/scrollInteraction/scrollTrigger": {
      createRAFBatch: () => ({
        schedule: (_key, callback) => callback(),
        cancel() {},
      }),
      getScrollTrigger: () => ({ removeInstance() {} }),
      kickScroll() {},
    },
    "@/lib/scrollInteraction/scrollManager": {
      default: {
        createInstance: (id, callback) => {
          callbacks.set(id, callback);
          return {};
        },
        removeInstance: (id) => callbacks.delete(id),
      },
    },
  };
  const exports = {};
  vm.runInNewContext(source, {
    exports,
    window,
    document: { contains: () => true, querySelector: () => root },
    require: (name) => {
      assert.ok(name in mocks, `Unexpected import ${name}`);
      return mocks[name];
    },
    ResizeObserver: class {
      constructor(callback) {
        this.callback = callback;
        observer = this;
      }
      observe() {
        this.connected = true;
      }
      disconnect() {
        this.connected = false;
      }
    },
  });
  exports.useVSliderAnimations("test");
  return {
    images,
    layers,
    rootTop,
    get reads() {
      return reads;
    },
    scroll(offset) {
      window.scrollY = rootTop + offset;
      callbacks.forEach((callback) => {
        callback();
      });
    },
    resize(height) {
      window.innerHeight = height;
      window.dispatchEvent(new Event("resize"));
    },
    contentResize(nextRowHeight = rowHeight) {
      rowHeight = nextRowHeight;
      observer.callback();
    },
    cleanup() {
      cleanup();
      assert.equal(callbacks.size, 0);
      assert.equal(observer.connected, false);
      layers.forEach((layer) => {
        assert.equal(layer.style.clipPath, "");
      });
      images.forEach((image) => {
        assert.equal(image.style.objectPosition, "");
      });
    },
  };
}
function clip(layer) {
  return Number(layer.style.clipPath.match(/([\d.]+)%/)[1]);
}

test("the first image stays centered and uncut throughout entry", () => {
  const slider = mountSlider();
  for (const offset of [-450, -100, 0]) {
    slider.scroll(offset);
    assert.equal(clip(slider.layers[0]), 0);
    assert.equal(slider.images[0].style.objectPosition, "center 50%");
  }
  slider.cleanup();
});
test("every wipe keeps the original row distance and the 50 to 60 percent crop", () => {
  const slider = mountSlider();
  slider.scroll(100);
  assert.equal(clip(slider.layers[0]), 25);
  assert.equal(slider.images[0].style.objectPosition, "center 52.5%");
  slider.scroll(400);
  assert.equal(clip(slider.layers[0]), 100);
  assert.equal(clip(slider.layers[1]), 0);
  slider.scroll(600);
  assert.equal(clip(slider.layers[1]), 50);
  slider.scroll(800);
  assert.equal(clip(slider.layers[1]), 100);
  assert.equal(clip(slider.layers[2]), 0);
  assert.equal(slider.images[2].style.objectPosition, "center 50%");
  slider.cleanup();
});
test("reverse scrolling restores the full first image without layout reads", () => {
  const slider = mountSlider();
  const initialReads = slider.reads;
  slider.scroll(1500);
  slider.scroll(0);
  assert.equal(clip(slider.layers[0]), 0);
  assert.equal(clip(slider.layers[1]), 0);
  assert.equal(slider.reads, initialReads);
  slider.cleanup();
});
test("height-only viewport changes preserve centered entry and compact wipe distance", () => {
  const slider = mountSlider();
  slider.scroll(200);
  assert.equal(clip(slider.layers[0]), 50);
  const initialReads = slider.reads;
  slider.resize(600);
  assert.ok(slider.reads > initialReads);
  assert.equal(clip(slider.layers[0]), 50);
  slider.scroll(400);
  assert.equal(clip(slider.layers[1]), 0);
  slider.contentResize(600);
  assert.ok(Math.abs(clip(slider.layers[0]) - 200 / 3) < 0.0001);
  assert.equal(clip(slider.layers[1]), 0);
  slider.scroll(600);
  assert.equal(clip(slider.layers[0]), 100);
  assert.equal(clip(slider.layers[1]), 0);
  slider.cleanup();
});
