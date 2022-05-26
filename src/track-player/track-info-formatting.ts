export function formatTimeSec(tSec: number): string {
  return tSec.toFixed(1) + "s";
}

export function formatDistanceMeters(dMM: number): string {
  return (dMM / 1000).toFixed(3) + "m";
}
