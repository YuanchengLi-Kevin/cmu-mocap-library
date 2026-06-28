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
