/*
Copyright (c) 2026 Yuancheng Li
SPDX-License-Identifier: Apache-2.0
*/

"use client";

import {
  OrbitControls,
  PerspectiveCamera,
  useAnimations,
  useGLTF,
} from "@react-three/drei";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import type { RefObject } from "react";
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
import type { MotionPreview, PreviewBound } from "../types/motion-preview";

type MotionPreviewSceneProps = {
  controlsElementRef: RefObject<HTMLElement | null>;
  preview: MotionPreview;
};

type LoadedGlb = {
  scene: Group;
  animations: AnimationClip[];
};

type PreviewCameraConfig = {
  position: [number, number, number];
  fov: number;
  near?: number;
  far?: number;
};

const humanoidUrl = "/fixtures/humanoid/cmu_humanoid.glb";

const toonColors = {
  surface: new Color("#f0b783"),
  joints: new Color("#256f7a"),
  fallback: new Color("#d9a441"),
};
const previewTargetHeight = 1.2;
const outlineOffset = 0.015;

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

function getPreviewTarget(previewBound?: PreviewBound) {
  return previewBound
    ? new Vector3(previewBound.center[0], previewTargetHeight, previewBound.center[2])
    : new Vector3(0, previewTargetHeight, 0);
}

function getPreviewCamera(previewBound?: PreviewBound): PreviewCameraConfig {
  const fov = 34;

  if (!previewBound) {
    return {
      position: [0, 1.2, 3.4],
      fov,
    };
  }

  const target = getPreviewTarget(previewBound);
  const radius = Math.max(previewBound.radius, 0.1);
  const distance = (radius / Math.sin(MathUtils.degToRad(fov) / 2)) * 1.2;

  return {
    position: [target.x, target.y + radius * 0.12, target.z + distance],
    fov,
    near: Math.max(0.01, distance - radius * 4),
    far: distance + radius * 4,
  };
}

function PreviewCamera({ previewBound }: { previewBound?: PreviewBound }) {
  const camera = useMemo(() => getPreviewCamera(previewBound), [previewBound]);
  const target = useMemo(() => getPreviewTarget(previewBound), [previewBound]);

  return (
    <PerspectiveCamera
      makeDefault
      position={camera.position}
      fov={camera.fov}
      near={camera.near}
      far={camera.far}
      onUpdate={(activeCamera) => {
        activeCamera.lookAt(target);
        activeCamera.updateProjectionMatrix();
      }}
    />
  );
}

function PreviewControls({
  controlsElementRef,
  previewBound,
}: {
  controlsElementRef: RefObject<HTMLElement | null>;
  previewBound?: PreviewBound;
}) {
  const [controlsElement, setControlsElement] = useState<HTMLElement>();
  const target = useMemo(() => getPreviewTarget(previewBound), [previewBound]);

  useEffect(() => {
    if (controlsElementRef.current) {
      setControlsElement(controlsElementRef.current);
    }
  }, [controlsElementRef]);

  if (!controlsElement) {
    return null;
  }

  return (
    <OrbitControls
      domElement={controlsElement}
      enablePan={false}
      enableZoom={false}
      target={target}
    />
  );
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

export function MotionPreviewScene({
  controlsElementRef,
  preview,
}: MotionPreviewSceneProps) {
  return (
    <>
      <color attach="background" args={["#f4f4f5"]} />
      <PreviewCamera previewBound={preview.previewBound} />
      <ambientLight intensity={1.8} />
      <directionalLight position={[2, 4, 3]} intensity={2.2} />
      <Suspense fallback={null}>
        <AnimatedGlb src={preview.glbUrl} />
      </Suspense>
      <PreviewControls
        controlsElementRef={controlsElementRef}
        previewBound={preview.previewBound}
      />
    </>
  );
}
