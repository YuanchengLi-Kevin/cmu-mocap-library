/*
Copyright (c) 2026 Yuancheng Li
SPDX-License-Identifier: Apache-2.0
*/

"use client";

import { View } from "@react-three/drei";
import { useRef } from "react";
import { MotionPreviewScene } from "./motion-preview-scene";
import type { MotionPreview } from "../types/motion-preview";

type MotionPreviewCardProps = {
  preview: MotionPreview;
};

export function MotionPreviewCard({ preview }: MotionPreviewCardProps) {
  const viewRef = useRef<HTMLElement | null>(null);

  return (
    <article className="grid min-h-[320px] grid-rows-[minmax(210px,1fr)_auto] overflow-hidden rounded-lg border border-zinc-200 bg-transparent shadow-sm">
      <div className="relative min-h-[210px]">
        <View ref={viewRef} className="block h-full w-full touch-none">
          <MotionPreviewScene controlsElementRef={viewRef} preview={preview} />
        </View>
      </div>

      <div className="flex flex-col gap-2 border-t border-zinc-200 bg-white p-3">
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
