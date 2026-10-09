import { describe, expect, it } from "vitest";
import { Track, Tracks } from ".";
import { IncludedData } from "../included-data";

const validTrack = () => ({
  uuid: "track-1",
  title: "Test track",
  videoUrl: "https://example.com/v",
  path: [
    { lat: 1, lng: 2 },
    { lat: 3, lng: 4 },
  ],
  timingPoints: [
    { t: 0, d: 0 },
    { t: 10, d: 5.5 },
  ],
});

const stripUuids = (t: Track) => ({
  ...t,
  path: t.path.map(({ lat, lng }) => ({ lat, lng })),
  timingPoints: t.timingPoints.map(({ t, d }) => ({ t, d })),
});

describe("Tracks.readFromJson", () => {
  it("decodes a valid track and adds unique UUIDs to points", () => {
    const track = Tracks.readFromJson(JSON.stringify(validTrack()));
    expect(track.uuid).toBe("track-1");
    expect(track.title).toBe("Test track");
    expect(stripUuids(track)).toEqual(validTrack());
    const uuids = [...track.path, ...track.timingPoints].map((p) => p.uuid);
    expect(uuids.every((u) => typeof u === "string" && u.length > 0)).toBe(true);
    expect(new Set(uuids).size).toBe(uuids.length);
  });

  it("accepts empty arrays", () => {
    const track = Tracks.readFromJson(JSON.stringify({ ...validTrack(), path: [], timingPoints: [] }));
    expect(track.path).toEqual([]);
    expect(track.timingPoints).toEqual([]);
  });

  it("drops extra properties at all levels", () => {
    const input = {
      ...validTrack(),
      extra: 1,
      path: [{ lat: 1, lng: 2, foo: "x" }],
      timingPoints: [{ t: 1, d: 2, bar: "y" }],
    };
    const track = Tracks.readFromJson(JSON.stringify(input));
    expect(track).not.toHaveProperty("extra");
    expect(Object.keys(track.path[0]).sort()).toEqual(["lat", "lng", "uuid"]);
    expect(Object.keys(track.timingPoints[0]).sort()).toEqual(["d", "t", "uuid"]);
  });

  it.each([
    ["missing title", { ...validTrack(), title: undefined }, "title"],
    ["string lat", { ...validTrack(), path: [{ lat: "1", lng: 2 }] }, "lat"],
    ["non-array path", { ...validTrack(), path: {} }, "path"],
    ["timing point missing d", { ...validTrack(), timingPoints: [{ t: 1 }] }, "d"],
  ])("throws with a descriptive message: %s", (_name, input, field) => {
    expect(() => Tracks.readFromJson(JSON.stringify(input))).toThrow(Error);
    try {
      Tracks.readFromJson(JSON.stringify(input));
    } catch (e) {
      expect((e as Error).message).toContain(field);
    }
  });

  it.each([["null"], ["[]"], ["42"], ['"str"']])("throws for non-object JSON %s", (json) => {
    expect(() => Tracks.readFromJson(json)).toThrow();
  });

  it("throws for malformed JSON", () => {
    expect(() => Tracks.readFromJson("{not json")).toThrow();
  });
});

describe("Tracks.serializeToJson", () => {
  it("omits point UUIDs and round-trips", () => {
    const track = Tracks.readFromJson(JSON.stringify(validTrack()));
    const json = Tracks.serializeToJson(track);
    expect(JSON.parse(json)).toEqual(validTrack());
    expect(stripUuids(Tracks.readFromJson(json))).toEqual(stripUuids(track));
  });
});

describe("Tracks.createEmpty", () => {
  it("creates an empty track", () => {
    const t = Tracks.createEmpty("T", "http://v");
    expect(t.uuid).toBeTruthy();
    expect(t).toMatchObject({ title: "T", videoUrl: "http://v", path: [], timingPoints: [] });
  });
});

describe("Tracks.hydratePersistedTrack", () => {
  it("adds UUIDs to points", () => {
    const t = Tracks.hydratePersistedTrack(validTrack());
    expect(t.path.every((p) => p.uuid)).toBe(true);
    expect(t.timingPoints.every((p) => p.uuid)).toBe(true);
  });
});

describe("bundled data", () => {
  it("has tracks that survive a serialize/read round trip", () => {
    expect(IncludedData.length).toBe(4);
    for (const track of IncludedData) {
      expect(track.path.length).toBeGreaterThan(0);
      const back = Tracks.readFromJson(Tracks.serializeToJson(track));
      expect(stripUuids(back)).toEqual(stripUuids(track));
    }
  });
});
