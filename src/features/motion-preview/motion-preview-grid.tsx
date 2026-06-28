/*
Copyright (c) 2026 Yuancheng Li
SPDX-License-Identifier: Apache-2.0
*/

"use client";

import { Canvas } from "@react-three/fiber";
import { View } from "@react-three/drei";
import { useEffect } from "react";
import { MotionPreviewCard } from "./motion-preview-card";
import { preloadMotionPreviewAssets } from "./motion-preview-scene";
import type { MotionPreview } from "./types";

type MotionPreviewGridProps = {
  previews: MotionPreview[];
};

export function MotionPreviewGrid({ previews }: MotionPreviewGridProps) {
  useEffect(() => {
    preloadMotionPreviewAssets(previews);
  }, [previews]);

  return (
    <section className="relative">
      <Canvas
        dpr={[1, 1.5]}
        eventPrefix="client"
        gl={{ alpha: true, antialias: true }}
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 0,
          pointerEvents: "none",
        }}
      >
        <View.Port />
      </Canvas>

      <div className="relative z-10 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
        {previews.map((preview) => (
          <MotionPreviewCard key={preview.id} preview={preview} />
        ))}
      </div>
    </section>
  );
}
