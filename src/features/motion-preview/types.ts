/*
Copyright (c) 2026 Yuancheng Li
SPDX-License-Identifier: Apache-2.0
*/

export type PreviewBound = {
  center: [number, number, number];
  size: [number, number, number];
  radius: number;
  height: number;
};

export type MotionPreview = {
  id: string;
  title: string;
  variant: string;
  description: string;
  subject: string;
  glbUrl: string;
  previewBound?: PreviewBound;
};
