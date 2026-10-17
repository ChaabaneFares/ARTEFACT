# Artefact media branding

The supplied horizontal and vertical SVGs in `ARTIFACT MEDIA/new-logos` are the
source of truth. Public variants in `public/assets/brand` retain their exact path
geometry and light fill. The horizontal lockup combines the supplied symbol and
wordmark. The copyright rail uses the supplied text `ARTE-FACT Copyrighted ©2026`.

## Scope and placement

The image plan covers 292 website image files. Existing studio marks were
removed in 96 files, including three vertical copyright rails and Instagram
handles. Previously unbranded photographs, project posters and scroll-sequence
frames receive the same bottom-center lockup. The eight About images account for their
square display crops; portraits use their authored top alignment. Seven tour
preview images are also branded. All eight 3D scene placeholders retain their
original, unbranded bytes.
Noise textures, UI/social icons and font files are functional assets.

The two hero videos and their posters retain their original bytes. A single
viewport overlay places the lockup at the lower-left, at 48–72px wide, so
responsive cover crops cannot cut it off or show a second mark. All eight
portfolio animations are local full-HD H.264 MP4s with their original frame counts and audio.
Concept clips reuse their top-center mark position; the remaining clips have a
bottom-center mark. Villa's animated black outro replaces both its old symbol and
AM-ARC.COM title. No externally hosted video is used for website playback.

`src/config/media.ts` maps the original catalogue identifiers to these local
files. Homepage cards and catalogue videos use native controls. Fullscreen uses
the same already branded video rather than a second external player. Music and
silent-animation caption tracks accompany native players.

Live Spline/GLB illustrations and their static/mobile placeholders remain
unbranded at the user's explicit request.
The three panorama documents load `tour-branding.css`. Its watermark belongs to
the player's inner viewer root (`#container > div:first-child`), which Pano2VR
promotes to fullscreen. Keeping the mark inside that root preserves it in both
embedded and fullscreen modes; the outer `#container` stays outside fullscreen.
The inner root fills the host height so the absolute watermark also has a
visible positioning box outside fullscreen. All three viewers use the same
smaller lower-left lockup, clear of the centered controls. Cube
tiles are parts of a continuous panorama and must not each receive a repeated watermark.

The embedded handles and the shared Instagram link use `artefact_studio_design`.
An explicitly configured Instagram URL can override the default destination.
The development credit now uses Vawzen's supplied stacked white wordmark in the
shared footer, and the introduction uses its horizontal white wordmark. Public
SVGs in `public/assets/brand/vawzen-wordmark-*.svg` preserve the supplied paths
from `ARTIFACT MEDIA/vawzen-logo/svg`. The footer credit links to
`https://vawzen.org/`. Existing project dates, titles and
client artwork remain separate from studio branding.

## Rebuilding the still images

Processing is deterministic and uses local tools, as explicitly approved by the
user. It does not regenerate architectural artwork with an image model.
`scripts/media-branding-plan.json` records original hashes, reviewed removal
regions, placement and orientation. `scripts/rebrand-images.py` refuses sources
that do not match the original hashes, preventing accidental double stamping.
Entries marked `scene-placeholder` or `viewer-overlay` are copied byte-for-byte
without compositing or recompression. Rebuilding media preserves unbranded 3D
illustrations and avoids stamping a second mark into the hero posters.

Install Pillow, numpy and opencv-python-headless in a task-local Python environment.
Render the exact SVGs with the project's existing sharp dependency:

```sh
node scripts/render-brand-logos.mjs /tmp/artefact-brand-logos
```

Recover original public images from commit `33bb355` into an isolated source
folder, or use the matching archived source files. Keep the `public/` directory
structure. Then run from the repository root:

```sh
python scripts/rebrand-images.py \
  --source-root /path/to/original-checkout \
  --output-root . \
  --logo-root /tmp/artefact-brand-logos
```

The reviewed mask removes the old mark and domain lettering; tightly bounded
neutral-white masks handle the perspective mark and vertical text. Local
inpainting preserves the surrounding picture, followed by exact SVG compositing.
JPEG/WebP dimensions and authored framing are retained. Echo frames keep the
existing WebP quality of 75; other WebP images use 85 and JPEGs use 90.

## Rebuilding portfolio videos

Also install imageio-ffmpeg. Original full-HD videos must be named with their
catalogue identifiers (`34hD4u8WFuI.mp4`, etc.) in an isolated source directory:

```sh
python scripts/rebrand-videos.py \
  --source-root /path/to/original-videos \
  --logo-root /tmp/artefact-brand-logos
```

The script retains frame counts, removes the reviewed watermarks, replaces the
Villa outro, composites the exact lockup and copies the original audio into AAC.
A temporary encode replaces the public file only after successful completion.
Recover the original hero videos from commit `33bb355`; their shared viewport
overlay in `hero.module.css` handles branding without re-encoding the loops.

## Cache and evidence

`brandedImageSource` gives optimized photographs an explicit branding revision.
Next's local image patterns allow only the corresponding revision query and
ordinary query-free local paths. This bypasses existing optimizer entries for
the old watermarks; update both the helper revision and its local pattern when
performing another raster branding replacement.

`media-branding-audit.json` records processed files, dimensions, frame counts and
final hashes. Validation checks all image dimensions, tests the old template at
its reviewed locations, decodes every portfolio video at 1920×1080, and exercises
native mobile playback and panorama branding in the browser. The original
watermark has no remaining matches in the reviewed image regions.

Before the 3D branding removal, the production build and full Biome check passed.
The production audit on port 3111 checked 101 route variants, 23 internal destinations and 295 local
assets without failures. All eight MP4s support HTTP byte ranges (206); the
versioned image optimizer returns 200. Vawzen checks cover a 390px project
image, local full-HD playback/seeking and branding in all three panorama viewers.

After removing 3D branding, targeted Biome and TypeScript checks pass. All eight
placeholders match their original hashes and rebuild byte-for-byte. Vawzen
confirms no desktop scene overlays and all five mobile illustrations loaded at
390px.

Vaelix verifies the smaller lower-left branding in all three tours at 390px and
in the desktop tour, desktop hero and mobile hero. The hero videos and posters
match their original hashes; both poster entries rebuild byte-for-byte.

On 2026-10-16, Vaelix checks confirm the watermark in normal and native fullscreen
modes for the homepage, Cafe and Villa tours, including after leaving fullscreen.
