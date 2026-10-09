import { z } from "zod";
import { augmentUuid, HasUuid, newUuidv4 } from "../common/utils/uuid";

const PLatLngLiteral = z
  .object({
    lat: z.number(),
    lng: z.number(),
  })
  .readonly();
type PLatLngLiteral = z.infer<typeof PLatLngLiteral>;
export interface LatLngLiteral {
  readonly lat: number;
  readonly lng: number;
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const assert_LatLngLiteral: Equals<PLatLngLiteral, LatLngLiteral> = true;

const PTimingPoint = z
  .object({
    t: z.number(),
    d: z.number(),
  })
  .readonly();
export type PTimingPoint = z.infer<typeof PTimingPoint>;
export interface TimingPoint {
  readonly t: number;
  readonly d: number;
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const assert_TimingPoint: Equals<PTimingPoint, TimingPoint> = true;

const PTrack = z
  .object({
    uuid: z.string(),
    title: z.string(),
    videoUrl: z.string(),
    path: z.array(PLatLngLiteral).readonly(),
    timingPoints: z.array(PTimingPoint).readonly(),
  })
  .readonly();
export type PTrack = z.infer<typeof PTrack>;
export interface Track {
  readonly uuid: string;
  readonly title: string;
  readonly videoUrl: string;
  readonly path: ReadonlyArray<LatLngLiteral & HasUuid>;
  readonly timingPoints: ReadonlyArray<TimingPoint & HasUuid>;
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const assert_TrackEx: XExtendsY<Track, PTrack> = true;

export const Tracks = {
  createEmpty(title: string, videoUrl: string): Track {
    return {
      uuid: newUuidv4(),
      title,
      videoUrl,
      path: [],
      timingPoints: [],
    };
  },

  readFromJson(j: string): Track {
    const data = JSON.parse(j);
    const parsed = PTrack.safeParse(data);

    if (!parsed.success) {
      throw new Error(z.prettifyError(parsed.error));
    }

    return this.hydratePersistedTrack(parsed.data);
  },

  hydratePersistedTrack(track: PTrack): Track {
    return { ...track, path: track.path.map(augmentUuid), timingPoints: track.timingPoints.map(augmentUuid) };
  },

  serializeToJson(track: Track): string {
    // parse() strips all extraneous properties, e.g. UUIDs in path and timingpoints
    const outTrack = PTrack.parse(track);
    return JSON.stringify(outTrack);
  },
};

// from https://github.com/microsoft/TypeScript/issues/27024#issuecomment-421529650
type Equals<X, Y> = (<T>() => T extends X ? 1 : 2) extends <T>() => T extends Y ? 1 : 2 ? true : false;

type XExtendsY<X, Y> = X extends Y ? true : false;
