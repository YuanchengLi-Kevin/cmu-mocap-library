# CMU Mocap Library

A Next.js application for browsing and previewing retargeted CMU motion capture
clips.

## Development

Install dependencies, then run the development server:

```bash
pnpm install
pnpm dev
```

Open the app at:

```text
http://localhost:3000
```

The temporary fixture preview route is available at:

```text
http://localhost:3000/preview-test
```

## Fixture Data

Local preview fixtures live under `public/fixtures`:

```text
public/fixtures/
  humanoid/
    cmu_humanoid.glb
  manifests/
    motion_index.json
    motions.json
    bvh_metadata.json
    source.json
  previews/
    cmu_01_01.glb
    cmu_01_01_in_place.glb
    ...
```

The fixture files are a local development aid. Production metadata is expected
to come from PostgreSQL, while production GLB files are expected to be served
directly from object storage.

## Rendering Architecture

The preview GLBs in `public/fixtures/previews` contain motion data only. They
include skeleton nodes, skin data, and animation clips, but they do not include
a visible character mesh.

The visible character mesh is stored once:

```text
public/fixtures/humanoid/cmu_humanoid.glb
```

Preview rendering combines these two asset types:

- Load `cmu_humanoid.glb` as the visible humanoid model.
- Load each preview GLB for its animation clip.
- Clone the humanoid model for each preview card.
- Apply one motion clip to each cloned humanoid.

The clone step is required because skinned meshes and skeleton state should not
be shared across multiple simultaneously animated previews.

The current `/preview-test` route uses one shared React Three Fiber canvas with
Drei `View` regions. Each card owns a tracked view region, while the shared
canvas renders those regions through one WebGL context to reduce renderer and
GPU overhead.

## Preview Infinite Scroll

The `/preview-test` route loads fixture previews in pages of 12. The first page
is rendered on the server from local fixture files, then additional pages are
loaded through:

```text
/api/motion-previews?offset=<number>&limit=<number>
```

`MotionPreviewGrid` keeps the original shared-canvas rendering path for normal
scrolling:

- Virtuoso uses window scrolling.
- The shared canvas stays fixed to the viewport.
- Drei `View` tracks each card's preview region.
- A warm render/preload buffer is kept around the visible range.

This is intentional. The 12-preview version had good scroll synchronization,
and the infinite-scroll implementation should preserve that behavior as much as
possible. Infinite scroll should be treated as a data-loading layer around the
existing shared-canvas preview architecture, not as a reason to change the
normal `View` lifecycle.

There is one known limitation: during very fast scrolls, the browser can move
the DOM cards before the fixed WebGL canvas has rendered updated Drei `View`
scissor regions. This can create a one-frame visual mismatch. The current
implementation handles that by fading the fixed canvas only when scroll velocity
is high. Slow and normal scrolling should keep the previews visible.

When working in this area, avoid these regressions:

- Do not create one canvas per card.
- Do not toggle Drei `View.visible` during normal scrolling.
- Do not use Virtuoso scroll-seek placeholders for the preview cards unless the
  normal slow-scroll sync is revalidated.
- Do not load page 2 during initial layout; additional pages should load only
  when the user scrolls near the bottom.
