/*
Copyright (c) 2026 Yuancheng Li
SPDX-License-Identifier: Apache-2.0
*/

export type PreviewFrame = {
  floorY: number;
  ceilingY: number;
};

export type PreviewFrameTarget = {
  x: number;
  z: number;
};

export type MotionPreview = {
  id: string;
  title: string;
  variant: string;
  description: string;
  subject: string;
  glbUrl: string;
  previewFrame?: PreviewFrame;
};

export type MotionPreviewPage = {
  items: MotionPreview[];
  nextOffset: number | null;
  totalCount: number;
};
