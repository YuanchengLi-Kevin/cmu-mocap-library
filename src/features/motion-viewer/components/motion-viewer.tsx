/*
Copyright (c) 2026 Yuancheng Li
SPDX-License-Identifier: Apache-2.0
*/

"use client";

import { OrbitControls, PerspectiveCamera } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { Suspense } from "react";
import { AnimatedGlb } from "../../motion-preview/components/motion-preview-animation";
import type { MotionViewerMotion } from "../types/motion-viewer";

export function MotionViewer({ motion }: { motion: MotionViewerMotion }) {
  return (
    <div className="h-full overflow-hidden bg-zinc-100">
      <Canvas dpr={[1, 1.5]} gl={{ alpha: false, antialias: true }}>
        <color attach="background" args={["#f4f4f5"]} />
        <PerspectiveCamera makeDefault fov={40} position={[0, 1.4, 4.5]} />
        <ambientLight intensity={1.8} />
        <directionalLight position={[2, 4, 3]} intensity={2.2} />
        <gridHelper args={[20, 20, "#a1a1aa", "#d4d4d8"]} />
        <Suspense fallback={null}>
          <AnimatedGlb src={motion.glbUrl} />
        </Suspense>
        <OrbitControls target={[0, 1.1, 0]} />
      </Canvas>
    </div>
  );
}
