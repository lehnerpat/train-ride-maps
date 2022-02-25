import * as t from "io-ts";
import { isLeft } from "fp-ts/Either";
import { PathReporter } from "io-ts/PathReporter";

export function readFromJson(j: string): Route {
  const data = JSON.parse(j);
  const decoded = Route.decode(data);

  if (isLeft(decoded)) {
    throw new Error(PathReporter.report(decoded).join("\n"));
  }

  return decoded.right;
}

export function serializeToJson(route: Route): string {
  return JSON.stringify(route);
}

const LatLngLiteral = t.readonly(
  t.strict({
    lat: t.number,
    lng: t.number,
  })
);

const Waypoint = t.readonly(
  t.strict({
    t: t.number,
    p: LatLngLiteral,
  })
);
// eslint-disable-next-line @typescript-eslint/no-redeclare
export type Waypoint = t.TypeOf<typeof Waypoint>;

const Route = t.readonly(
  t.strict({
    title: t.string,
    videoUrl: t.string,
    waypoints: t.array(Waypoint),
  })
);

// eslint-disable-next-line @typescript-eslint/no-redeclare
export type Route = t.TypeOf<typeof Route>;
