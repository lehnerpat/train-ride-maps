import * as t from "io-ts";
import { isLeft } from "fp-ts/Either";
import { PathReporter } from "io-ts/PathReporter";
import { augmentUuid, HasUuid, newUuidv4 } from "../common/utils/uuid";

const PLatLngLiteral = t.readonly(
  t.strict({
    lat: t.number,
    lng: t.number,
  })
);
// eslint-disable-next-line @typescript-eslint/no-redeclare
type PLatLngLiteral = t.TypeOf<typeof PLatLngLiteral>;
export interface LatLngLiteral {
  readonly lat: number;
  readonly lng: number;
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const assert_LatLngLiteral: Equals<PLatLngLiteral, LatLngLiteral> = true;

const PTimingPoint = t.readonly(
  t.strict({
    t: t.number,
    d: t.number,
  })
);
// eslint-disable-next-line @typescript-eslint/no-redeclare
export type PTimingPoint = t.TypeOf<typeof PTimingPoint>;
export interface TimingPoint {
  readonly t: number;
  readonly d: number;
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const assert_TimingPoint: Equals<PTimingPoint, TimingPoint> = true;

const PTrack = t.readonly(
  t.strict({
    uuid: t.string,
    title: t.string,
    videoUrl: t.string,
    path: t.readonlyArray(PLatLngLiteral),
    timingPoints: t.readonlyArray(PTimingPoint),
  })
);
// eslint-disable-next-line @typescript-eslint/no-redeclare
export type PTrack = t.TypeOf<typeof PTrack>;
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
    const decoded = PTrack.decode(data);

    if (isLeft(decoded)) {
      throw new Error(PathReporter.report(decoded).join("\n"));
    }

    const pTrack = decoded.right;
    return this.hydratePersistedTrack(pTrack);
  },

  hydratePersistedTrack(track: PTrack): Track {
    return { ...track, path: track.path.map(augmentUuid), timingPoints: track.timingPoints.map(augmentUuid) };
  },

  serializeToJson(track: Track): string {
    // encode() strips all extraneous properties, e.g. UUIDs in path and timingpoints
    const outTrack = PTrack.encode(track);
    return JSON.stringify(outTrack);
  },
};

// from https://github.com/microsoft/TypeScript/issues/27024#issuecomment-421529650
type Equals<X, Y> = (<T>() => T extends X ? 1 : 2) extends <T>() => T extends Y ? 1 : 2 ? true : false;

type XExtendsY<X, Y> = X extends Y ? true : false;
