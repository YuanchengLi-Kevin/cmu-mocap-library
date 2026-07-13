/*
Copyright (c) 2026 Yuancheng Li
SPDX-License-Identifier: Apache-2.0
*/

import Link from "next/link";
import { notFound } from "next/navigation";
import { getFixtureMotion, MotionViewer } from "../../../features/motion-viewer";

export default async function MotionPage({
  params,
}: {
  params: Promise<{ motionId: string }>;
}) {
  const { motionId } = await params;
  const motion = await getFixtureMotion(motionId);

  if (!motion) {
    notFound();
  }

  return (
    <main className="relative h-dvh overflow-hidden bg-zinc-100 text-zinc-950">
      <MotionViewer motion={motion} />

      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex items-start justify-between gap-4 p-4 sm:p-6">
        <Link
          className="pointer-events-auto rounded-full border border-white/70 bg-white/85 px-4 py-2 text-sm font-medium shadow-sm backdrop-blur-md transition-colors hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-950"
          href="/preview-test"
        >
          Back
        </Link>

        <div className="rounded-xl border border-white/70 bg-white/85 px-4 py-3 text-right shadow-sm backdrop-blur-md">
          <h1 className="text-base font-semibold">{motion.title}</h1>
          <p className="text-xs text-zinc-600">
            {motion.durationSeconds.toFixed(1)} seconds
          </p>
        </div>
      </div>

      <div className="pointer-events-none absolute inset-x-4 bottom-4 z-10 max-w-xl rounded-xl border border-white/70 bg-white/85 px-4 py-3 shadow-sm backdrop-blur-md sm:inset-x-auto sm:bottom-6 sm:left-6">
        <p className="text-sm font-medium text-zinc-900">
          {motion.description}
        </p>
        <p className="mt-1 text-xs text-zinc-600">{motion.subject}</p>
      </div>
    </main>
  );
}
