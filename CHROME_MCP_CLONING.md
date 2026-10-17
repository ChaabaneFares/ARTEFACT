# Chrome MCP Cloning Guide

This document explains the repo workflow for cloning a live section with Chrome MCP and rebuilding it inside the codebase.

The goal is not to paste raw HTML blindly. The goal is to reproduce the section accurately, understand what is visual vs structural, and rebuild it in a maintainable way inside this repo.

## When to use this workflow

Use Chrome MCP cloning when:

- a section must match a live site closely
- the user gives a specific active tab or selector
- the visual treatment depends on live transforms, canvas output, or layered text
- screenshots alone are not enough to understand the structure

Do not stop at a flat screenshot if the original effect depends on separate layout layers, animated depth, or DOM text that should stay editable.

## Core principle

Treat the live page as a reference system:

1. Inspect the live section
2. Extract the pieces that matter
3. Rebuild the section in repo code
4. Verify the local result against the live tab

## Standard workflow

### 1. Start from the active tab

Use Chrome MCP against the user’s current active tab first.

Typical first checks:

- confirm the active tab id
- confirm the target selector exists
- capture the target node HTML
- capture computed styles for the important layers

Useful tools:

- `chrome_mcp.get_windows_and_tabs`
- `chrome_get_web_content`
- `chrome_javascript`

## 2. Separate structure from presentation

Identify which parts of the section are:

- real DOM structure
- plain imagery
- canvas output
- overlaid text
- transforms/perspective

This matters because cloning a whole screenshot often gives the wrong result.

Example:

- if the card image is generated from a canvas, extract the canvas image
- if the title is a separate 3D layer, rebuild it as DOM text in the component
- if the section width comes from layout rules, rebuild the layout instead of baking the full frame into one asset

## 3. Capture the live geometry

Before rebuilding, measure the live section directly from the browser:

- section bounds
- card bounds
- title bounds
- index/meta bounds
- computed font size
- computed border radius
- transform and perspective values

Use `chrome_javascript` with `getBoundingClientRect()` and `getComputedStyle()`.

This avoids guessing.

## 4. Handle off-screen or transformed sections

Some sites use smooth-scroll wrappers or transforms that make direct screenshots unreliable.

When that happens:

- create a temporary fixed overlay in the current tab
- clone the target node into that overlay
- redraw the canvas into the cloned node if needed
- capture screenshots from the overlay instead of the original location

This is the most reliable way to inspect sections that are visually present but geometrically offset.

## 5. Extract assets cleanly

Prefer extracting only the asset you need:

- image URL if the page already uses a real image
- canvas `toDataURL()` download if the visual is rendered in canvas
- isolated card screenshot if only the background plate is needed

Repo convention:

- place captured assets under `public/assets/...`

Avoid storing oversized full-page captures when a smaller isolated asset is enough.

## 6. Rebuild in code, not in screenshots

Preferred rebuild order:

1. create the component structure in `src/components/...`
2. add only the required asset under `public/assets/...`
3. rebuild editable text as DOM
4. reproduce depth/perspective in CSS
5. add interaction only if the live reference depends on it

In this repo, a good clone usually means:

- static background/card image as an asset
- text as DOM
- perspective/depth recreated in CSS
- motion recreated with controlled pointer or scroll behavior when necessary

## 7. Verify against the live tab

After the rebuild:

- open the local page in Chrome MCP
- scroll to the rebuilt section
- capture screenshots
- compare local bounds vs live bounds

Useful checks:

- card width and height
- title width and placement
- index placement
- first-paint centered state
- behavior after pointer movement

If the local clone only looks right after interaction, the default CSS state is probably wrong.

## 8. Clean up browser instrumentation

Remove any temporary overlay or injected DOM used for inspection before finishing.

Do not leave:

- debug overlays
- temporary cloned nodes
- browser-side instrumentation

## Repo notes

- keep assets in `public/assets/`
- keep the rebuilt section in normal repo components, not raw browser exports
- prefer maintainable DOM and CSS over one baked screenshot
- verify locally with Chrome MCP before calling the clone complete

## Practical checklist

- active tab confirmed
- selector confirmed
- live geometry measured
- assets extracted cleanly
- DOM text rebuilt as text
- local section compared against live tab
- temporary browser overlay removed
- repo files committed without touching `assistant/*`
