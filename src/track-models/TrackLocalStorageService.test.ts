import { beforeEach, describe, expect, it } from "vitest";
import { Tracks } from ".";
import { TrackLocalStorageService } from "./TrackLocalStorageService";

const makeTrack = () => {
  const t = Tracks.createEmpty("Title", "http://video");
  return Tracks.hydratePersistedTrack({
    ...t,
    path: [{ lat: 1, lng: 2 }],
    timingPoints: [{ t: 1, d: 2 }],
  });
};

describe("TrackLocalStorageService", () => {
  beforeEach(() => localStorage.clear());

  it("saves and loads a track", () => {
    const track = makeTrack();
    TrackLocalStorageService.save(track);
    const loaded = TrackLocalStorageService.load(track.uuid)!;
    expect(loaded.uuid).toBe(track.uuid);
    expect(loaded.title).toBe("Title");
    expect(loaded.path.map(({ lat, lng }) => ({ lat, lng }))).toEqual([{ lat: 1, lng: 2 }]);
    expect(loaded.timingPoints.map(({ t, d }) => ({ t, d }))).toEqual([{ t: 1, d: 2 }]);
  });

  it("returns null for a missing track", () => {
    expect(TrackLocalStorageService.load("nope")).toBeNull();
  });

  it("lists only prefixed keys", () => {
    const track = makeTrack();
    TrackLocalStorageService.save(track);
    localStorage.setItem("other", "not json");
    expect(TrackLocalStorageService.getList().map((t) => t.uuid)).toEqual([track.uuid]);
  });

  it("deletes a track", () => {
    const track = makeTrack();
    TrackLocalStorageService.save(track);
    TrackLocalStorageService.delete(track.uuid);
    expect(TrackLocalStorageService.load(track.uuid)).toBeNull();
  });
});
