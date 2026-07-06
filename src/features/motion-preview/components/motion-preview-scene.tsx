/*
Copyright (c) 2026 Yuancheng Li
SPDX-License-Identifier: Apache-2.0
*/

"use client";

import { Suspense, useCallback, useState } from "react";
import type { RefObject } from "react";
import type {
  MotionPreview,
  PreviewFrameTarget,
} from "../types/motion-preview";
import { AnimatedGlb } from "./motion-preview-animation";
import { PreviewCamera, PreviewControls } from "./motion-preview-camera";

type MotionPreviewSceneProps = {
  controlsElementRef: RefObject<HTMLElement | null>;
  preview: MotionPreview;
};

type MeasuredPreviewFrameTarget = PreviewFrameTarget & {
  previewId: string;
};

export function MotionPreviewScene({
  controlsElementRef,
  preview,
}: MotionPreviewSceneProps) {
  const [measuredTarget, setMeasuredTarget] =
    useState<MeasuredPreviewFrameTarget | null>(null);
  const handlePreviewFrameTargetChange = useCallback(
    (target: PreviewFrameTarget) => {
      setMeasuredTarget((currentTarget) => {
        if (
          currentTarget &&
          currentTarget.previewId === preview.id &&
          currentTarget.x === target.x &&
          currentTarget.z === target.z
        ) {
          return currentTarget;
        }

        return {
          ...target,
          previewId: preview.id,
        };
      });
    },
    [preview.id],
  );
  const runtimeTarget =
    measuredTarget?.previewId === preview.id ? measuredTarget : null;

  return (
    <>
      <color attach="background" args={["#f4f4f5"]} />
      <PreviewCamera
        previewFrame={preview.previewFrame}
        runtimeTarget={runtimeTarget}
      />
      <ambientLight intensity={1.8} />
      <directionalLight position={[2, 4, 3]} intensity={2.2} />
      <Suspense fallback={null}>
        <AnimatedGlb
          onPreviewFrameTargetChange={handlePreviewFrameTargetChange}
          previewFrame={preview.previewFrame}
          src={preview.glbUrl}
        />
      </Suspense>
      <PreviewControls
        controlsElementRef={controlsElementRef}
        previewFrame={preview.previewFrame}
        runtimeTarget={runtimeTarget}
      />
    </>
  );
}
