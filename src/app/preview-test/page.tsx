/*
Copyright (c) 2026 Yuancheng Li
SPDX-License-Identifier: Apache-2.0
*/

import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { MotionPreviewGrid, type MotionPreview } from "./motion-preview-grid";

type MotionIndexEntry = {
  source_id: string;
  subject_id: number;
  trial_id: number;
  filename: string;
  subject_description: string;
  description: string;
};

const fixtureRoot = path.join(process.cwd(), "public", "fixtures");
const previewCount = 12;

function toSourceId(filename: string) {
  const motionId = filename
    .replace(/\.glb$/, "")
    .replace(/^cmu_/, "")
    .replace(/_in_place$/, "");
  const [subjectId, trialId] = motionId.split("_");

  return `cmu:${subjectId}:${trialId}`;
}

async function getPreviews(): Promise<MotionPreview[]> {
  const [previewFiles, indexRaw] = await Promise.all([
    readdir(path.join(fixtureRoot, "previews")),
    readFile(path.join(fixtureRoot, "manifests", "motion_index.json"), "utf8"),
  ]);

  const motionIndex = JSON.parse(indexRaw) as MotionIndexEntry[];
  const metadataBySourceId = new Map(
    motionIndex.map((motion) => [motion.source_id, motion]),
  );

  return previewFiles
    .filter((filename) => filename.endsWith("_in_place.glb"))
    .sort((a, b) => a.localeCompare(b))
    .slice(0, previewCount)
    .map((filename) => {
      const sourceId = toSourceId(filename);
      const metadata = metadataBySourceId.get(sourceId);

      return {
        id: filename,
        title: sourceId,
        variant: "in place",
        description: metadata?.description ?? filename,
        subject: metadata?.subject_description ?? "Fixture preview",
        glbUrl: `/fixtures/previews/${filename}`,
      };
    });
}

export default async function PreviewTestPage() {
  const previews = await getPreviews();

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
