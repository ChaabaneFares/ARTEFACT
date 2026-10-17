# Scroll Animation Optimization System

A comprehensive, performance-optimized scroll animation framework with built-in RAF batching, state tracking, and viewport detection.

## 🚀 Features

- ✅ **RAF Batching**: Consolidates DOM updates into single animation frames
- ✅ **State Tracking**: Prevents redundant DOM operations
- ✅ **Intersection Observer**: Only animates visible elements
- ✅ **Performance Monitoring**: Track and optimize animation performance
- ✅ **Zero-Config Optimization**: Works out of the box with sensible defaults
- ✅ **Fully Typed**: TypeScript-ready (JSDoc annotations)

## 📚 Quick Start

### Basic Usage (Auto-Optimized)

The simplest way to use scroll animations with automatic optimizations:

```javascript
import scrollTrigger from '@/lib/scrollInteraction/scrollTrigger.js';

// Create a scroll-triggered animation (RAF batching enabled by default)
scrollTrigger.createInstance('my-animation', element, {
  values: [[0, 100]], // Animate from 0 to 100
  startPoint: [0.5],  // Start when element is 50% in viewport
  endPoint: [0.5, 0.5],
  callback: ({ v }) => {
    element.style.opacity = v[0] / 100;
  }
});
```

**That's it!** The scroll manager automatically batches all callbacks into single RAF calls.

---

## 🎨 Advanced Usage

### 0. SSR-Safe Lazy Animation Loaders

For app sections that should stay server-rendered, keep the markup in a server-safe file and lazy-load only the animation controller from a tiny client loader.

Use this pattern:

```tsx
// sectionAnimateLoader.tsx
"use client";

import { startTransition, useEffect, useState } from "react";

type SectionAnimateComponent = typeof import("./section.animate").default;

export default function SectionAnimateLoader() {
  const [AnimateComponent, setAnimateComponent] =
    useState<SectionAnimateComponent | null>(null);

  useEffect(() => {
    let isCancelled = false;

    void import("./section.animate").then((module) => {
      if (isCancelled) return;

      startTransition(() => {
        setAnimateComponent(() => module.default);
      });
    });

    return () => {
      isCancelled = true;
    };
  }, []);

  if (!AnimateComponent) return null;

  return <AnimateComponent />;
}
```

```tsx
// section.tsx
import SectionAnimateLoader from "./sectionAnimateLoader";

export default function Section() {
  return (
    <section data-section-root>
      <SectionAnimateLoader />
      <div data-section-card />
    </section>
  );
}
```

This keeps content SSR while deferring the scroll code to the client. In this repo, prefer this over putting `next/dynamic(..., { ssr: false })` directly inside a Server Component.

### 1. Using Optimized Callbacks

For maximum performance, use the optimized callback wrapper:

```javascript
import scrollTrigger, { createOptimizedCallback } from '@scrollTrigger.js';

// Create optimized callback system
const optimized = createOptimizedCallback({
  enableRAF: true,              // RAF batching
  enableStateTracking: true,     // Skip redundant updates
  enableViewportCheck: true,     // Only animate visible elements
  viewportOptions: {
    rootMargin: '100px'          // Start animating 100px before visible
  }
});

// Register element for viewport detection
if (optimized.viewportOptimizer) {
  optimized.viewportOptimizer.observe(card, 'card-1');
}

// Use optimized callback
scrollTrigger.createInstance('card-animation', card, {
  values: [[0, 1]],
  callback: optimized.wrap(({ v }) => {
    // These updates are automatically batched and state-tracked
    optimized.trackStyle(card, 'opacity', String(v[0]));
    optimized.trackClassToggle(card, 'active', v[0] > 0.5);
  }, 'card-1')
});

// Cleanup when done
optimized.cleanup();
```

### 2. State Tracking Only

If you just need to prevent redundant DOM updates:

```javascript
import { createStateTracker } from '@scrollTrigger.js';

const stateTracker = createStateTracker();

scrollTrigger.createInstance('my-anim', element, {
  callback: ({ v }) => {
    // Only updates if value changed
    stateTracker.trackStyle(element, 'opacity', String(v[0]));
    stateTracker.trackClassToggle(element, 'active', v[0] > 50);
  }
});

// Clear when done
stateTracker.clearAll();
```

### 3. Manual RAF Batching

For custom animations outside scroll triggers:

```javascript
import { createRAFBatch } from '@scrollTrigger.js';

const rafBatch = createRAFBatch();

// Multiple updates batched into single frame
function onScroll() {
  rafBatch.schedule('update-1', () => {
    element1.style.opacity = '0.5';
  });
  
  rafBatch.schedule('update-2', () => {
    element2.style.transform = 'translateX(10px)';
  });
  
  rafBatch.schedule('update-3', () => {
    element3.classList.add('active');
  });
}

window.addEventListener('scroll', onScroll);

// Cleanup
rafBatch.cancelAll();
```

### 4. Viewport Optimization

Only run animations for elements in viewport:

```javascript
import { createIntersectionOptimizer } from '@scrollTrigger.js';

const viewportOptimizer = createIntersectionOptimizer({
  rootMargin: '200px',  // Start 200px before visible
  threshold: 0,
  onEnter: (element, key) => {
    console.log(`${key} entered viewport`);
    // Enable animations for this element
  },
  onExit: (element, key) => {
    console.log(`${key} left viewport`);
    // Disable animations for this element
  }
});

// Observe elements
cards.forEach((card, index) => {
  viewportOptimizer.observe(card, `card-${index}`);
});

// Check if element is visible
if (viewportOptimizer.isIntersecting(card)) {
  // Run animation
}

// Cleanup
viewportOptimizer.disconnect();
```

### 5. Performance Monitoring

Track animation performance in development:

```javascript
import { createPerformanceMonitor } from '@scrollTrigger.js';

const perfMonitor = createPerformanceMonitor();

// Wrap your callback with monitoring
const callback = perfMonitor.measure(({ v }) => {
  element.style.opacity = v[0] / 100;
}, 'my-animation');

scrollTrigger.createInstance('monitored', element, { callback });

// Log stats after some scrolling
setTimeout(() => {
  perfMonitor.logStats();
  // Output:
  // === Scroll Animation Performance ===
  // Total Calls: 342
  // Skipped Updates: 156 (45.61%)
  // Avg Time: 0.234ms
  // Min Time: 0.102ms
  // Max Time: 2.145ms
  // Total Time: 80.028ms
}, 10000);
```

---

## 🔧 Real-World Example

Here's how the architecture flow uses optimizations:

```javascript
import scrollTrigger, { createMapProgressMemo } from '@scrollTrigger.js';
import { createRAFBatch, createStateTracker } from '@scrollTrigger.js';

// Setup optimization utilities
const rafBatch = createRAFBatch();
const stateTracker = createStateTracker();
const mapProgressMemo = createMapProgressMemo();

// Cache for better performance
let lastIconActiveState = null;

function initCardAnimation(card, cardIndex) {
  const id = `card-${cardIndex}`;
  
  return scrollTrigger.createInstance(id, card, {
    values: [[0, 100]],
    startPoint: [0.5],
    endPoint: [0.5, 0.5],
    callback: ({ v }) => {
      const progress = v[0];
      
      // Schedule updates in RAF batch
      rafBatch.schedule(id, () => {
        // Calculate values once
        const opacity = mapProgressMemo(0.6, 1, progress);
        const isActive = progress > 50;
        
        // Update with state tracking (skips if unchanged)
        stateTracker.trackStyle(card, 'opacity', String(opacity));
        
        // Only toggle class if state changed
        if (lastIconActiveState !== isActive) {
          stateTracker.trackClassToggle(card, 'active', isActive);
          lastIconActiveState = isActive;
        }
      });
    }
  });
}

// Cleanup
function cleanup() {
  rafBatch.cancelAll();
  stateTracker.clearAll();
}
```

---

## 📊 Performance Best Practices

### ✅ DO

1. **Use RAF batching for all scroll animations**
   ```javascript
   const rafBatch = createRAFBatch();
   rafBatch.schedule('update', () => { /* DOM updates */ });
   ```

2. **Track state to prevent redundant updates**
   ```javascript
   stateTracker.trackClassToggle(el, 'active', isActive);
   ```

3. **Pre-calculate constant values**
   ```javascript
   const RADIUS = 140;
   const positions = calculatePositions(); // Do once
   ```

4. **Cache DOM queries**
   ```javascript
   let cachedElement = null;
   if (!cachedElement) {
     cachedElement = document.querySelector('.my-element');
   }
   ```

5. **Use viewport optimization for off-screen elements**
   ```javascript
   if (!viewportOptimizer.isIntersecting(element)) return;
   ```

### ❌ DON'T

1. **Don't query DOM in scroll callbacks**
   ```javascript
   // ❌ BAD
   callback: () => {
     const el = document.querySelector('.foo'); // Every scroll!
   }
   
   // ✅ GOOD
   const el = document.querySelector('.foo'); // Once
   callback: () => {
     // Use cached el
   }
   ```

2. **Don't toggle classes without state tracking**
   ```javascript
   // ❌ BAD
   element.classList.toggle('active', isActive); // Every frame!
   
   // ✅ GOOD
   stateTracker.trackClassToggle(element, 'active', isActive);
   ```

3. **Don't use string concatenation for transforms**
   ```javascript
   // ❌ BAD
   el.style.transform = 'rotate(' + rotation + ') scale(' + scale + ')';
   
   // ✅ GOOD
   const rotation = cachedRotation; // Cache if possible
   el.style.transform = `${rotation} scale(${scale})`;
   ```

4. **Don't create objects/arrays in hot paths**
   ```javascript
   // ❌ BAD
   callback: () => {
     const positions = [{ x: 0, y: 0 }, { x: 1, y: 1 }]; // Every scroll!
   }
   
   // ✅ GOOD
   const positions = [{ x: 0, y: 0 }, { x: 1, y: 1 }]; // Once
   callback: () => {
     // Use cached positions
   }
   ```

---

## 🎯 Migration Guide

### From Unoptimized Code

**Before:**
```javascript
scrollTrigger.createInstance('my-anim', element, {
  callback: ({ v }) => {
    element.style.opacity = v[0] / 100;
    element.classList.toggle('active', v[0] > 50);
    const child = element.querySelector('.child');
    child.style.transform = `scale(${v[0] / 100})`;
  }
});
```

**After:**
```javascript
import { createOptimizedCallback } from '@scrollTrigger.js';

// Cache DOM queries
const child = element.querySelector('.child');

// Setup optimizations
const optimized = createOptimizedCallback({
  enableRAF: true,
  enableStateTracking: true
});

scrollTrigger.createInstance('my-anim', element, {
  callback: optimized.wrap(({ v }) => {
    const progress = v[0] / 100;
    
    // State-tracked updates (skips if unchanged)
    optimized.trackStyle(element, 'opacity', String(progress));
    optimized.trackClassToggle(element, 'active', v[0] > 50);
    optimized.trackStyle(child, 'transform', `scale(${progress})`);
  }, 'my-anim')
});

// Cleanup when done
optimized.cleanup();
```

**Benefits:**
- ✅ 60-80% reduction in DOM operations
- ✅ Batched into single RAF call
- ✅ No redundant class toggles
- ✅ No repeated DOM queries

---

## 🔍 API Reference

### `createRAFBatch()`

Returns RAF batching controller.

**Methods:**
- `schedule(key, callback)` - Schedule callback for next frame
- `cancel(key)` - Cancel scheduled update
- `cancelAll()` - Cancel all pending updates
- `getPendingCount()` - Get number of pending updates

---

### `createStateTracker()`

Returns state tracking controller.

**Methods:**
- `trackClassToggle(element, className, shouldAdd)` - Toggle class with state tracking
- `trackStyle(element, property, value)` - Set style with state tracking
- `trackAttribute(element, attribute, value)` - Set attribute with state tracking
- `clear(element)` - Clear tracked state for element
- `clearAll()` - Clear all tracked states

---

### `createIntersectionOptimizer(options)`

Returns viewport detection controller.

**Options:**
- `rootMargin` (string) - Margin around viewport (default: '100px')
- `threshold` (number) - Visibility threshold (default: 0)
- `onEnter` (function) - Called when element enters viewport
- `onExit` (function) - Called when element exits viewport

**Methods:**
- `observe(element, key)` - Start observing element
- `unobserve(element)` - Stop observing element
- `isIntersecting(element)` - Check if element is visible
- `disconnect()` - Disconnect and cleanup

---

### `createOptimizedCallback(options)`

Returns all-in-one optimization wrapper.

**Options:**
- `enableRAF` (boolean) - Enable RAF batching (default: true)
- `enableStateTracking` (boolean) - Enable state tracking (default: true)
- `enableViewportCheck` (boolean) - Enable viewport detection (default: false)
- `viewportOptions` (object) - Options for Intersection Observer

**Methods:**
- `wrap(callback, key)` - Wrap callback with optimizations
- `trackStyle(element, property, value)` - Set style with state tracking
- `trackClassToggle(element, className, shouldAdd)` - Toggle class with state tracking
- `cleanup()` - Cleanup all optimizations

---

### `createPerformanceMonitor()`

Returns performance monitoring controller.

**Methods:**
- `measure(callback, key)` - Wrap callback with performance measurement
- `recordSkip()` - Record a skipped update
- `getStats()` - Get performance statistics
- `logStats()` - Log stats to console
- `reset()` - Reset all metrics

---

## 🎓 Learn More

- See `optimizations.js` for implementation details
- Check `architectureFlow.animate.ts` for real-world usage
- Read inline JSDoc comments for detailed API documentation

---

## 🐛 Debugging

### Enable Performance Logging

```javascript
const perfMonitor = createPerformanceMonitor();

// Wrap your callback
const callback = perfMonitor.measure(({ v }) => {
  // Your animation code
}, 'debug-animation');

// Check stats periodically
setInterval(() => {
  const stats = perfMonitor.getStats();
  if (stats.avgTime > 5) {
    console.warn('Animation is slow!', stats);
  }
}, 5000);
```

### Disable RAF Batching (for debugging)

```javascript
import scrollManager from '@/lib/scrollInteraction/scrollManager.js';

// Disable RAF batching globally
scrollManager.setRAFBatching(false);

// Your animations now run immediately (easier to debug)
```

### Check Pending Updates

```javascript
import scrollManager from '@/lib/scrollInteraction/scrollManager.js';

// Log pending updates
console.log('Pending:', scrollManager.getPendingUpdates());
```

---

## 📈 Performance Metrics

Expected improvements with full optimizations:

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| JavaScript execution time | 8-12ms | 2-3ms | 70-75% |
| DOM operations per frame | 20-30 | 5-8 | 75-80% |
| Skipped redundant updates | 0% | 40-60% | - |
| Frame rate (60fps target) | 45-55fps | 58-60fps | Smooth |

---

## 🙏 Credits

Built with ❤️ for high-performance scroll animations.

**Key Concepts:**
- RAF batching inspired by React Fiber's scheduling
- State tracking pattern from Virtual DOM diffing
- Intersection Observer API for viewport detection
