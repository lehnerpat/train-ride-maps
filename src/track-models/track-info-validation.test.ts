import { describe, expect, test } from "vitest";
import { isTrackInfoValid, isTrackTitleValid, isVideoUrlValid } from "./track-info-validation";

describe("track info validation", () => {
  test.each([
    ["Title", true],
    ["", false],
    ["   ", false],
  ])("title %j -> %s", (title, expected) => {
    expect(isTrackTitleValid(title)).toBe(expected);
  });

  test.each([
    ["https://www.youtube.com/watch?v=x", true],
    ["http://www.youtube.com/watch?v=x", false],
    ["", false],
    ["youtube.com", false],
  ])("url %j -> %s", (url, expected) => {
    expect(isVideoUrlValid(url)).toBe(expected);
  });

  test("combined", () => {
    expect(isTrackInfoValid("T", "https://a")).toBe(true);
    expect(isTrackInfoValid("", "https://a")).toBe(false);
    expect(isTrackInfoValid("T", "")).toBe(false);
  });
});
