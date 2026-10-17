export const CURSOR_INTERACTION_EVENT = "artifact:cursor-interaction";

export type CursorInteractionDetail = {
  mode: "default" | "blend" | "label";
  scale: number;
  background?: string;
  color?: string;
  fontSize?: string;
  label?: string;
};

const DEFAULT_SCALE = 81.6 / 10.56;
const DEFAULT_LABEL_BACKGROUND = "#ffffff";
const DEFAULT_LABEL_COLOR = "#3d7299";
const DEFAULT_LABEL_FONT_SIZE = "13.6px";

type CursorLabelOptions = {
  background?: string;
  color?: string;
  fontSize?: string;
  label: string;
  scale?: number;
};

function canUseBlendCursor() {
  return typeof window !== "undefined" && window.innerWidth > 768;
}

function dispatchCursorInteraction(detail: CursorInteractionDetail) {
  if (
    typeof window === "undefined" ||
    (detail.mode !== "default" && !canUseBlendCursor())
  ) {
    return;
  }

  window.dispatchEvent(
    new CustomEvent<CursorInteractionDetail>(CURSOR_INTERACTION_EVENT, {
      detail,
    }),
  );
}

export function activateCursorBlend(scale = DEFAULT_SCALE) {
  dispatchCursorInteraction({
    mode: "blend",
    scale,
  });
}

export function activateCursorLabel({
  background = DEFAULT_LABEL_BACKGROUND,
  color = DEFAULT_LABEL_COLOR,
  fontSize = DEFAULT_LABEL_FONT_SIZE,
  label,
  scale = DEFAULT_SCALE,
}: CursorLabelOptions) {
  dispatchCursorInteraction({
    background,
    color,
    fontSize,
    label,
    mode: "label",
    scale,
  });
}

export function clearCursorBlend() {
  dispatchCursorInteraction({
    mode: "default",
    scale: 1,
  });
}
