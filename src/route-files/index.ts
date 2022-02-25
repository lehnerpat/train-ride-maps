import * as t from "io-ts";
import { isLeft } from "fp-ts/Either";
import { PathReporter } from "io-ts/PathReporter";

export function readFromJson(j: string): RouteFileModel {
  const data = JSON.parse(j);
  const decoded = RouteFileModel.decode(data);

  if (isLeft(decoded)) {
    throw new Error(PathReporter.report(decoded).join("\n"));
  }

  return decoded.right;
}

export function serializeToJson(route: RouteFileModel): string {
  return JSON.stringify(route);
}

const LatLngLiteralModel = t.readonly(
  t.strict({
    lat: t.number,
    lng: t.number,
  })
);
const WayPointModel = t.readonly(
  t.strict({
    t: t.number,
    p: LatLngLiteralModel,
  })
);

const RouteFileModel = t.readonly(
  t.strict({
    videoUrl: t.string,
    waypoints: t.array(WayPointModel),
  })
);

// eslint-disable-next-line @typescript-eslint/no-redeclare
export type RouteFileModel = t.TypeOf<typeof RouteFileModel>;
