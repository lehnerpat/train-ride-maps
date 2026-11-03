import { LatLngLiteral } from "leaflet";
import { useState, useEffect, useCallback } from "react";
import { TimingPoint, Track } from "../track-models";
import { distanceInMM } from "../geo/distance";
import { useMemoState } from "../common/utils/state-utils";

const EMPTY_PATH_COORDINATE: LatLngLiteral = { lat: 0, lng: 0 };

export const usePlayerState = (track: Track) => {
  const [playedSeconds, setPlayedSeconds] = useState(0);
  const timingPoints = track.timingPoints;
  const initialCoord = track.path[0] ?? EMPTY_PATH_COORDINATE;
  const [currentCenter, setCurrentCenter] = useState<LatLngLiteral>(initialCoord);
  const [distanceFromStartMap, setDistanceFromStartMap] = useState<DistanceWithCoord[]>([]);
  const [pathLengthMM, setPathLengthMM] = useMemoState(0);
  const [precedingTrackPointIndex, setPrecedingTrackPointIndex] = useState(-1);

  useEffect(() => {
    const dfsMap = computeDistanceFromStartMap(track.path);
    const pathLength = dfsMap[dfsMap.length - 1]?.[0] ?? 0;
    setPathLengthMM(pathLength);
    setDistanceFromStartMap(dfsMap);
  }, [track.path, setPathLengthMM, setDistanceFromStartMap]);

  useEffect(() => {
    if (!timingPoints || timingPoints.length === 0 || distanceFromStartMap.length === 0) {
      setPrecedingTrackPointIndex(-1);
      setCurrentCenter(initialCoord);
      return;
    }

    const precedingIndex = findPrecedingTimingPointIndex(playedSeconds, timingPoints);

    let interpolatedDistance: number;
    if (precedingIndex === -1) {
      interpolatedDistance = timingPoints[0].d;
    } else if (precedingIndex === timingPoints.length - 1) {
      interpolatedDistance = timingPoints[timingPoints.length - 1].d;
    } else {
      interpolatedDistance = interpolateDistance(
        timingPoints[precedingIndex],
        timingPoints[precedingIndex + 1],
        playedSeconds,
      );
    }

    const nextIdx = distanceFromStartMap.findIndex((t) => t[0] > interpolatedDistance);
    let interpolatedCoord: LatLngLiteral;
    if (nextIdx === 0) {
      interpolatedCoord = distanceFromStartMap[0][1];
    } else if (nextIdx === -1) {
      interpolatedCoord = distanceFromStartMap[distanceFromStartMap.length - 1][1];
    } else {
      const next = distanceFromStartMap[nextIdx];
      const prev = distanceFromStartMap[nextIdx - 1];
      interpolatedCoord = interpolateCoordinates(prev, next, interpolatedDistance);
    }

    setCurrentCenter(interpolatedCoord);
    setPrecedingTrackPointIndex(precedingIndex);
  }, [playedSeconds, timingPoints, initialCoord, distanceFromStartMap, setPrecedingTrackPointIndex, setCurrentCenter]);

  const onPlayerProgress = useCallback(
    (ev: { playedSeconds: number }) => {
      setPlayedSeconds(ev.playedSeconds);
    },
    [setPlayedSeconds],
  );

  return {
    playedSeconds,
    distanceFromStartMap,
    onPlayerProgress,
    currentCenter,
    pathLengthMM,
    precedingTrackPointIndex,
  };
};

type DistanceWithCoord = [number, LatLngLiteral];
function computeDistanceFromStartMap(path: ReadonlyArray<LatLngLiteral>): DistanceWithCoord[] {
  if (path.length === 0) return [];
  let totalDistance = 0;
  let prevPoint = path[0];
  let distanceFromStartMap: DistanceWithCoord[] = [[0, prevPoint]];
  for (let i = 1; i < path.length; i++) {
    const point = path[i];
    totalDistance += distanceInMM(prevPoint, point);
    distanceFromStartMap.push([totalDistance, point]);
    prevPoint = point;
  }
  return distanceFromStartMap;
}

function findPrecedingTimingPointIndex(offsetSec: number, timingPoints: ReadonlyArray<TimingPoint>): number {
  const timingPointsCount = timingPoints.length;
  if (!timingPoints || !Array.isArray(timingPoints) || timingPointsCount === 0) return -1;
  if (offsetSec < timingPoints[0].t) return -1;
  if (offsetSec >= timingPoints[timingPointsCount - 1].t) return timingPointsCount - 1;
  const nextIndex = timingPoints.findIndex((tc) => tc.t > offsetSec);
  if (nextIndex === -1) throw new Error("nextIndex was -1 but should never be here");
  if (nextIndex === 0) throw new Error("nextIndex was 0 but should never be here");
  return nextIndex - 1;
}

function interpolateDistance(prevTP: TimingPoint, nextTP: TimingPoint, offsetSec: number): number {
  if (offsetSec < prevTP.t || offsetSec > nextTP.t)
    throw new Error(`Given offsetSec ${offsetSec} was outside of TimingPoint range [${prevTP.t}, ${nextTP.t}]`);
  const p = (offsetSec - prevTP.t) / (nextTP.t - prevTP.t);
  const d = prevTP.d + p * (nextTP.d - prevTP.d);
  return d;
}

function interpolateCoordinates(
  prevCoord: DistanceWithCoord,
  nextCoord: DistanceWithCoord,
  distance: number,
): LatLngLiteral {
  if (distance < prevCoord[0] || distance > nextCoord[0])
    throw new Error(
      `Given distance ${distance} was outside of DistanceWithCoord range [${prevCoord[0]}, ${nextCoord[0]}]`,
    );
  const p = (distance - prevCoord[0]) / (nextCoord[0] - prevCoord[0]);
  const lat = prevCoord[1].lat + p * (nextCoord[1].lat - prevCoord[1].lat);
  const lng = prevCoord[1].lng + p * (nextCoord[1].lng - prevCoord[1].lng);
  return { lat, lng };
}
