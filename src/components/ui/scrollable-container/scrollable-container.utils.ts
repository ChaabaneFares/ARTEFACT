type ScrollWithinContainerOptions = {
  behavior?: ScrollBehavior;
  block?: ScrollLogicalPosition;
  padding?: number;
};

const SCROLLABLE_OVERFLOW_VALUES = new Set(["auto", "scroll", "overlay"]);

function isScrollableAxis(value: string) {
  return SCROLLABLE_OVERFLOW_VALUES.has(value);
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export function getNearestScrollableAncestor(
  element: HTMLElement | null,
): HTMLElement | null {
  let current = element?.parentElement ?? null;

  while (current && current !== document.body) {
    const style = window.getComputedStyle(current);
    const canScrollY =
      isScrollableAxis(style.overflowY) || isScrollableAxis(style.overflow);

    if (canScrollY && current.scrollHeight > current.clientHeight) {
      return current;
    }

    current = current.parentElement;
  }

  return null;
}

export function scrollElementIntoContainer(
  target: HTMLElement,
  container: HTMLElement,
  {
    behavior = "smooth",
    block = "center",
    padding = 0,
  }: ScrollWithinContainerOptions = {},
) {
  const containerRect = container.getBoundingClientRect();
  const targetRect = target.getBoundingClientRect();
  const maxScrollTop = Math.max(
    0,
    container.scrollHeight - container.clientHeight,
  );
  const deltaTop = targetRect.top - containerRect.top;
  const deltaBottom = targetRect.bottom - containerRect.bottom;

  let nextScrollTop = container.scrollTop;

  if (block === "start") {
    nextScrollTop += deltaTop - padding;
  } else if (block === "end") {
    nextScrollTop += deltaBottom + padding;
  } else if (block === "nearest") {
    if (deltaTop < padding) {
      nextScrollTop += deltaTop - padding;
    } else if (deltaBottom > -padding) {
      nextScrollTop += deltaBottom + padding;
    } else {
      return;
    }
  } else {
    nextScrollTop +=
      deltaTop - (container.clientHeight / 2 - targetRect.height / 2);
  }

  container.scrollTo({
    top: clamp(nextScrollTop, 0, maxScrollTop),
    behavior,
  });
}

export function scrollElementIntoNearestScrollableAncestor(
  target: HTMLElement,
  options?: ScrollWithinContainerOptions,
) {
  const container = getNearestScrollableAncestor(target);

  if (!container) {
    target.scrollIntoView({
      behavior: options?.behavior ?? "smooth",
      block: options?.block ?? "center",
      inline: "nearest",
    });
    return null;
  }

  scrollElementIntoContainer(target, container, options);
  return container;
}
