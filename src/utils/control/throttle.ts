export type ThrottledFunction<T extends (...args: unknown[]) => void> = T & {
  cancel: () => void;
};

export function throttle<T extends (...args: unknown[]) => void>(
  func: T,
  limit: number,
): ThrottledFunction<T> {
  let lastFunc: ReturnType<typeof setTimeout> | undefined;
  let lastRan: number | undefined;

  const throttled = function (this: unknown, ...args: Parameters<T>) {
    if (!lastRan) {
      func.apply(this, args);
      lastRan = Date.now();
      return;
    }

    if (lastFunc) {
      clearTimeout(lastFunc);
    }

    lastFunc = setTimeout(
      () => {
        if (Date.now() - (lastRan ?? 0) >= limit) {
          func.apply(this, args);
          lastRan = Date.now();
          lastFunc = undefined;
        }
      },
      Math.max(0, limit - (Date.now() - (lastRan ?? Date.now()))),
    );
  } as ThrottledFunction<T>;

  throttled.cancel = () => {
    if (lastFunc) {
      clearTimeout(lastFunc);
      lastFunc = undefined;
    }
  };

  return throttled;
}
