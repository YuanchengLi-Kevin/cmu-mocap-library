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
import type {
  PreviewBound,
  PreviewFrame,
  PreviewFrameTarget,
} from "../types/motion-preview";

type PreviewCameraConfig = {
  position: [number, number, number];
  fov: number;
  near?: number;
  far?: number;
};

const previewCameraFov = 34;
const previewFrameTargetX = 0;
const previewFrameTargetZ = 1.25;
const previewTargetHeight = 1.2;
const previewFramePadding = 1.12;
const previewRadiusPadding = 1.05;

function getPreviewFrameTarget(
  previewFrame: PreviewFrame,
  fov: number,
  runtimeTarget?: PreviewFrameTarget | null,
) {
  const frameHeight = Math.max(
    previewFrame.ceilingY - previewFrame.floorY,
    0.1,
  );
  const distance =
    (frameHeight / 2 / Math.tan(MathUtils.degToRad(fov) / 2)) *
    previewFramePadding;

  return {
    target: new Vector3(
      runtimeTarget?.x ?? previewFrameTargetX,
      (previewFrame.floorY + previewFrame.ceilingY) / 2,
      runtimeTarget?.z ?? previewFrameTargetZ,
    ),
    distance,
  };
}

function getPreviewTarget(previewBound?: PreviewBound) {
  if (!previewBound) {
    return new Vector3(0, previewTargetHeight, 0);
  }

  return new Vector3(
    previewBound.center[0],
    previewTargetHeight,
    previewBound.center[2],
  );
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

function getPreviewBoundCamera(
  previewBound: PreviewBound,
): PreviewCameraConfig {
  const target = getPreviewTarget(previewBound);
  const radius = Math.max(previewBound.radius, 0.1);
  const verticalOffset = Math.abs(previewBound.center[1] - target.y);
  const effectiveRadius = Math.sqrt(radius ** 2 + verticalOffset ** 2);
  const distance =
    (effectiveRadius / Math.sin(MathUtils.degToRad(previewCameraFov) / 2)) *
    previewRadiusPadding;

  return {
    position: [
      target.x,
      target.y + effectiveRadius * 0.12,
      target.z + distance,
    ],
    fov: previewCameraFov,
    near: Math.max(0.01, distance - effectiveRadius * 4),
    far: distance + effectiveRadius * 4,
  };
}

function getPreviewCamera(
  previewFrame?: PreviewFrame,
  previewBound?: PreviewBound,
  runtimeTarget?: PreviewFrameTarget | null,
): PreviewCameraConfig {
  if (previewFrame) {
    return getPreviewFrameCamera(previewFrame, runtimeTarget);
  }

  if (previewBound) {
    return getPreviewBoundCamera(previewBound);
  }

  return {
    position: [0, 1.2, 3.4],
    fov: previewCameraFov,
  };
}

function getTarget(
  previewFrame?: PreviewFrame,
  previewBound?: PreviewBound,
  runtimeTarget?: PreviewFrameTarget | null,
) {
  return previewFrame
    ? getPreviewFrameTarget(previewFrame, previewCameraFov, runtimeTarget)
        .target
    : getPreviewTarget(previewBound);
}

export function PreviewCamera({
  previewFrame,
  previewBound,
  runtimeTarget,
}: {
  previewFrame?: PreviewFrame;
  previewBound?: PreviewBound;
  runtimeTarget?: PreviewFrameTarget | null;
}) {
  const cameraRef = useRef<ThreePerspectiveCamera>(null);
  const camera = useMemo(
    () => getPreviewCamera(previewFrame, previewBound, runtimeTarget),
    [previewFrame, previewBound, runtimeTarget],
  );
  const target = useMemo(
    () => getTarget(previewFrame, previewBound, runtimeTarget),
    [previewFrame, previewBound, runtimeTarget],
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
  previewBound,
  runtimeTarget,
}: {
  controlsElementRef: RefObject<HTMLElement | null>;
  previewFrame?: PreviewFrame;
  previewBound?: PreviewBound;
  runtimeTarget?: PreviewFrameTarget | null;
}) {
  const [controlsElement, setControlsElement] = useState<HTMLElement>();
  const target = useMemo(
    () => getTarget(previewFrame, previewBound, runtimeTarget),
    [previewFrame, previewBound, runtimeTarget],
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
