// compatible with Leaflet's LatLngLiteral
export interface LatLngLiteral {
  lat: number;
  lng: number;
}

export interface Waypoint {
  /** Time-offset in sec */
  t: number;
  p: LatLngLiteral;
}

export interface Route {
  videoUrl: string;
  waypoints: Waypoint[];
}
