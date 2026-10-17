import type { Application } from "@splinetool/runtime";
import type { TransformState } from "./spline.shared";

type SceneDiagnosticState = Record<
  string,
  boolean | number | string | null | undefined
>;

type SceneDiagnosticInput = {
  sceneId: string;
  reason: string;
  host: HTMLElement | null;
  canvas: HTMLCanvasElement | null;
  runtimeApp: Application | null;
  sceneObject: unknown;
  baseTransform: TransformState | null;
  targetTransform: TransformState | null;
  state: SceneDiagnosticState;
};

type NumericVector = {
  x?: unknown;
  y?: unknown;
  z?: unknown;
  w?: unknown;
};

const DIAGNOSTIC_PREFIX = "[LANDING3D]";

function asRecord(value: unknown): Record<string, unknown> | null {
  if (typeof value !== "object" || value === null) {
    return null;
  }

  return value as Record<string, unknown>;
}

function round(value: number): number {
  return Math.round(value * 1000) / 1000;
}

function readNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value)
    ? round(value)
    : null;
}

function readVector(value: unknown) {
  const vector = asRecord(value) as NumericVector | null;

  if (!vector) {
    return null;
  }

  return {
    x: readNumber(vector.x),
    y: readNumber(vector.y),
    z: readNumber(vector.z),
    w: readNumber(vector.w),
  };
}

function readSceneObject(value: unknown) {
  const object = asRecord(value);

  if (!object) {
    return null;
  }

  return {
    name: typeof object.name === "string" ? object.name : null,
    uuid: typeof object.uuid === "string" ? object.uuid : null,
    type: typeof object.type === "string" ? object.type : null,
    visible: typeof object.visible === "boolean" ? object.visible : null,
    position: readVector(object.position),
    rotation: readVector(object.rotation),
    scale: readVector(object.scale),
    quaternion: readVector(object.quaternion),
    zoom: readNumber(object.zoom),
    aspect: readNumber(object.aspect),
    fov: readNumber(object.fov),
    left: readNumber(object.left),
    right: readNumber(object.right),
    top: readNumber(object.top),
    bottom: readNumber(object.bottom),
    near: readNumber(object.near),
    far: readNumber(object.far),
  };
}

function readRect(node: Element) {
  const rect = node.getBoundingClientRect();

  return {
    x: round(rect.x),
    y: round(rect.y),
    top: round(rect.top),
    right: round(rect.right),
    bottom: round(rect.bottom),
    left: round(rect.left),
    width: round(rect.width),
    height: round(rect.height),
  };
}

function readElement(node: HTMLElement | null) {
  if (!node) {
    return null;
  }

  const style = window.getComputedStyle(node);
  const data = Object.fromEntries(
    [...node.attributes]
      .filter((attribute) => attribute.name.startsWith("data-"))
      .map((attribute) => [attribute.name, attribute.value]),
  );

  return {
    tag: node.tagName.toLowerCase(),
    id: node.id || null,
    className: node.className || null,
    data,
    rect: readRect(node),
    client: {
      width: node.clientWidth,
      height: node.clientHeight,
      top: node.clientTop,
      left: node.clientLeft,
    },
    scroll: {
      width: node.scrollWidth,
      height: node.scrollHeight,
      top: round(node.scrollTop),
      left: round(node.scrollLeft),
    },
    computed: {
      display: style.display,
      position: style.position,
      width: style.width,
      height: style.height,
      minWidth: style.minWidth,
      minHeight: style.minHeight,
      maxWidth: style.maxWidth,
      maxHeight: style.maxHeight,
      inset: style.inset,
      margin: style.margin,
      transform: style.transform,
      transformOrigin: style.transformOrigin,
      zoom: style.getPropertyValue("zoom") || "normal",
      contain: style.contain,
      overflow: style.overflow,
      opacity: style.opacity,
      visibility: style.visibility,
    },
  };
}

function readCanvas(canvas: HTMLCanvasElement | null) {
  if (!canvas) {
    return null;
  }

  const rect = canvas.getBoundingClientRect();

  return {
    element: readElement(canvas),
    backingStore: {
      width: canvas.width,
      height: canvas.height,
      widthRatio: rect.width > 0 ? round(canvas.width / rect.width) : null,
      heightRatio: rect.height > 0 ? round(canvas.height / rect.height) : null,
    },
    inlineStyle: canvas.getAttribute("style"),
  };
}

function readAncestors(host: HTMLElement | null) {
  const ancestors = [];
  let node = host?.parentElement ?? null;

  while (node && ancestors.length < 4) {
    ancestors.push(readElement(node));
    node = node.parentElement;
  }

  return ancestors;
}

function readRuntime(
  runtimeApp: Application | null,
  inputCanvas: HTMLCanvasElement | null,
) {
  if (!runtimeApp) {
    return null;
  }

  const runtime = asRecord(runtimeApp);
  const scene = asRecord(runtime?._scene);
  const controls = asRecord(runtime?._controls);
  const renderer = asRecord(runtime?._renderer);
  let camera =
    runtime?._camera ??
    scene?._camera ??
    scene?.activeCamera ??
    controls?.object ??
    null;
  let objectCount: number | null = null;
  let rendererPixelRatio: number | null = null;

  try {
    const sceneObjects = runtimeApp.getAllObjects();
    objectCount = sceneObjects.length;
    camera ??=
      sceneObjects.find((object) => {
        const record = asRecord(object);
        const name = typeof record?.name === "string" ? record.name : "";
        const type = typeof record?.type === "string" ? record.type : "";

        return /camera/i.test(`${name} ${type}`);
      }) ?? null;
  } catch {
    objectCount = null;
  }

  if (typeof renderer?.getPixelRatio === "function") {
    try {
      rendererPixelRatio = readNumber(renderer.getPixelRatio());
    } catch {
      rendererPixelRatio = null;
    }
  }

  return {
    renderOnDemand: runtimeApp.renderOnDemand,
    canvasMatchesInput: runtimeApp.canvas === inputCanvas,
    rendererPixelRatio,
    objectCount,
    camera: readSceneObject(camera),
  };
}

export function logLanding3dDiagnostic(input: SceneDiagnosticInput) {
  try {
    const visualViewport = window.visualViewport;
    const navigatorWithMemory = navigator as Navigator & {
      deviceMemory?: number;
    };
    const payload = {
      version: 1,
      scene: input.sceneId,
      reason: input.reason,
      time: new Date().toISOString(),
      page: {
        pathname: window.location.pathname,
        scrollX: round(window.scrollX),
        scrollY: round(window.scrollY),
        documentWidth: document.documentElement.clientWidth,
        documentHeight: document.documentElement.clientHeight,
        bodyRect: readRect(document.body),
        htmlRect: readRect(document.documentElement),
      },
      viewport: {
        innerWidth: window.innerWidth,
        innerHeight: window.innerHeight,
        outerWidth: window.outerWidth,
        outerHeight: window.outerHeight,
        devicePixelRatio: round(window.devicePixelRatio),
        visual: visualViewport
          ? {
              width: round(visualViewport.width),
              height: round(visualViewport.height),
              scale: round(visualViewport.scale),
              offsetLeft: round(visualViewport.offsetLeft),
              offsetTop: round(visualViewport.offsetTop),
              pageLeft: round(visualViewport.pageLeft),
              pageTop: round(visualViewport.pageTop),
            }
          : null,
        screen: {
          width: window.screen.width,
          height: window.screen.height,
          availWidth: window.screen.availWidth,
          availHeight: window.screen.availHeight,
          orientation: window.screen.orientation?.type ?? null,
        },
        media: {
          mobile: window.matchMedia("screen and (max-width: 600px)").matches,
          tablet: window.matchMedia("screen and (max-width: 1024px)").matches,
          process3d: window.matchMedia("screen and (min-width: 769px)").matches,
        },
      },
      device: {
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        hardwareConcurrency: navigator.hardwareConcurrency,
        deviceMemory: navigatorWithMemory.deviceMemory ?? null,
      },
      state: input.state,
      host: readElement(input.host),
      ancestors: readAncestors(input.host),
      canvas: readCanvas(input.canvas),
      runtime: readRuntime(input.runtimeApp, input.canvas),
      sceneObject: readSceneObject(input.sceneObject),
      baseTransform: input.baseTransform,
      targetTransform: input.targetTransform,
    };
    const serializedPayload = JSON.stringify(payload);
    const message = `${DIAGNOSTIC_PREFIX} ${serializedPayload}`;
    console.log(message);
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    const serializedError = JSON.stringify({
      version: 1,
      scene: input.sceneId,
      reason: input.reason,
      diagnosticError: detail,
    });
    const message = `${DIAGNOSTIC_PREFIX} ${serializedError}`;
    console.log(message);
  }
}
