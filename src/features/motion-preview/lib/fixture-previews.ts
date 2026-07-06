/*
Copyright (c) 2026 Yuancheng Li
SPDX-License-Identifier: Apache-2.0
*/

import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import type {
  MotionPreview,
  MotionPreviewPage,
  PreviewFrame,
} from "../types/motion-preview";

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
      preview_frame?: PreviewFrameMetadata;
    };
  };
};

type PreviewFrameMetadata = {
  floor_y: number;
  ceiling_y: number;
};

const fixtureRoot = path.join(process.cwd(), "public", "fixtures");
export const fixturePreviewPageSize = 12;

function toSourceId(filename: string) {
  const motionId = filename
    .replace(/\.glb$/, "")
    .replace(/^cmu_/, "")
    .replace(/_in_place$/, "");
  const [subjectId, trialId] = motionId.split("_");

  return `cmu:${subjectId}:${trialId}`;
}

function isPreviewFrameMetadata(value: unknown): value is PreviewFrameMetadata {
  if (!value || typeof value !== "object") {
    return false;
  }

  const frame = value as PreviewFrameMetadata;

  return (
    typeof frame.floor_y === "number" &&
    typeof frame.ceiling_y === "number"
  );
}

function toPreviewFrame(frame: PreviewFrameMetadata): PreviewFrame {
  return {
    floorY: frame.floor_y,
    ceilingY: frame.ceiling_y,
  };
}

async function readPreviewMetadata(filename: string) {
  const metadataFilename = filename.replace(/_in_place\.glb$/, ".json");
  const metadataRaw = await readFile(
    path.join(fixtureRoot, "previews", metadataFilename),
    "utf8",
  );
  const metadata = JSON.parse(metadataRaw) as PreviewMetadata;
  const inPlaceVariant = metadata.variants?.in_place;
  const previewFrame = inPlaceVariant?.preview_frame;

  return {
    previewFrame: isPreviewFrameMetadata(previewFrame)
      ? toPreviewFrame(previewFrame)
      : undefined,
  };
}

export async function getFixturePreviewPage({
  offset = 0,
  limit = fixturePreviewPageSize,
}: {
  offset?: number;
  limit?: number;
} = {}): Promise<MotionPreviewPage> {
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
    .sort((a, b) => a.localeCompare(b));
  const pageFiles = inPlacePreviewFiles.slice(offset, offset + limit);

  const items = await Promise.all(
    pageFiles.map(async (filename) => {
      const sourceId = toSourceId(filename);
      const metadata = metadataBySourceId.get(sourceId);
      const { previewFrame } = await readPreviewMetadata(filename);

      return {
        id: filename,
        title: sourceId,
        variant: "in place",
        description: metadata?.description ?? filename,
        subject: metadata?.subject_description ?? "Fixture preview",
        glbUrl: `/fixtures/previews/${filename}`,
        previewFrame,
      };
    }),
  );

  const nextOffset = offset + items.length;

  return {
    items,
    nextOffset: nextOffset < inPlacePreviewFiles.length ? nextOffset : null,
    totalCount: inPlacePreviewFiles.length,
  };
}

export async function getFixturePreviews(): Promise<MotionPreview[]> {
  const page = await getFixturePreviewPage();

  return page.items;
}
