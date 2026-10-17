/** Bust previously optimized image URLs when replacing embedded raster branding. */
export function brandedImageSource(src: string): string {
  return /^\/assets\/(?:about|designs|projects|landing-page|video)\/.+\.(?:jpe?g|webp|png)$/.test(
    src,
  )
    ? `${src}?brand=artefact-20261012`
    : src;
}
