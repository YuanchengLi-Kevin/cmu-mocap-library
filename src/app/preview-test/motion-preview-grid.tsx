/*
Copyright (c) 2026 Yuancheng Li
SPDX-License-Identifier: Apache-2.0
*/

"use client";

import { Canvas } from "@react-three/fiber";
import { OrbitControls, useAnimations, useGLTF } from "@react-three/drei";
import { Suspense, useEffect, useMemo, useRef } from "react";
import {
  BackSide,
  Color,
  MathUtils,
  MeshToonMaterial,
  ShaderMaterial,
  Vector3,
} from "three";
import type {
  AnimationClip,
  Group,
  Material,
  Mesh,
  Object3D,
  Texture,
} from "three";
import { clone as cloneSkeleton } from "three/examples/jsm/utils/SkeletonUtils.js";

export type PreviewBound = {
  center: [number, number, number];
  size: [number, number, number];
  radius: number;
  height: number;
};

export type MotionPreview = {
  id: string;
  title: string;
  variant: string;
  description: string;
  subject: string;
  glbUrl: string;
  previewBound?: PreviewBound;
};

type MotionPreviewGridProps = {
  previews: MotionPreview[];
};

type LoadedGlb = {
  scene: Group;
  animations: AnimationClip[];
};

const humanoidUrl = "/fixtures/humanoid/cmu_humanoid.glb";

const toonColors = {
  surface: new Color("#f0b783"),
  joints: new Color("#256f7a"),
  fallback: new Color("#d9a441"),
};
const previewTargetHeight = 0.9;
const outlineOffset = 0.015;

function createOutlineMaterial() {
  return new ShaderMaterial({
    uniforms: {
      color: { value: new Color("#1f2937") },
      offset: { value: outlineOffset },
    },
    vertexShader: `
      #include <common>
      #include <morphtarget_pars_vertex>
      #include <skinning_pars_vertex>

      uniform float offset;

      void main() {
        #include <beginnormal_vertex>
        #include <morphnormal_vertex>
        #include <skinbase_vertex>
        #include <skinnormal_vertex>
        #include <defaultnormal_vertex>
        #include <begin_vertex>
        #include <morphtarget_vertex>
        #include <skinning_vertex>

        transformed += normalize(objectNormal) * offset;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(transformed, 1.0);
      }
    `,
    fragmentShader: `
      uniform vec3 color;

      void main() {
        gl_FragColor = vec4(color, 1.0);
        #include <colorspace_fragment>
      }
    `,
    side: BackSide,
    depthWrite: false,
    toneMapped: false,
  });
}

function createToonMaterial(material: Material) {
  const source = material as Material & {
    color?: Color;
    map?: Texture | null;
  };
  const materialName = material.name.toLowerCase();
  const color = materialName.includes("joint")
    ? toonColors.joints
    : materialName.includes("surface")
      ? toonColors.surface
      : (source.color ?? toonColors.fallback);

  const toonMaterial = new MeshToonMaterial({
    color: color.clone(),
    map: source.map ?? null,
  });

  toonMaterial.name = material.name ? `${material.name} Toon` : "Humanoid Toon";

  return toonMaterial;
}

function applyToonMaterials(model: Group) {
  model.traverse((object) => {
    const mesh = object as Mesh;

    if (!mesh.isMesh || !mesh.material) {
      return;
    }

    if (Array.isArray(mesh.material)) {
      mesh.material = mesh.material.map(createToonMaterial);
      return;
    }

    mesh.material = createToonMaterial(mesh.material);
  });

  return model;
}

function addOutlineShells(model: Group) {
  const outlineMeshes: Array<{ parent: Object3D; outline: Mesh }> = [];
  const outlineMaterial = createOutlineMaterial();

  model.traverse((object) => {
    const mesh = object as Mesh;

    if (!mesh.isMesh || !mesh.geometry || !mesh.parent) {
      return;
    }

    const outline = mesh.clone(false);

    outline.name = mesh.name ? `${mesh.name} Outline` : "Humanoid Outline";
    outline.material = outlineMaterial;
    outline.renderOrder = -1;
    outline.frustumCulled = false;
    outlineMeshes.push({ parent: mesh.parent, outline });
  });

  outlineMeshes.forEach(({ parent, outline }) => {
    parent.add(outline);
  });

  return model;
}

function getPreviewTarget(previewBound?: PreviewBound) {
  return previewBound
    ? new Vector3(previewBound.center[0], previewTargetHeight, previewBound.center[2])
    : new Vector3(0, previewTargetHeight, 0);
}

function getPreviewCamera(previewBound?: PreviewBound) {
  const fov = 34;

  if (!previewBound) {
    return {
      position: [0, 1.2, 3.4] as [number, number, number],
      fov,
    };
  }

  const target = getPreviewTarget(previewBound);
  const radius = Math.max(previewBound.radius, 0.1);
  const distance = (radius / Math.sin(MathUtils.degToRad(fov) / 2)) * 1.2;

  return {
    position: [
      target.x,
      target.y + radius * 0.12,
      target.z + distance,
    ] as [number, number, number],
    fov,
    near: Math.max(0.01, distance - radius * 4),
    far: distance + radius * 4,
  };
}

function PreviewControls({ previewBound }: { previewBound?: PreviewBound }) {
  const target = useMemo(() => getPreviewTarget(previewBound), [previewBound]);

  return <OrbitControls enablePan={false} enableZoom={false} target={target} />;
}

function AnimatedGlb({ src }: { src: string }) {
  const group = useRef<Group>(null);
  const humanoid = useGLTF(humanoidUrl) as LoadedGlb;
  const { animations } = useGLTF(src) as LoadedGlb;
  const model = useMemo(() => {
    const clonedHumanoid = cloneSkeleton(humanoid.scene) as Group;

    return addOutlineShells(applyToonMaterials(clonedHumanoid));
  }, [humanoid.scene]);
  const { actions } = useAnimations(animations, group);

  useEffect(() => {
    const action = Object.values(actions)[0];

    if (!action) {
      return;
    }

    action.reset().fadeIn(0.2).play();

    return () => {
      action.fadeOut(0.2).stop();
    };
  }, [actions]);

  return (
    <group ref={group}>
      <primitive object={model} />
    </group>
  );
}

function PreviewCard({ preview }: { preview: MotionPreview }) {
  const camera = getPreviewCamera(preview.previewBound);
  const target = getPreviewTarget(preview.previewBound);

  return (
    <article className="grid min-h-[320px] grid-rows-[minmax(210px,1fr)_auto] overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm">
      <div className="relative bg-zinc-100">
        <Canvas
          camera={camera}
          dpr={[1, 1.5]}
          gl={{ antialias: true }}
          onCreated={({ camera }) => {
            camera.lookAt(target);
          }}
        >
          <color attach="background" args={["#f4f4f5"]} />
          <ambientLight intensity={1.8} />
          <directionalLight position={[2, 4, 3]} intensity={2.2} />
          <Suspense fallback={null}>
            <AnimatedGlb src={preview.glbUrl} />
          </Suspense>
          <PreviewControls previewBound={preview.previewBound} />
        </Canvas>
      </div>

      <div className="flex flex-col gap-2 border-t border-zinc-200 p-3">
        <div className="flex items-start justify-between gap-3">
          <h2 className="text-sm font-semibold text-zinc-950">{preview.title}</h2>
          <span className="shrink-0 rounded border border-zinc-300 px-2 py-0.5 text-xs text-zinc-600">
            {preview.variant}
          </span>
        </div>
        <p className="line-clamp-2 text-sm text-zinc-700">{preview.description}</p>
        <p className="line-clamp-1 text-xs text-zinc-500">{preview.subject}</p>
      </div>
    </article>
  );
}

export function MotionPreviewGrid({ previews }: MotionPreviewGridProps) {
  useEffect(() => {
    useGLTF.preload(humanoidUrl);

    previews.forEach((preview) => {
      useGLTF.preload(preview.glbUrl);
    });
  }, [previews]);

  return (
    <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
      {previews.map((preview) => (
        <PreviewCard key={preview.id} preview={preview} />
      ))}
    </section>
  );
}
