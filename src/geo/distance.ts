import { LatLngLiteral, CRS } from "leaflet";
// import LatLonEllipsoidal_Vincenty from "geodesy/latlon-ellipsoidal-vincenty";
// import LatLonSpherical from "geodesy/latlon-spherical";

type DistanceFunction = (p1: LatLngLiteral, p2: LatLngLiteral) => number;

const radPerDeg = Math.PI / 180;
const earthMeanRadiusInM = 6371000;
const earthMeanRadiusInMM = 6371000000;

// function geodesySpherical(p1: LatLngLiteral, p2: LatLngLiteral): number {
//   return new LatLonSpherical(p1.lat, p1.lng).distanceTo(new LatLonSpherical(p2.lat, p2.lng));
// }

// function geodesyEllipsoidalVincenty(p1: LatLngLiteral, p2: LatLngLiteral): number {
//   return new LatLonEllipsoidal_Vincenty(p1.lat, p1.lng).distanceTo(new LatLonEllipsoidal_Vincenty(p2.lat, p2.lng));
// }

function makeGeodesySphericalDirect(sphereRadius: number): DistanceFunction {
  // based on https://www.movable-type.co.uk/scripts/latlong.html
  return function geodesySphericalDirect(p1: LatLngLiteral, p2: LatLngLiteral): number {
    // φ, λ in radians
    const φ1 = p1.lat * radPerDeg;
    const φ2 = p2.lat * radPerDeg;
    const Δφ = (p2.lat - p1.lat) * radPerDeg;
    const Δλ = (p2.lng - p1.lng) * radPerDeg;

    return distanceBetweenPolarCoordinates(φ1, φ2, Δφ, Δλ, sphereRadius);
  };
}
const geodesySphericalDirectMeters = makeGeodesySphericalDirect(earthMeanRadiusInM);
const geodesySphericalDirectMilliMeters = makeGeodesySphericalDirect(earthMeanRadiusInMM);

function distanceBetweenPolarCoordinates(φ1: number, φ2: number, Δφ: number, Δλ: number, sphereRadius: number): number {
  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  const d = sphereRadius * c;
  return d;
}

// result in meters
function distanceLeafletEarthCrs(p1: LatLngLiteral, p2: LatLngLiteral): number {
  return CRS.Earth.distance(p1, p2);
}

// based on https://www.movable-type.co.uk/scripts/latlong.html
// result in meters
function equirectangularApproximation(p1: LatLngLiteral, p2: LatLngLiteral): number {
  // φ, λ in radians
  const φ1 = p1.lat * radPerDeg;
  const φ2 = p2.lat * radPerDeg;
  const λ1 = p1.lng * radPerDeg;
  const λ2 = p2.lng * radPerDeg;
  const x = (λ2 - λ1) * Math.cos((φ1 + φ2) / 2);
  const y = φ2 - φ1;
  const d = Math.sqrt(x * x + y * y) * earthMeanRadiusInM;
  return d;
}

// result in meters
function naiveEuclidean(p1: LatLngLiteral, p2: LatLngLiteral): number {
  const dx = (p2.lng - p1.lng) * radPerDeg;
  const dy = (p2.lat - p1.lat) * radPerDeg;

  return Math.sqrt(dx * dx + dy * dy) * earthMeanRadiusInM;
}

export const distanceInMFunctions: readonly DistanceFunction[] = Object.freeze([
  distanceLeafletEarthCrs,
  naiveEuclidean,
  equirectangularApproximation,
  geodesySphericalDirectMeters,
  // geodesySpherical,
  // geodesyEllipsoidalVincenty,
]);

// I tested out the performance of the implementations shown here using the ".test.ts" file in this dir,
// and for a test coordinate in Hyougo prefecture, Japan, geodesySphericalDirect was the fastest while
// agreeing closely with the usual spherical implementation (e.g. leaflet's implementation).
// To test the accuracy of the distance on a long path of small steps, I computed up the length of the
// miyamai + miyafuku train lines in Hyougo prefecture, Japan, according to the OSM data (see the
// evaluation in parse-osm-xml.test.ts), yielding a difference of about 1% from the distance computed
// via Overpass Turbo using the following query:
// ```
//   (rel(12030449);rel(12023936););
//   >;
//   make stat total_length=sum(length());
//   out;
// ```
// Overpass Turbo computed a total length of 55280.4 (meters), while our own sum using geodesySphericalDirect
// came out to 55340.508692071424 meters or with (individual) mm-rounding 55340491 mm.
export function distanceInMM(p1: LatLngLiteral, p2: LatLngLiteral): number {
  // decided to go with integer millimeters so the distances can be used for reliable computation and indexing;
  // compare https://www.avioconsulting.com/blog/overcoming-javascript-numeric-precision-issues
  return Math.round(geodesySphericalDirectMilliMeters(p1, p2));
}

// based on Leaflet's LineUtil._sqClosestPointOnSegment
export function closestPointOnSegment(
  p: LatLngLiteral,
  p1: LatLngLiteral,
  p2: LatLngLiteral
): { closestOnSegment: LatLngLiteral; distanceFromPMM: number } {
  const φ = p.lat * radPerDeg;
  const λ = p.lng * radPerDeg;
  const φ1 = p1.lat * radPerDeg;
  const λ1 = p1.lng * radPerDeg;
  const Δφ = (p2.lat - p1.lat) * radPerDeg;
  const Δλ = (p2.lng - p1.lng) * radPerDeg;
  const dot = Δφ * Δφ + Δλ * Δλ;

  let φr = φ1;
  let λr = λ1;

  if (dot > 0) {
    const t = ((φ - φ1) * Δφ + (λ - λ1) * Δλ) / dot;
    if (t > 1) {
      φr += Δφ;
      λr += Δλ;
    } else if (t > 0) {
      φr += Δφ * t;
      λr += Δλ * t;
    }
  }

  const distanceFromPMM = distanceBetweenPolarCoordinates(φ, φr, φr - φ, λr - λ, earthMeanRadiusInMM);

  return { distanceFromPMM, closestOnSegment: { lat: φr / radPerDeg, lng: λr / radPerDeg } };
}

let profileCounter = 0;
export function closestPointOnPath(p: LatLngLiteral, path: LatLngLiteral[]) {
  const profileId = `closestPointOnPath${profileCounter++}`;
  console.time(profileId);
  let closestDistance = Infinity;
  let closestInfo;
  for (let i = 0; i < path.length - 1; i++) {
    const p1 = path[i],
      p2 = path[i + 1];
    const r = closestPointOnSegment(p, p1, p2);
    if (r.distanceFromPMM < closestDistance) {
      closestDistance = r.distanceFromPMM;
      closestInfo = { distanceFromPMM: r.distanceFromPMM, closestOnPath: r.closestOnSegment, p1, p2, index1: i };
    }
  }
  console.timeEnd(profileId);
  if (!closestInfo) throw new Error(`Couldn't find closes point -- path has ${path.length} nodes`);
  return closestInfo;
}
