import { LatLngLiteral, CRS } from "leaflet";
// import LatLonEllipsoidal_Vincenty from "geodesy/latlon-ellipsoidal-vincenty";
// import LatLonSpherical from "geodesy/latlon-spherical";

type DistanceInMFunction = (p1: LatLngLiteral, p2: LatLngLiteral) => number;

const radPerDeg = Math.PI / 180;
const earthMeanRadiusInM = 6371000;

// function geodesySpherical(p1: LatLngLiteral, p2: LatLngLiteral): number {
//   return new LatLonSpherical(p1.lat, p1.lng).distanceTo(new LatLonSpherical(p2.lat, p2.lng));
// }

// function geodesyEllipsoidalVincenty(p1: LatLngLiteral, p2: LatLngLiteral): number {
//   return new LatLonEllipsoidal_Vincenty(p1.lat, p1.lng).distanceTo(new LatLonEllipsoidal_Vincenty(p2.lat, p2.lng));
// }

// based on https://www.movable-type.co.uk/scripts/latlong.html
function geodesySphericalDirect(p1: LatLngLiteral, p2: LatLngLiteral): number {
  // φ, λ in radians
  const φ1 = p1.lat * radPerDeg;
  const φ2 = p2.lat * radPerDeg;
  const Δφ = (p2.lat - p1.lat) * radPerDeg;
  const Δλ = (p2.lng - p1.lng) * radPerDeg;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  const d = earthMeanRadiusInM * c; // in metres
  return d;
}

function distanceLeafletEarthCrs(p1: LatLngLiteral, p2: LatLngLiteral): number {
  return CRS.Earth.distance(p1, p2);
}

// based on https://www.movable-type.co.uk/scripts/latlong.html
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

function naiveEuclidean(p1: LatLngLiteral, p2: LatLngLiteral): number {
  const dx = (p2.lng - p1.lng) * radPerDeg;
  const dy = (p2.lat - p1.lat) * radPerDeg;

  return Math.sqrt(dx * dx + dy * dy) * earthMeanRadiusInM;
}

export const distanceInMFunctions: readonly DistanceInMFunction[] = Object.freeze([
  distanceLeafletEarthCrs,
  naiveEuclidean,
  equirectangularApproximation,
  geodesySphericalDirect,
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
// came out to 55340.508692071424.
export const distanceInM = geodesySphericalDirect;
