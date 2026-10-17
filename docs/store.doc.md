# Store Guide

This project uses `storio` for lightweight client-side state. The working
pattern mirrors the `site-entry` project: keep stores small, initialize
browser-derived values from a client-only initializer, and expose reusable
helpers on the store when the logic is shared across features.

## Current store modules

- `src/store/dimensionsStore.ts`: viewport width plus responsive helpers
- `src/components/initializer/initializer.ts`: boots Lenis and syncs `vw`
- `src/types/storio.ts`: local typing shim so the repo types match the runtime

## Dimensions store

`dimensionsStore` keeps one source of truth for viewport width:

```ts
type DimensionsState = {
  vw: number;
  setVw: (width: number) => void;
  isMobile: () => boolean;
  isTablet: () => boolean;
  isDesktop: () => boolean;
};
```

Implementation pattern:

```ts
export const dimensionsStore = create<DimensionsState>((set) => ({
  vw: 0,
  setVw: (width) => set({ vw: width }),
  isMobile: () => dimensionsStore.getState().vw <= 600,
  isTablet: () => {
    const { vw } = dimensionsStore.getState();
    return vw > 600 && vw <= 1024;
  },
  isDesktop: () => dimensionsStore.getState().vw >= 1024,
}));
```

Breakpoints used here:

- Mobile: `vw <= 600`
- Tablet: `600 < vw <= 1024`
- Desktop: `vw >= 1024`

## Initializer pattern

Browser-only state belongs in a client initializer, not in server-rendered
module scope.

`src/components/initializer/initializer.ts` is responsible for:

- booting Lenis once on mount
- reading `window.innerWidth`
- pushing that value into `dimensionsStore`
- subscribing to `resize`
- cleaning up listeners and Lenis on unmount

That keeps viewport state synchronized without providers or prop threading.

## How to use Storio in this repo

### Reactive reads inside React

Use the store hook inside components and hooks when render output or effects
should respond to updates:

```ts
const { vw } = dimensionsStore();
```

Prefer selectors when you only need one primitive value:

```ts
const vw = dimensionsStore((state) => state.vw);
```

Use selector form when possible for narrower subscriptions. Use full-object
reads when the component genuinely needs several values or actions together.

### Non-reactive reads outside React

Use `getState()` for event handlers, utilities, animation setup, and other code
that should read the latest value without subscribing:

```ts
const width = dimensionsStore.getState().vw;
const isMobile = dimensionsStore.getState().isMobile();
```

### Updates

For partial state updates, use object updates:

```ts
dimensionsStore.getState().setVw(window.innerWidth);
```

If you need a state-dependent update, return the full next state:

```ts
someStore.setState((state) => ({
  ...state,
  count: state.count + 1,
}));
```

## Best practices

### 1. Initialize browser state client-side

Anything derived from `window`, `document`, `matchMedia`, scroll position, or
viewport dimensions should be set up in a client component like
`Initializer`. This avoids hydration drift and keeps server output stable.

### 2. Keep stores small and explicit

Store shared state and reusable actions. Do not turn stores into dumping
grounds for one-off local UI state that belongs in `useState`.

### 3. Put shared derived logic behind store helpers

If multiple features need the same breakpoint logic, expose `isMobile`,
`isTablet`, and `isDesktop` on the store instead of duplicating comparisons in
many components.

### 4. Use `getState()` when you do not want a subscription

Animation setup, observer callbacks, and third-party integrations usually need
the latest value once, not a rerendering component.

### 5. Always clean up subscriptions and listeners

If you use `store.subscribe(...)`, return the unsubscribe function from your
effect cleanup.

```ts
useEffect(() => {
  const unsubscribe = dimensionsStore.subscribe(() => {
    // respond to updates
  });

  return unsubscribe;
}, []);
```

### 6. Prefer named store exports

Use named exports like `dimensionsStore` so the same store can be imported
consistently across components, hooks, and utilities.

## Important Storio pitfall in this repo

The installed `storio` runtime merges object updates but treats functional
updates as full-state replacement.

That means this is unsafe for partial updates:

```ts
set(() => ({ vw: width }));
```

Why it breaks:

- the returned object replaces the whole store state
- action functions like `setVw`, `isMobile`, `isTablet`, and `isDesktop` are
  dropped
- the next call to `dimensionsStore.getState().setVw(...)` throws because
  `setVw` no longer exists

Use one of these instead:

```ts
set({ vw: width });
```

```ts
set((state) => ({
  ...state,
  vw: width,
}));
```

The repo-local `src/types/storio.ts` file exists to reflect this usage pattern
in TypeScript and keep authoring aligned with the working runtime behavior.
