export function formatTimeSec(tSec: number): string {
  return tSec.toFixed(1) + "s";
}

export function formatVideoDuration(durationSec: number): string {
  const totalSeconds = Math.floor(durationSec);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export function formatDistanceMeters(dMM: number): string {
  return (dMM / 1000).toFixed(3) + "m";
}
