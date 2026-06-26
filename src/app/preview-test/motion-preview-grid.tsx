/*
Copyright (c) 2026 Yuancheng Li
SPDX-License-Identifier: Apache-2.0
*/

"use client";

import { Canvas } from "@react-three/fiber";
import { Bounds, Center, OrbitControls, useAnimations, useGLTF } from "@react-three/drei";
import { Suspense, useEffect, useMemo, useRef } from "react";
import { Color, MeshToonMaterial } from "three";
import type { AnimationClip, Group, Material, Mesh, Texture } from "three";
import { clone as cloneSkeleton } from "three/examples/jsm/utils/SkeletonUtils.js";

export type MotionPreview = {
  id: string;
  title: string;
  variant: string;
  description: string;
  subject: string;
  glbUrl: string;
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

function AnimatedGlb({ src }: { src: string }) {
  const group = useRef<Group>(null);
  const humanoid = useGLTF(humanoidUrl) as LoadedGlb;
  const { animations } = useGLTF(src) as LoadedGlb;
  const model = useMemo(
    () => applyToonMaterials(cloneSkeleton(humanoid.scene)),
    [humanoid.scene],
  );
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
      <Center>
        <primitive object={model} />
      </Center>
    </group>
  );
}

function PreviewCard({ preview }: { preview: MotionPreview }) {
  return (
    <article className="grid min-h-[320px] grid-rows-[minmax(210px,1fr)_auto] overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm">
      <div className="relative bg-zinc-100">
        <Canvas
          camera={{ position: [0, 1.2, 3.4], fov: 34 }}
          dpr={[1, 1.5]}
          gl={{ antialias: true }}
        >
          <color attach="background" args={["#f4f4f5"]} />
          <ambientLight intensity={1.8} />
          <directionalLight position={[2, 4, 3]} intensity={2.2} />
          <Suspense fallback={null}>
            <Bounds fit clip observe margin={1.25}>
              <AnimatedGlb src={preview.glbUrl} />
            </Bounds>
          </Suspense>
          <OrbitControls enablePan={false} enableZoom={false} />
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
