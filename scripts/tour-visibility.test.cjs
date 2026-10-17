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
      "../src/components/ui/virtual-tour/virtual-tour-client.logic.ts",
    ),
    "utf8",
  ),
  { compilerOptions: { module: ts.ModuleKind.CommonJS } },
).outputText;

function eventDocument() {
  const listeners = new Map();
  return {
    fullscreenElement: null,
    addEventListener(type, callback, capture) {
      if (!listeners.has(type)) listeners.set(type, new Map());
      listeners.get(type).set(callback, capture);
    },
    removeEventListener(type, callback) {
      listeners.get(type)?.delete(callback);
    },
    // Legacy fullscreen notifications can originate on a non-bubbling child.
    emit(type, bubbles = true) {
      for (const [callback, capture] of listeners.get(type) ?? []) {
        if (bubbles || capture) callback();
      }
    },
    get listenerCount() {
      return [...listeners.values()].reduce(
        (sum, entries) => sum + entries.size,
        0,
      );
    },
  };
}

function mountTour() {
  const states = [];
  const refs = [];
  const effects = [];
  const pending = [];
  const observers = [];
  const frames = new Map();
  const document = eventDocument();
  const tourDocument = eventDocument();
  const locks = [];
  let stateIndex = 0;
  let refIndex = 0;
  let effectIndex = 0;
  let frameId = 0;
  let current;
  const iframe = {
    contentDocument: tourDocument,
    contentWindow: {
      document: {
        getElementById: () => ({ offsetWidth: 2560, offsetHeight: 1440 }),
      },
      pano: {
        getIsLoaded: () => true,
        getIsTileLoading: () => false,
        getPan: () => 30,
        getTilt: () => 0,
        getFov: () => 70,
        setLocked: (locked) => locks.push(locked),
        setPanTiltFov() {},
      },
    },
  };
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
    useEffect(callback, dependencies) {
      const index = effectIndex++;
      const previous = effects[index];
      if (
        previous &&
        dependencies.every((value, i) =>
          Object.is(value, previous.dependencies[i]),
        )
      )
        return;
      pending.push(() => {
        previous?.cleanup?.();
        effects[index] = { dependencies, cleanup: callback() };
      });
    },
  };
  const never = new Promise(() => {});
  const mocks = {
    react,
    "@/lib/landing3d/mediaScheduler": {
      whenLandingMediaIdle: () => never,
      whenLandingMediaNearIdle: () => never,
    },
    "@/lib/landing3d/sceneBootGate": { waitForScrollQuiet: () => never },
  };
  const exports = {};
  vm.runInNewContext(source, {
    exports,
    document,
    window: {
      IntersectionObserver: true,
      requestAnimationFrame(callback) {
        frames.set(++frameId, callback);
        return frameId;
      },
      cancelAnimationFrame: (id) => frames.delete(id),
    },
    IntersectionObserver: class {
      constructor(callback, options) {
        this.callback = callback;
        this.margin = options.rootMargin;
        observers.push(this);
      }
      observe() {
        this.connected = true;
      }
      disconnect() {
        this.connected = false;
      }
    },
    require(name) {
      assert.ok(name in mocks, `Unexpected import ${name}`);
      return mocks[name];
    },
  });
  const render = () => {
    stateIndex = refIndex = effectIndex = 0;
    current = exports.useVirtualTourLogic();
    current.iframeRef.current = iframe;
    current.tourRef.current = {};
    pending.splice(0).forEach((callback) => {
      callback();
    });
  };
  const flush = () => {
    const callbacks = [...frames.values()];
    frames.clear();
    callbacks.forEach((callback) => {
      callback();
    });
    render();
  };
  render();
  current.updateTourReadyState();
  render();
  return {
    document,
    tourDocument,
    iframe,
    locks,
    render,
    flush,
    get current() {
      return current;
    },
    offscreen() {
      observers
        .filter((observer) => observer.connected)
        .forEach((observer) => {
          observer.callback([{ isIntersecting: false }]);
        });
      render();
    },
    unmount() {
      effects.forEach((effect) => {
        effect.cleanup?.();
      });
      assert.equal(document.listenerCount, 0);
      assert.equal(tourDocument.listenerCount, 0);
      assert.equal(frames.size, 0);
      assert.ok(observers.every((observer) => !observer.connected));
    },
  };
}

test("fullscreen survives offscreen resize notifications and keeps the tour interactive", () => {
  const tour = mountTour();
  tour.document.fullscreenElement = tour.iframe;
  tour.tourDocument.emit("webkitfullscreenchange", false);
  // Resizing to the monitor's width moves the page section outside its viewport.
  tour.offscreen();
  tour.flush();
  assert.equal(tour.current.isTourParked, false);
  assert.equal(tour.current.isTourVisible, true);
  assert.equal(tour.locks.at(-1), false);
  tour.unmount();
});

test("Escape restores offscreen parking and the next entry resumes the tour", () => {
  const tour = mountTour();
  tour.offscreen();
  assert.equal(tour.current.isTourParked, true);
  for (const fullscreen of [true, false, true]) {
    tour.document.fullscreenElement = fullscreen ? tour.iframe : null;
    tour.tourDocument.emit("fullscreenchange", false);
    tour.flush();
    assert.equal(tour.current.isTourParked, !fullscreen);
    assert.equal(tour.locks.at(-1), !fullscreen);
  }
  // A queued update must not run after the tour is removed.
  tour.tourDocument.emit("webkitfullscreenchange", false);
  tour.unmount();
});

test("another element entering fullscreen does not unpark the tour", () => {
  const tour = mountTour();
  tour.offscreen();
  tour.document.fullscreenElement = {};
  tour.document.emit("fullscreenchange");
  tour.flush();
  assert.equal(tour.current.isTourParked, true);
  assert.equal(tour.current.isTourVisible, false);
  tour.unmount();
});
