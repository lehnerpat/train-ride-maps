import { describe, expect, test } from "vitest";
import { formatVideoDuration } from "./track-info-formatting";

describe("formatVideoDuration", () => {
  test.each([
    [0, "0:00:00"],
    [83, "0:01:23"],
    [5025, "1:23:45"],
    [5025.9, "1:23:45"],
  ])("formats %s seconds as %s", (durationSec, expected) => {
    expect(formatVideoDuration(durationSec)).toBe(expected);
  });
});
