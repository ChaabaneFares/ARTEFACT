/**
 * Scroll Animation Optimization Examples
 *
 * Copy-paste ready examples for common scroll animation patterns
 */

import scrollTrigger, {
  calcPercent,
  createMapProgressMemo,
  createOptimizedCallback,
  createPerformanceMonitor,
  createRAFBatch,
  createStateTracker,
} from "./scrollTrigger.js";

// ============================================================================
// EXAMPLE 1: Simple Fade-In Animation (Optimized)
// ============================================================================

export function createFadeInAnimation(element, key = "fade-in") {
  const stateTracker = createStateTracker();

  const instance = scrollTrigger.createInstance(key, element, {
    values: [[0, 1]], // Opacity from 0 to 1
    startPoint: [0.8], // Start when 80% in viewport
    endPoint: [0.2], // End when 20% in viewport
    callback: ({ v }) => {
      // Only updates DOM if value changed
      stateTracker.trackStyle(element, "opacity", String(v[0]));
    },
  });

  return {
    instance,
    cleanup: () => {
      stateTracker.clearAll();
      scrollTrigger.removeInstance(key);
    },
  };
}

// Usage:
// const fadeIn = createFadeInAnimation(myElement, 'my-fade-in');
// // Later: fadeIn.cleanup();

// ============================================================================
// EXAMPLE 2: Card Animation with Multiple Properties
// ============================================================================

export function createCardRevealAnimation(card, index) {
  const optimized = createOptimizedCallback({
    enableRAF: true,
    enableStateTracking: true,
    enableViewportCheck: true,
    viewportOptions: { rootMargin: "100px" },
  });

  const mapProgress = createMapProgressMemo();
  const key = `card-reveal-${index}`;

  // Register for viewport detection
  if (optimized.viewportOptimizer) {
    optimized.viewportOptimizer.observe(card, key);
  }

  const instance = scrollTrigger.createInstance(key, card, {
    values: [[0, 100]],
    startPoint: [0.7],
    endPoint: [0.3],
    callback: optimized.wrap(({ v }) => {
      const progress = v[0];

      // Calculate all values
      const opacity = mapProgress(0, 1, progress);
      const translateY = mapProgress(50, 0, progress);
      const scale = mapProgress(0.9, 1, progress);
      const isActive = progress > 50;

      // Apply with state tracking
      optimized.trackStyle(card, "opacity", String(opacity));
      optimized.trackStyle(
        card,
        "transform",
        `translateY(${translateY}px) scale(${scale})`,
      );
      optimized.trackClassToggle(card, "is-active", isActive);
    }, key),
  });

  return {
    instance,
    cleanup: () => {
      optimized.cleanup();
      scrollTrigger.removeInstance(key);
    },
  };
}

// Usage:
// const cardAnim = createCardRevealAnimation(cardElement, 0);

// ============================================================================
// EXAMPLE 3: Multiple Elements Batched Animation
// ============================================================================

export function createBatchedAnimations(elements, baseKey = "batch") {
  const rafBatch = createRAFBatch();
  const stateTracker = createStateTracker();
  const instances = [];

  elements.forEach((element, index) => {
    const key = `${baseKey}-${index}`;

    const instance = scrollTrigger.createInstance(key, element, {
      values: [[0, 100]],
      startPoint: [0.75],
      endPoint: [0.25],
      callback: ({ v }) => {
        // All updates batched into single RAF
        rafBatch.schedule(key, () => {
          const progress = v[0];
          stateTracker.trackStyle(element, "opacity", String(progress / 100));
          stateTracker.trackStyle(
            element,
            "transform",
            `translateX(${progress}px)`,
          );
        });
      },
    });

    instances.push(instance);
  });

  return {
    instances,
    cleanup: () => {
      rafBatch.cancelAll();
      stateTracker.clearAll();
      instances.forEach((_, index) => {
        scrollTrigger.removeInstance(`${baseKey}-${index}`);
      });
    },
  };
}

// Usage:
// const cards = document.querySelectorAll('.card');
// const animations = createBatchedAnimations(cards, 'cards');

// ============================================================================
// EXAMPLE 4: Progressive Reveal with Staggered Timing
// ============================================================================

export function createStaggeredReveal(items, options = {}) {
  const {
    staggerDelay = 10, // Progress offset per item
    baseKey = "stagger",
  } = options;

  const optimized = createOptimizedCallback({
    enableRAF: true,
    enableStateTracking: true,
  });

  const mapProgress = createMapProgressMemo();
  const instances = [];

  items.forEach((item, index) => {
    const key = `${baseKey}-${index}`;
    const startOffset = index * staggerDelay;

    const instance = scrollTrigger.createInstance(key, item, {
      values: [[0, 100]],
      startPoint: [0.8],
      endPoint: [0.2],
      callback: optimized.wrap(({ v }) => {
        const rawProgress = v[0];

        // Apply stagger offset
        const staggeredProgress = Math.max(
          0,
          Math.min(100, rawProgress - startOffset),
        );

        const opacity = mapProgress(0, 1, staggeredProgress);
        const translateY = mapProgress(30, 0, staggeredProgress);

        optimized.trackStyle(item, "opacity", String(opacity));
        optimized.trackStyle(item, "transform", `translateY(${translateY}px)`);
      }, key),
    });

    instances.push(instance);
  });

  return {
    instances,
    cleanup: () => {
      optimized.cleanup();
      instances.forEach((_, index) => {
        scrollTrigger.removeInstance(`${baseKey}-${index}`);
      });
    },
  };
}

// Usage:
// const listItems = document.querySelectorAll('.list-item');
// const stagger = createStaggeredReveal(listItems, { staggerDelay: 15 });

// ============================================================================
// EXAMPLE 5: Performance-Monitored Animation (Development)
// ============================================================================

export function createMonitoredAnimation(element, key = "monitored") {
  const perfMonitor = createPerformanceMonitor();
  const stateTracker = createStateTracker();

  // Wrap callback with performance monitoring
  const callback = perfMonitor.measure(({ v }) => {
    const updated = stateTracker.trackStyle(element, "opacity", String(v[0]));

    if (!updated) {
      perfMonitor.recordSkip();
    }
  }, key);

  const instance = scrollTrigger.createInstance(key, element, {
    values: [[0, 1]],
    callback,
  });

  // Log stats every 5 seconds
  const interval = setInterval(() => {
    perfMonitor.logStats();
  }, 5000);

  return {
    instance,
    getStats: () => perfMonitor.getStats(),
    cleanup: () => {
      clearInterval(interval);
      stateTracker.clearAll();
      scrollTrigger.removeInstance(key);
      console.log("Final stats:");
      perfMonitor.logStats();
    },
  };
}

// Usage (in development):
// const monitored = createMonitoredAnimation(element, 'debug-anim');
// // Scroll around, then check console for performance stats

// ============================================================================
// EXAMPLE 6: Complex Multi-Element Animation (Like Architecture Flow)
// ============================================================================

export function createComplexCardAnimation(card, cardIndex, options = {}) {
  const { enableViewport = true, performanceMonitoring = false } = options;

  // Setup optimizations
  const optimized = createOptimizedCallback({
    enableRAF: true,
    enableStateTracking: true,
    enableViewportCheck: enableViewport,
    viewportOptions: { rootMargin: "150px" },
  });

  const mapProgress = createMapProgressMemo();
  const perfMonitor = performanceMonitoring ? createPerformanceMonitor() : null;

  // Cache DOM queries
  const visual = card.querySelector(".card-visual");
  const title = card.querySelector(".card-title");
  const description = card.querySelector(".card-description");

  const key = `complex-card-${cardIndex}`;

  // Register viewport detection
  if (optimized.viewportOptimizer) {
    optimized.viewportOptimizer.observe(card, key);
  }

  // Create scroll instance
  const callback = ({ v }) => {
    const progress = v[0];

    // Calculate values once
    const cardOpacity = mapProgress(0.6, 1, progress);
    const visualScale = mapProgress(0.8, 1, progress);
    const titleOpacity = mapProgress(0, 1, calcPercent(0, 40, progress));
    const descOpacity = mapProgress(0, 1, calcPercent(40, 80, progress));
    const isActive = progress > 50;

    // Apply updates with state tracking
    optimized.trackStyle(card, "opacity", String(cardOpacity));
    optimized.trackStyle(
      card,
      "borderColor",
      `rgba(0, 119, 255, ${mapProgress(0.1, 0.8, progress)})`,
    );

    if (visual) {
      optimized.trackStyle(visual, "transform", `scale(${visualScale})`);
    }

    if (title) {
      optimized.trackStyle(title, "opacity", String(titleOpacity));
    }

    if (description) {
      optimized.trackStyle(description, "opacity", String(descOpacity));
    }

    optimized.trackClassToggle(card, "is-active", isActive);
  };

  const wrappedCallback = optimized.wrap(
    perfMonitor ? perfMonitor.measure(callback, key) : callback,
    key,
  );

  const instance = scrollTrigger.createInstance(key, card, {
    values: [[0, 100]],
    startPoint: [0.5],
    endPoint: [0.5, 0.5],
    callback: wrappedCallback,
  });

  return {
    instance,
    getPerformanceStats: () => (perfMonitor ? perfMonitor.getStats() : null),
    cleanup: () => {
      optimized.cleanup();
      scrollTrigger.removeInstance(key);

      if (perfMonitor && performanceMonitoring) {
        console.log(`Stats for ${key}:`);
        perfMonitor.logStats();
      }
    },
  };
}

// Usage:
// const cardAnim = createComplexCardAnimation(cardElement, 0, {
//   enableViewport: true,
//   performanceMonitoring: process.env.NODE_ENV === 'development'
// });

// ============================================================================
// EXAMPLE 7: Reusable Animation Hook Pattern (React-like)
// ============================================================================

export function useScrollAnimation(
  elementRef,
  animationFn,
  _dependencies = [],
) {
  let cleanup = null;

  const init = () => {
    if (!elementRef.current) return;

    const result = animationFn(elementRef.current);
    cleanup = result.cleanup;
  };

  const destroy = () => {
    if (cleanup) {
      cleanup();
      cleanup = null;
    }
  };

  // Initialize
  init();

  // Return cleanup function
  return destroy;
}

// Usage in React/Vue-like component:
// const cardRef = { current: document.querySelector('.card') };
// const cleanup = useScrollAnimation(cardRef, (element) => {
//   return createCardRevealAnimation(element, 0);
// });
// // Later: cleanup();

// ============================================================================
// EXAMPLE 8: Batch Multiple Different Animations
// ============================================================================

export function createAnimationSet(animations) {
  const instances = animations.map((anim) => anim.create());

  return {
    instances,
    cleanup: () => {
      instances.forEach((instance) => {
        if (instance.cleanup) {
          instance.cleanup();
        }
      });
    },
    pause: () => {
      instances.forEach((_, index) => {
        const anim = animations[index];
        if (anim.key) {
          scrollTrigger.toggleInstance(anim.key, false);
        }
      });
    },
    resume: () => {
      instances.forEach((_, index) => {
        const anim = animations[index];
        if (anim.key) {
          scrollTrigger.toggleInstance(anim.key, true);
        }
      });
    },
  };
}

// Usage:
// const animSet = createAnimationSet([
//   { key: 'card-1', create: () => createCardRevealAnimation(card1, 0) },
//   { key: 'card-2', create: () => createCardRevealAnimation(card2, 1) },
//   { key: 'fade', create: () => createFadeInAnimation(hero, 'hero-fade') }
// ]);
//
// // Pause all
// animSet.pause();
//
// // Resume all
// animSet.resume();
//
// // Cleanup all
// animSet.cleanup();
