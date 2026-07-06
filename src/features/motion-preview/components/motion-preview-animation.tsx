/*
Copyright (c) 2026 Yuancheng Li
SPDX-License-Identifier: Apache-2.0
*/

"use client";

import { useAnimations, useGLTF } from "@react-three/drei";
import { useEffect, useMemo, useRef } from "react";
import {
  BackSide,
  Color,
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
import type {
  MotionPreview,
  PreviewFrame,
  PreviewFrameTarget,
} from "../types/motion-preview";

type LoadedGlb = {
  scene: Group;
  animations: AnimationClip[];
};

type PendingModelDisposal = {
  model: Group;
  timeoutId: number;
};

const humanoidUrl = "/fixtures/humanoid/cmu_humanoid.glb";
const previewRootBoneName = "mixamorigHips";

const toonColors = {
  surface: new Color("#f0b783"),
  joints: new Color("#256f7a"),
  fallback: new Color("#d9a441"),
};
const previewSampleFrame = 1;
const previewSampleFrameRate = 30;
const outlineOffset = 0.015;
const previewSampleTime = previewSampleFrame / previewSampleFrameRate;

export function preloadMotionPreviewAssets(previews: MotionPreview[]) {
  useGLTF.preload(humanoidUrl);

  previews.forEach((preview) => {
    useGLTF.preload(preview.glbUrl);
  });
}

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

function collectMaterials(
  material: Material | Material[],
  materials: Set<Material>,
) {
  if (Array.isArray(material)) {
    material.forEach((entry) => materials.add(entry));
    return;
  }

  materials.add(material);
}

function disposePreviewModel(model: Group) {
  const materials = new Set<Material>();

  model.traverse((object) => {
    const mesh = object as Mesh;

    if (mesh.isMesh && mesh.material) {
      collectMaterials(mesh.material, materials);
    }
  });

  materials.forEach((material) => {
    material.dispose();
  });
  model.clear();
}

function getPreviewRootBonePosition(model: Group) {
  const rootBone = model.getObjectByName(previewRootBoneName);

  if (!rootBone) {
    return null;
  }

  const rootPosition = new Vector3();

  rootBone.getWorldPosition(rootPosition);

  return {
    name: rootBone.name,
    position: rootPosition,
  };
}

export function AnimatedGlb({
  onPreviewFrameTargetChange,
  previewFrame,
  src,
}: {
  onPreviewFrameTargetChange?: (target: PreviewFrameTarget) => void;
  previewFrame?: PreviewFrame;
  src: string;
}) {
  const group = useRef<Group>(null);
  const pendingModelDisposal = useRef<PendingModelDisposal | null>(null);
  const humanoid = useGLTF(humanoidUrl) as LoadedGlb;
  const { animations } = useGLTF(src) as LoadedGlb;
  const model = useMemo(() => {
    const clonedHumanoid = cloneSkeleton(humanoid.scene) as Group;

    return addOutlineShells(applyToonMaterials(clonedHumanoid));
  }, [humanoid.scene]);
  const { actions } = useAnimations(animations, group);

  useEffect(() => {
    const pendingDisposal = pendingModelDisposal.current;

    if (pendingDisposal?.model === model) {
      window.clearTimeout(pendingDisposal.timeoutId);
      pendingModelDisposal.current = null;
    }

    return () => {
      const timeoutId = window.setTimeout(() => {
        disposePreviewModel(model);

        if (pendingModelDisposal.current?.model === model) {
          pendingModelDisposal.current = null;
        }
      }, 0);

      pendingModelDisposal.current = { model, timeoutId };
    };
  }, [model]);

  useEffect(() => {
    const action = Object.values(actions)[0];

    if (!action) {
      return;
    }

    action.reset().play();

    const animationFrameId = window.requestAnimationFrame(() => {
      const mixer = action.getMixer();

      mixer.setTime(previewSampleTime);
      model.updateMatrixWorld(true);

      const rootBonePosition = getPreviewRootBonePosition(model);

      if (!rootBonePosition) {
        if (process.env.NODE_ENV !== "production") {
          console.warn("Preview root bone not found", {
            src,
            expectedBoneName: previewRootBoneName,
          });
        }

        return;
      }

      onPreviewFrameTargetChange?.({
        x: rootBonePosition.position.x,
        z: rootBonePosition.position.z,
      });
    });

    return () => {
      window.cancelAnimationFrame(animationFrameId);
      action.stop();
    };
  }, [actions, model, onPreviewFrameTargetChange, previewFrame, src]);

  return (
    <group ref={group}>
      <primitive object={model} />
    </group>
  );
}
