interface ObserveScrollableContentOptions {
  root: HTMLElement | null;
  onChange: () => void;
}

export function observeScrollableContent({
  root,
  onChange,
}: ObserveScrollableContentOptions): () => void {
  if (!root) {
    return () => {};
  }

  const observedChildren = new Set<Element>();
  let frameId: number | null = null;

  const runOnChange = () => {
    if (frameId !== null) {
      cancelAnimationFrame(frameId);
    }

    frameId = requestAnimationFrame(() => {
      frameId = null;
      onChange();
    });
  };

  const resizeObserver =
    typeof ResizeObserver === "undefined"
      ? null
      : new ResizeObserver(() => {
          runOnChange();
        });

  const refreshResizeTargets = () => {
    if (!resizeObserver) {
      return;
    }

    observedChildren.forEach((child) => {
      resizeObserver.unobserve(child);
    });
    observedChildren.clear();

    resizeObserver.observe(root);

    Array.from(root.children).forEach((child) => {
      resizeObserver.observe(child);
      observedChildren.add(child);
    });
  };

  refreshResizeTargets();

  const mutationObserver = new MutationObserver(() => {
    refreshResizeTargets();
    runOnChange();
  });

  mutationObserver.observe(root, {
    childList: true,
    subtree: true,
  });

  return () => {
    if (frameId !== null) {
      cancelAnimationFrame(frameId);
    }
    mutationObserver.disconnect();

    if (resizeObserver) {
      resizeObserver.unobserve(root);
      observedChildren.forEach((child) => {
        resizeObserver.unobserve(child);
      });
      resizeObserver.disconnect();
    }
  };
}
