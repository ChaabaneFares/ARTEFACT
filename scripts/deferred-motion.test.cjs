const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { test } = require("node:test");
const vm = require("node:vm");
const ts = require("typescript");

const source = ts.transpileModule(
  fs.readFileSync(
    path.join(__dirname, "../src/lib/useDeferredMotion.ts"),
    "utf8",
  ),
  {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  },
).outputText;
function mount({ observerAvailable = true } = {}) {
  let dispose;
  let observer;
  let loads = 0;
  let starts = 0;
  let releases = 0;
  let resolve;
  const module = new Promise((done) => {
    resolve = done;
  });
  const exports = {};
  const target = {};
  vm.runInNewContext(source, {
    exports,
    require: (name) => {
      assert.equal(name, "react");
      return {
        useEffect: (effect) => {
          dispose = effect();
        },
      };
    },
    IntersectionObserver: observerAvailable
      ? class {
          constructor(callback) {
            this.callback = callback;
            observer = this;
          }
          observe(element) {
            assert.equal(element, target);
            this.connected = true;
          }
          disconnect() {
            this.connected = false;
          }
        }
      : undefined,
  });
  exports.useDeferredMotion({ current: target }, () => {
    loads++;
    return module;
  });
  return {
    get loads() {
      return loads;
    },
    get starts() {
      return starts;
    },
    get releases() {
      return releases;
    },
    visible(value) {
      observer.callback([{ isIntersecting: value }]);
    },
    unmount() {
      dispose();
    },
    async loaded() {
      resolve((element) => {
        assert.equal(element, target);
        starts++;
        return () => {
          releases++;
        };
      });
      await module;
      await Promise.resolve();
    },
  };
}
test("offscreen motion waits for visibility and starts once", async () => {
  const motion = mount();
  motion.visible(false);
  assert.equal(motion.loads, 0);
  motion.visible(true);
  motion.visible(true);
  assert.equal(motion.loads, 1);
  await motion.loaded();
  assert.equal(motion.starts, 1);
  motion.unmount();
  assert.equal(motion.releases, 1);
});
test("an unmounted control cannot start a pending controller", async () => {
  const motion = mount();
  motion.visible(true);
  motion.unmount();
  await motion.loaded();
  assert.equal(motion.starts, 0);
  assert.equal(motion.releases, 0);
});
test("a queued visibility callback after unmount cannot request motion", async () => {
  const motion = mount();
  motion.unmount();
  motion.visible(true);
  assert.equal(motion.loads, 0);
  await motion.loaded();
  assert.equal(motion.starts, 0);
});
test("motion remains available when IntersectionObserver is unavailable", async () => {
  const motion = mount({ observerAvailable: false });
  assert.equal(motion.loads, 1);
  await motion.loaded();
  assert.equal(motion.starts, 1);
  motion.unmount();
  assert.equal(motion.releases, 1);
});
