/*
Copyright (c) 2026 Yuancheng Li
SPDX-License-Identifier: Apache-2.0
*/

"use client";

import { Canvas } from "@react-three/fiber";
import { View } from "@react-three/drei";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { VirtuosoGrid } from "react-virtuoso";
import type { GridComponents, ListRange } from "react-virtuoso";
import { MotionPreviewCard } from "./motion-preview-card";
import { preloadMotionPreviewAssets } from "./motion-preview-scene";
import type { MotionPreview, MotionPreviewPage } from "../types/motion-preview";

type MotionPreviewGridProps = {
  previews: MotionPreview[];
  nextOffset: number | null;
  pageSize: number;
  totalCount: number;
};

type MotionPreviewGridContext = {
  isLoadingMore: boolean;
  loadedCount: number;
  nextOffset: number | null;
  totalCount: number;
};

const initialPreviewWindowSize = 8;
const preloadBufferSize = 6;

function MotionPreviewGridFooter({
  context,
}: {
  context: MotionPreviewGridContext;
}) {
  if (!context.isLoadingMore && context.nextOffset !== null) {
    return null;
  }

  return (
    <div className="py-8 text-center text-sm text-zinc-500">
      {context.isLoadingMore
        ? "Loading more previews..."
        : `${context.loadedCount} of ${context.totalCount} previews loaded`}
    </div>
  );
}

const gridComponents = {
  Footer: MotionPreviewGridFooter,
} satisfies GridComponents<MotionPreviewGridContext>;

export function MotionPreviewGrid({
  previews,
  nextOffset: initialNextOffset,
  pageSize,
  totalCount,
}: MotionPreviewGridProps) {
  const [canvasReady, setCanvasReady] = useState(false);
  const [loadedPreviews, setLoadedPreviews] = useState(previews);
  const [nextOffset, setNextOffset] = useState(initialNextOffset);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [visibleRange, setVisibleRange] = useState<ListRange | null>(null);
  const isLoadingMoreRef = useRef(false);
  const gridContext = useMemo(
    () => ({
      isLoadingMore,
      loadedCount: loadedPreviews.length,
      nextOffset,
      totalCount,
    }),
    [isLoadingMore, loadedPreviews.length, nextOffset, totalCount],
  );
  const previewsToPreload = useMemo(() => {
    if (!visibleRange) {
      return loadedPreviews.slice(0, initialPreviewWindowSize);
    }

    const startIndex = Math.max(visibleRange.startIndex - preloadBufferSize, 0);
    const endIndex = Math.min(
      visibleRange.endIndex + preloadBufferSize + 1,
      loadedPreviews.length,
    );

    return loadedPreviews.slice(startIndex, endIndex);
  }, [loadedPreviews, visibleRange]);

  useEffect(() => {
    preloadMotionPreviewAssets(previewsToPreload);
  }, [previewsToPreload]);

  const loadMorePreviews = useCallback(async () => {
    if (isLoadingMoreRef.current || nextOffset === null) {
      return;
    }

    isLoadingMoreRef.current = true;
    setIsLoadingMore(true);

    try {
      const response = await fetch(
        `/api/motion-previews?offset=${nextOffset}&limit=${pageSize}`,
      );

      if (!response.ok) {
        return;
      }

      const page = (await response.json()) as MotionPreviewPage;

      setLoadedPreviews((currentPreviews) => {
        const loadedIds = new Set(currentPreviews.map((preview) => preview.id));
        const newPreviews = page.items.filter(
          (preview) => !loadedIds.has(preview.id),
        );

        return [...currentPreviews, ...newPreviews];
      });
      setNextOffset(page.nextOffset);
    } finally {
      isLoadingMoreRef.current = false;
      setIsLoadingMore(false);
    }
  }, [nextOffset, pageSize]);

  const handleRangeChanged = useCallback(
    (range: ListRange) => {
      setVisibleRange(range);
    },
    [],
  );
  const handleEndReached = useCallback(
    (index: number) => {
      if (index < loadedPreviews.length - 1) {
        return;
      }

      void loadMorePreviews();
    },
    [loadMorePreviews, loadedPreviews.length],
  );

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
        components={gridComponents}
        computeItemKey={(_, preview) => preview.id}
        context={gridContext}
        data={loadedPreviews}
        endReached={handleEndReached}
        increaseViewportBy={{ top: 640, bottom: 640 }}
        initialItemCount={Math.min(
          loadedPreviews.length,
          initialPreviewWindowSize,
        )}
        itemClassName="min-w-0"
        itemContent={(_, preview) => <MotionPreviewCard preview={preview} />}
        listClassName="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4"
        rangeChanged={handleRangeChanged}
        useWindowScroll
      />
    </section>
  );
}
