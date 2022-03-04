import * as t from "io-ts";
import { isLeft } from "fp-ts/Either";
import { PathReporter } from "io-ts/PathReporter";
import { newUuidv4 } from "../common-components/uuid";

const LatLngLiteral = t.readonly(
  t.strict({
    lat: t.number,
    lng: t.number,
  })
);

const TrackPoint = t.readonly(
  t.strict({
    t: t.number,
    p: LatLngLiteral,
  })
);
// eslint-disable-next-line @typescript-eslint/no-redeclare
export type TrackPoint = t.TypeOf<typeof TrackPoint>;

const Track = t.readonly(
  t.strict({
    uuid: t.string,
    title: t.string,
    videoUrl: t.string,
    trackPoints: t.array(TrackPoint),
  })
);

// eslint-disable-next-line @typescript-eslint/no-redeclare
export type Track = t.TypeOf<typeof Track>;

export const Tracks = {
  create(title: string, videoUrl: string): Track {
    return {
      uuid: newUuidv4(),
      title,
      videoUrl,
      trackPoints: [],
    };
  },

  readFromJson(j: string): Track {
    const data = JSON.parse(j);
    const decoded = Track.decode(data);

    if (isLeft(decoded)) {
      throw new Error(PathReporter.report(decoded).join("\n"));
    }

    return decoded.right;
  },

  serializeToJson(track: Track): string {
    return JSON.stringify(track);
  },
};
