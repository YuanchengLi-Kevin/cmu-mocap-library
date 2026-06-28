/*
Copyright (c) 2026 Yuancheng Li
SPDX-License-Identifier: Apache-2.0
*/

import { getFixturePreviews } from "../../features/motion-preview/fixture-previews";
import { MotionPreviewGrid } from "../../features/motion-preview/motion-preview-grid";

export default async function PreviewTestPage() {
  const previews = await getFixturePreviews();

  return (
    <main className="min-h-screen bg-stone-50 px-6 py-6 text-zinc-950 sm:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-5">
        <header className="flex flex-col gap-2 border-b border-zinc-200 pb-4">
          <p className="text-sm font-medium uppercase tracking-wide text-zinc-500">
            Fixture stress test
          </p>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <h1 className="text-3xl font-semibold tracking-normal text-zinc-950">
              12 simultaneous GLB previews
            </h1>
            <p className="text-sm text-zinc-600">
              Loaded from <code>public/fixtures</code>
            </p>
          </div>
        </header>

        <MotionPreviewGrid previews={previews} />
      </div>
    </main>
  );
}
