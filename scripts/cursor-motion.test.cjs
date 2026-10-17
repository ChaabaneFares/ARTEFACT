const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");
const ts = require("typescript");

// Exercise the real hook with a controlled browser clock and frame scheduler.
// DOM rendering and React mounting are also checked in the browser.
function mountCursor({ reducedMotion = false } = {}) {
  let now = 0;
  let nextFrame = 0;
  const frames = new Map();
  const cleanups = [];
  const effects = [];
  const shape = { style: {} };
  const label = { textContent: "" };
  const cursor = {
    dataset: {},
    style: {
      setProperty(name, value) {
        this[name] = value;
      },
    },
    querySelector(selector) {
      return selector === "[data-cursor-shape]" ? shape : label;
    },
  };
  const window = new EventTarget();
  const motion = new EventTarget();
  motion.matches = reducedMotion;
  const pointer = new EventTarget();
  pointer.matches = true;
  window.matchMedia = (query) =>
    query.includes("reduced-motion") ? motion : pointer;
  let refIndex = 0;
  const react = {
    useRef: (initial) => ({ current: refIndex++ === 0 ? cursor : initial }),
    useState: () => [true, () => {}],
    useEffect: (effect) => effects.push(effect),
  };
  const context = vm.createContext({
    window,
    performance: { now: () => now },
    requestAnimationFrame: (callback) => {
      frames.set(++nextFrame, callback);
      return nextFrame;
    },
    cancelAnimationFrame: (id) => frames.delete(id),
  });
  window.cancelAnimationFrame = context.cancelAnimationFrame;
  const modules = new Map();
  const load = (filename) => {
    if (modules.has(filename)) return modules.get(filename);
    const source = ts.transpileModule(readFileSync(filename, "utf8"), {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2020,
      },
    }).outputText;
    const module = { exports: {} };
    modules.set(filename, module.exports);
    const requireModule = (name) =>
      name === "react"
        ? react
        : load(path.resolve(path.dirname(filename), `${name}.ts`));
    vm.runInContext(
      `(function(require, module, exports) {${source}\n})`,
      context,
    )(requireModule, module, module.exports);
    return module.exports;
  };
  load(
    path.resolve(__dirname, "../src/components/ui/cursor/cursor.logic.ts"),
  ).useCursorTrail();
  effects.forEach((effect) => {
    cleanups.push(effect());
  });

  return {
    cursor,
    shape,
    frames,
    move(time, x, y) {
      now = time;
      const event = new Event("mousemove");
      Object.assign(event, { clientX: x, clientY: y, buttons: 0 });
      window.dispatchEvent(event);
    },
    frame(time) {
      now = time;
      const pending = [...frames.values()];
      frames.clear();
      pending.forEach((callback) => {
        callback(time);
      });
    },
    position() {
      const [, x, y] = cursor.style.transform.match(
        /translate3d\(([-\d.]+)px, ([-\d.]+)px/,
      );
      return { x: Number(x) + 24, y: Number(y) + 24 };
    },
    reduceMotion() {
      motion.matches = true;
      motion.dispatchEvent(new Event("change"));
    },
    cleanup() {
      cleanups.forEach((cleanup) => {
        cleanup?.();
      });
    },
  };
}

test("frequent mouse events cannot restart or starve cursor motion", () => {
  const trajectories = [16, 4, 1].map((pollInterval) => {
    const runtime = mountCursor();
    const positions = [];
    let nextEvent = 0;
    for (let frame = 1; frame <= 30; frame++) {
      const time = (frame * 1000) / 60;
      while (nextEvent < time) {
        runtime.move(nextEvent, 1000, 300);
        nextEvent += pollInterval;
      }
      runtime.frame(time);
      positions.push(runtime.position());
    }
    runtime.cleanup();
    return positions;
  });
  assert.ok(trajectories[0][17].x > 400, "the dot must keep advancing");
  for (const positions of trajectories.slice(1)) {
    positions.forEach((position, frame) => {
      assert.ok(Math.abs(position.x - trajectories[0][frame].x) < 0.001);
      assert.ok(Math.abs(position.y - trajectories[0][frame].y) < 0.001);
    });
  }
});

test("the same elapsed time gives the same trail at 60Hz and 120Hz", () => {
  const positions = [60, 120].map((refreshRate) => {
    const runtime = mountCursor();
    runtime.move(0, 1000, 300);
    for (let frame = 1; frame <= refreshRate / 2; frame++) {
      runtime.frame((frame * 1000) / refreshRate);
    }
    const position = runtime.position();
    runtime.cleanup();
    return position;
  });
  assert.ok(Math.abs(positions[0].x - positions[1].x) < 0.001);
  assert.ok(Math.abs(positions[0].y - positions[1].y) < 0.001);
});

test("the cursor settles, restarts after idle, and cancels on cleanup", () => {
  const runtime = mountCursor();
  runtime.move(0, 200, 100);
  for (let time = 16; time <= 4000; time += 16) runtime.frame(time);
  assert.deepEqual(runtime.position(), { x: 200, y: 100 });
  assert.equal(runtime.frames.size, 0);
  assert.equal(runtime.shape.style.transform, "scale(0.22)");
  runtime.move(10000, 1000, 300);
  runtime.frame(10016);
  assert.ok(runtime.position().x > 200 && runtime.position().x < 300);
  assert.equal(runtime.frames.size, 1);
  runtime.cleanup();
  assert.equal(runtime.frames.size, 0);
  runtime.move(10032, 1500, 600);
  assert.equal(runtime.frames.size, 0);
});

test("reduced motion immediately reaches the pointer and stops frames", () => {
  const runtime = mountCursor();
  runtime.move(0, 1000, 300);
  runtime.frame(16);
  runtime.reduceMotion();
  runtime.frame(32);
  assert.deepEqual(runtime.position(), { x: 1000, y: 300 });
  assert.equal(runtime.shape.style.transform, "scale(0.22)");
  assert.equal(runtime.frames.size, 0);
  runtime.cleanup();
});
