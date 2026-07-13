/*
Copyright (c) 2026 Yuancheng Li
SPDX-License-Identifier: Apache-2.0
*/

import { readFile } from "node:fs/promises";
import path from "node:path";
import type { MotionViewerMotion } from "../types/motion-viewer";

type MotionIndexEntry = {
  source_id: string;
  filename: string;
  subject_description: string;
  description: string;
};

type MotionMetadata = {
  export_duration_seconds: number;
  variants?: {
    normal?: {
      glb_relative_path?: string;
    };
  };
};

const fixtureRoot = path.join(process.cwd(), "public", "fixtures");
const motionIdPattern = /^cmu_\d+_\d+$/;

export async function getFixtureMotion(
  motionId: string,
): Promise<MotionViewerMotion | null> {
  if (!motionIdPattern.test(motionId)) {
    return null;
  }

  const metadataFilename = `${motionId}.json`;
  const [indexRaw, metadataRaw] = await Promise.all([
    readFile(path.join(fixtureRoot, "manifests", "motion_index.json"), "utf8"),
    readFile(path.join(fixtureRoot, "previews", metadataFilename), "utf8").catch(
      (error: unknown) => {
        if ((error as NodeJS.ErrnoException).code === "ENOENT") {
          return null;
        }

        throw error;
      },
    ),
  ]);

  if (!metadataRaw) {
    return null;
  }

  const metadata = JSON.parse(metadataRaw) as MotionMetadata;
  const normalGlbPath = metadata.variants?.normal?.glb_relative_path;

  if (!normalGlbPath) {
    throw new Error(`Normal GLB metadata is missing for ${motionId}`);
  }

  const sourceId = motionId.replace(/^cmu_(\d+)_(\d+)$/, "cmu:$1:$2");
  const motionIndex = JSON.parse(indexRaw) as MotionIndexEntry[];
  const indexEntry = motionIndex.find((motion) => motion.source_id === sourceId);

  if (!indexEntry) {
    throw new Error(`Motion index entry is missing for ${sourceId}`);
  }

  return {
    id: motionId,
    title: sourceId,
    description: indexEntry.description,
    subject: indexEntry.subject_description,
    glbUrl: `/fixtures/previews/${path.basename(normalGlbPath)}`,
    durationSeconds: metadata.export_duration_seconds,
  };
}
