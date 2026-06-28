/*
Copyright (c) 2026 Yuancheng Li
SPDX-License-Identifier: Apache-2.0
*/

import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import type { MotionPreview, PreviewBound } from "../types/motion-preview";

type MotionIndexEntry = {
  source_id: string;
  subject_id: number;
  trial_id: number;
  filename: string;
  subject_description: string;
  description: string;
};

type PreviewMetadata = {
  variants?: {
    in_place?: {
      preview_bound?: PreviewBound;
    };
  };
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

function isNumberTuple3(value: unknown): value is [number, number, number] {
  return (
    Array.isArray(value) &&
    value.length === 3 &&
    value.every((entry) => typeof entry === "number")
  );
}

function isPreviewBound(value: unknown): value is PreviewBound {
  if (!value || typeof value !== "object") {
    return false;
  }

  const bound = value as PreviewBound;

  return (
    isNumberTuple3(bound?.center) &&
    isNumberTuple3(bound?.size) &&
    typeof bound.radius === "number" &&
    typeof bound.height === "number"
  );
}

async function readPreviewBound(filename: string) {
  const metadataFilename = filename.replace(/_in_place\.glb$/, ".json");
  const metadataRaw = await readFile(
    path.join(fixtureRoot, "previews", metadataFilename),
    "utf8",
  );
  const metadata = JSON.parse(metadataRaw) as PreviewMetadata;
  const previewBound = metadata.variants?.in_place?.preview_bound;

  if (isPreviewBound(previewBound)) {
    return previewBound;
  }
}

export async function getFixturePreviews(): Promise<MotionPreview[]> {
  const [previewFiles, indexRaw] = await Promise.all([
    readdir(path.join(fixtureRoot, "previews")),
    readFile(path.join(fixtureRoot, "manifests", "motion_index.json"), "utf8"),
  ]);

  const motionIndex = JSON.parse(indexRaw) as MotionIndexEntry[];
  const metadataBySourceId = new Map(
    motionIndex.map((motion) => [motion.source_id, motion]),
  );

  const inPlacePreviewFiles = previewFiles
    .filter((filename) => filename.endsWith("_in_place.glb"))
    .sort((a, b) => a.localeCompare(b))
    .slice(0, previewCount);

  return Promise.all(
    inPlacePreviewFiles.map(async (filename) => {
      const sourceId = toSourceId(filename);
      const metadata = metadataBySourceId.get(sourceId);
      const previewBound = await readPreviewBound(filename);

      return {
        id: filename,
        title: sourceId,
        variant: "in place",
        description: metadata?.description ?? filename,
        subject: metadata?.subject_description ?? "Fixture preview",
        glbUrl: `/fixtures/previews/${filename}`,
        previewBound,
      };
    }),
  );
}
