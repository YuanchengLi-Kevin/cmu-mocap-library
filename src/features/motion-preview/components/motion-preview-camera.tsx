/*
Copyright (c) 2026 Yuancheng Li
SPDX-License-Identifier: Apache-2.0
*/

"use client";

import { OrbitControls, PerspectiveCamera } from "@react-three/drei";
import { useEffect, useMemo, useRef, useState } from "react";
import type { RefObject } from "react";
import { MathUtils, Vector3 } from "three";
import type { PerspectiveCamera as ThreePerspectiveCamera } from "three";
import type { PreviewFrame, PreviewFrameTarget } from "../types/motion-preview";

type PreviewCameraConfig = {
  position: [number, number, number];
  fov: number;
  near?: number;
  far?: number;
};

const previewCameraFov = 34;
const previewFrameTargetX = 0;
const previewFrameTargetZ = 1.25;
const previewFramePadding = 0.5;
const previewFrameTargetYOffset = 0.3;
const defaultPreviewCameraTarget = new Vector3(0, 1.2, 0);

function getPreviewFrameTarget(
  previewFrame: PreviewFrame,
  fov: number,
  runtimeTarget?: PreviewFrameTarget | null,
) {
  const frameHeight = Math.max(
    (previewFrame.ceilingY - previewFrame.floorY) * 3,
    0.1,
  );
  const distance =
    (frameHeight / 2 / Math.tan(MathUtils.degToRad(fov) / 2)) *
    previewFramePadding;

  return {
    target: new Vector3(
      runtimeTarget?.x ?? previewFrameTargetX,
      (previewFrame.floorY + previewFrame.ceilingY) / 2 +
        previewFrameTargetYOffset,
      runtimeTarget?.z ?? previewFrameTargetZ,
    ),
    distance,
  };
}

function getPreviewFrameCamera(
  previewFrame: PreviewFrame,
  runtimeTarget?: PreviewFrameTarget | null,
): PreviewCameraConfig {
  const { target, distance } = getPreviewFrameTarget(
    previewFrame,
    previewCameraFov,
    runtimeTarget,
  );
  const frameHeight = Math.max(
    previewFrame.ceilingY - previewFrame.floorY,
    0.1,
  );

  return {
    position: [target.x, target.y, target.z + distance],
    fov: previewCameraFov,
    near: 0.01,
    far: Math.max(100, distance + frameHeight * 4),
  };
}

function getPreviewCamera(
  previewFrame?: PreviewFrame,
  runtimeTarget?: PreviewFrameTarget | null,
): PreviewCameraConfig {
  if (previewFrame) {
    return getPreviewFrameCamera(previewFrame, runtimeTarget);
  }

  return {
    position: [0, 1.2, 3.4],
    fov: previewCameraFov,
  };
}

function getTarget(
  previewFrame?: PreviewFrame,
  runtimeTarget?: PreviewFrameTarget | null,
) {
  return previewFrame
    ? getPreviewFrameTarget(previewFrame, previewCameraFov, runtimeTarget)
        .target
    : defaultPreviewCameraTarget;
}

export function PreviewCamera({
  previewFrame,
  runtimeTarget,
}: {
  previewFrame?: PreviewFrame;
  runtimeTarget?: PreviewFrameTarget | null;
}) {
  const cameraRef = useRef<ThreePerspectiveCamera>(null);
  const camera = useMemo(
    () => getPreviewCamera(previewFrame, runtimeTarget),
    [previewFrame, runtimeTarget],
  );
  const target = useMemo(
    () => getTarget(previewFrame, runtimeTarget),
    [previewFrame, runtimeTarget],
  );

  useEffect(() => {
    const activeCamera = cameraRef.current;

    if (!activeCamera) {
      return;
    }

    activeCamera.lookAt(target);
    activeCamera.updateProjectionMatrix();
  }, [target]);

  return (
    <PerspectiveCamera
      ref={cameraRef}
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

export function PreviewControls({
  controlsElementRef,
  previewFrame,
  runtimeTarget,
}: {
  controlsElementRef: RefObject<HTMLElement | null>;
  previewFrame?: PreviewFrame;
  runtimeTarget?: PreviewFrameTarget | null;
}) {
  const [controlsElement, setControlsElement] = useState<HTMLElement>();
  const target = useMemo(
    () => getTarget(previewFrame, runtimeTarget),
    [previewFrame, runtimeTarget],
  );

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
