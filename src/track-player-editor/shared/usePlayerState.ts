import { LatLngLiteral } from "leaflet";
import { useState, useEffect, useCallback } from "react";
import { TimingPoint, Track } from "../../track-models";
import { distanceInMM } from "../../geo/distance";
import { useMemoState } from "../../common/utils/state-utils";

const EMPTY_PATH_COORDINATE: LatLngLiteral = { lat: 0, lng: 0 };

export const usePlayerState = (track: Track) => {
  const [playedSeconds, setPlayedSeconds] = useState(0);
  const timingPoints = track.timingPoints;
  const initialCoord = track.path[0] ?? EMPTY_PATH_COORDINATE;
  const [currentCenter, setCurrentCenter] = useState<LatLngLiteral>(initialCoord);
  const [distanceFromStartMap, setDistanceFromStartMap] = useState<DistanceWithCoord[]>([]);
  const [pathLengthMM, setPathLengthMM] = useMemoState(0);
  const [precedingTrackPointIndex, setPrecedingTrackPointIndex] = useState(-1);
  const [timingPointProgressState, setTimingPointProgressState] = useState<TimingPointProgressState>(
    TIMING_POINT_PROGRESS_STATE_NONE,
  );

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
      setTimingPointProgressState(TIMING_POINT_PROGRESS_STATE_NONE);
      return;
    }

    const precedingIndex = findPrecedingTimingPointIndex(playedSeconds, timingPoints);
    const timingPointProgress = findTimingPointProgressState(playedSeconds, timingPoints, 0.5);

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
    setTimingPointProgressState(timingPointProgress);
  }, [
    playedSeconds,
    timingPoints,
    initialCoord,
    distanceFromStartMap,
    setPrecedingTrackPointIndex,
    setCurrentCenter,
    setTimingPointProgressState,
  ]);

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
    timingPointProgressState,
  };
};

export type DistanceWithCoord = [number, LatLngLiteral];

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

export function findTimingPointProgressState(
  offsetSec: number,
  timingPoints: ReadonlyArray<TimingPoint>,
  exactlyOnToleranceSec: number = 0.5,
): TimingPointProgressState {
  const timingPointsCount = timingPoints.length;

  if (!timingPoints || !Array.isArray(timingPoints) || timingPointsCount === 0) return TIMING_POINT_PROGRESS_STATE_NONE;

  if (offsetSec < timingPoints[0].t) {
    if (timingPoints[0].t - offsetSec <= exactlyOnToleranceSec) {
      return {
        type: "exactly-on",
        previous: undefined,
        current: { ...timingPoints[0], index: 0 },
        next: timingPoints[1] ? { ...timingPoints[1], index: 1 } : undefined,
      };
    }
    return {
      type: "before-first",
      first: { ...timingPoints[0], index: 0 },
    };
  }

  if (offsetSec >= timingPoints[timingPointsCount - 1].t) {
    if (offsetSec - timingPoints[timingPointsCount - 1].t <= exactlyOnToleranceSec) {
      return {
        type: "exactly-on",
        previous: timingPoints[timingPointsCount - 2]
          ? { ...timingPoints[timingPointsCount - 2], index: timingPointsCount - 2 }
          : undefined,
        current: { ...timingPoints[timingPointsCount - 1], index: timingPointsCount - 1 },
        next: undefined,
      };
    }
    return {
      type: "after-last",
      last: { ...timingPoints[timingPointsCount - 1], index: timingPointsCount - 1 },
    };
  }

  const nextIndex = timingPoints.findIndex((tc) => tc.t > offsetSec);
  if (nextIndex === -1) throw new Error("nextIndex was -1 but should never be here");
  if (nextIndex === 0) throw new Error("nextIndex was 0 but should never be here");

  if (offsetSec - timingPoints[nextIndex - 1].t <= exactlyOnToleranceSec) {
    return {
      type: "exactly-on",
      previous: nextIndex - 2 >= 0 ? { ...timingPoints[nextIndex - 2], index: nextIndex - 2 } : undefined,
      current: { ...timingPoints[nextIndex - 1], index: nextIndex - 1 },
      next: { ...timingPoints[nextIndex], index: nextIndex },
    };
  }
  if (timingPoints[nextIndex].t - offsetSec <= exactlyOnToleranceSec) {
    return {
      type: "exactly-on",
      previous: { ...timingPoints[nextIndex - 1], index: nextIndex - 1 },
      current: { ...timingPoints[nextIndex], index: nextIndex },
      next: nextIndex + 1 < timingPointsCount ? { ...timingPoints[nextIndex + 1], index: nextIndex + 1 } : undefined,
    };
  }
  return {
    type: "between",
    preceding: { ...timingPoints[nextIndex - 1], index: nextIndex - 1 },
    succeeding: { ...timingPoints[nextIndex], index: nextIndex },
  };
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

export type TimingPointWithIndex = TimingPoint & { readonly index: number };

/** No progress state, e.g. when track has no timing points. */
export type TimingPointProgressStateNone = {
  readonly type: "none";
};

export const TIMING_POINT_PROGRESS_STATE_NONE: TimingPointProgressStateNone = {
  type: "none",
} as const;

export type TimingPointProgressStateBeforeFirst = {
  readonly type: "before-first";
  readonly first: TimingPointWithIndex;
};

export type TimingPointProgressStateExactlyOn = {
  readonly type: "exactly-on";
  readonly previous?: TimingPointWithIndex;
  readonly current: TimingPointWithIndex;
  readonly next?: TimingPointWithIndex;
};

export type TimingPointProgressStateBetween = {
  readonly type: "between";
  readonly preceding: TimingPointWithIndex;
  readonly succeeding: TimingPointWithIndex;
};

export type TimingPointProgressStateAfterLast = {
  readonly type: "after-last";
  readonly last: TimingPointWithIndex;
};

export type TimingPointProgressState =
  | TimingPointProgressStateNone
  | TimingPointProgressStateBeforeFirst
  | TimingPointProgressStateExactlyOn
  | TimingPointProgressStateBetween
  | TimingPointProgressStateAfterLast;
