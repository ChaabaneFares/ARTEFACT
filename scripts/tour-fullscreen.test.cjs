const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { test } = require("node:test");
const vm = require("node:vm");

const source = fs.readFileSync(
  path.join(__dirname, "../public/vr/03-Home/Output/skin.js"),
  "utf8",
);

function mountSkin({ fullscreen = false, acceptRequests = true } = {}) {
  const element = () => ({
    style: { transform: "" },
    childNodes: [],
    setAttribute(name, value) {
      if (name !== "style") return;
      for (const declaration of value.split(";")) {
        const [property, content] = declaration.split(":");
        if (content) this.style[property.trim()] = content.trim();
      }
    },
    appendChild(child) {
      child.parentNode = this;
      this.childNodes.push(child);
    },
    hasChildNodes() {
      return this.childNodes.length > 0;
    },
  });
  const listeners = new Map();
  const calls = [];
  const changeFullscreen = (next) => {
    fullscreen = next;
    listeners
      .get(next ? "fullscreenenter" : "fullscreenexit")
      ?.forEach((listener) => {
        listener();
      });
  };
  const player = {
    divSkin: element(),
    userdata: {},
    setMargins() {},
    getIsFullscreen: () => fullscreen,
    enterFullscreen() {
      calls.push("enter");
      if (acceptRequests) changeFullscreen(true);
    },
    exitFullscreen() {
      calls.push("exit");
      if (acceptRequests) changeFullscreen(false);
    },
    addListener(event, listener) {
      if (!listeners.has(event)) listeners.set(event, []);
      listeners.get(event).push(listener);
    },
  };
  const context = {
    document: {
      body: element(),
      head: element(),
      createElement: element,
      createTextNode: () => element(),
    },
  };
  vm.runInNewContext(source, context);
  const skin = new context.pano2vrSkin(player);
  return { skin, calls, changeFullscreen };
}

function expectButton(skin, fullscreen) {
  assert.equal(skin._svg_2.ggVisible, fullscreen);
  assert.equal(skin._svg_3.ggVisible, !fullscreen);
  assert.equal(skin._svg_2.style.visibility, fullscreen ? "inherit" : "hidden");
  assert.equal(skin._svg_3.style.visibility, fullscreen ? "hidden" : "inherit");
}

test("double-click or context-menu entry updates the fullscreen button", () => {
  const { skin, changeFullscreen } = mountSkin();
  expectButton(skin, false);
  changeFullscreen(true);
  expectButton(skin, true);
});

test("Escape restores the enter button and the next click enters immediately", () => {
  const { skin, calls, changeFullscreen } = mountSkin();
  skin._svg_3.onclick();
  expectButton(skin, true);
  changeFullscreen(false);
  expectButton(skin, false);
  skin._svg_3.onclick();
  expectButton(skin, true);
  skin._svg_2.onclick();
  expectButton(skin, false);
  assert.deepEqual(calls, ["enter", "enter", "exit"]);
});

test("the initial icon reflects an already fullscreen player", () => {
  const { skin } = mountSkin({ fullscreen: true });
  expectButton(skin, true);
});

test("a request without a fullscreen change leaves the current icon intact", () => {
  const { skin } = mountSkin({ acceptRequests: false });
  skin._svg_3.onclick();
  expectButton(skin, false);
});
