/*
Copyright (c) 2026 Yuancheng Li
SPDX-License-Identifier: Apache-2.0
*/

"use client";

import { Canvas } from "@react-three/fiber";
import { View } from "@react-three/drei";
import { useEffect, useMemo, useState } from "react";
import { VirtuosoGrid } from "react-virtuoso";
import type { ListRange } from "react-virtuoso";
import { MotionPreviewCard } from "./motion-preview-card";
import { preloadMotionPreviewAssets } from "./motion-preview-scene";
import type { MotionPreview } from "../types/motion-preview";

type MotionPreviewGridProps = {
  previews: MotionPreview[];
};

const initialPreviewWindowSize = 8;
const preloadBufferSize = 6;

export function MotionPreviewGrid({ previews }: MotionPreviewGridProps) {
  const [canvasReady, setCanvasReady] = useState(false);
  const [visibleRange, setVisibleRange] = useState<ListRange | null>(null);
  const previewsToPreload = useMemo(() => {
    if (!visibleRange) {
      return previews.slice(0, initialPreviewWindowSize);
    }

    const startIndex = Math.max(visibleRange.startIndex - preloadBufferSize, 0);
    const endIndex = Math.min(
      visibleRange.endIndex + preloadBufferSize + 1,
      previews.length,
    );

    return previews.slice(startIndex, endIndex);
  }, [previews, visibleRange]);

  useEffect(() => {
    preloadMotionPreviewAssets(previewsToPreload);
  }, [previewsToPreload]);

  useEffect(() => {
    let secondFrame = 0;
    const firstFrame = window.requestAnimationFrame(() => {
      secondFrame = window.requestAnimationFrame(() => {
        setCanvasReady(true);
      });
    });

    return () => {
      window.cancelAnimationFrame(firstFrame);

      if (secondFrame) {
        window.cancelAnimationFrame(secondFrame);
      }
    };
  }, []);

  return (
    <section className="relative">
      {canvasReady ? (
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
      ) : null}

      <VirtuosoGrid
        className="relative z-10"
        computeItemKey={(_, preview) => preview.id}
        data={previews}
        increaseViewportBy={{ top: 640, bottom: 640 }}
        initialItemCount={Math.min(previews.length, initialPreviewWindowSize)}
        itemClassName="min-w-0"
        itemContent={(_, preview) => <MotionPreviewCard preview={preview} />}
        listClassName="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4"
        rangeChanged={setVisibleRange}
        useWindowScroll
      />
    </section>
  );
}
