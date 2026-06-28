/*
Copyright (c) 2026 Yuancheng Li
SPDX-License-Identifier: Apache-2.0
*/

import {
  fixturePreviewPageSize,
  getFixturePreviewPage,
} from "../../../features/motion-preview/lib/fixture-previews";

function readPositiveInteger(value: string | null, fallback: number) {
  const parsedValue = Number(value);

  if (!Number.isInteger(parsedValue) || parsedValue < 0) {
    return fallback;
  }

  return parsedValue;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const offset = readPositiveInteger(searchParams.get("offset"), 0);
  const limit = readPositiveInteger(
    searchParams.get("limit"),
    fixturePreviewPageSize,
  );
  const page = await getFixturePreviewPage({ offset, limit });

  return Response.json(page);
}
