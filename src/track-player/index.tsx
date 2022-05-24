import { FC, memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { LatLngLiteral } from "leaflet";
import { TimingPoint, Track, Tracks } from "../track-models";
import styled, { css } from "styled-components";
import { EditingControlsArea } from "./EditingControlsArea";
import { VideoPlayer } from "./VideoPlayer";
import { LiveMap } from "./LiveMap";
import { LoadSaveFile } from "../common/components/LoadSaveFile";
import { DefaultViewOptions, ViewOptionsDialog } from "./ViewOptions";
import { StraightRailsOverlay as StraightRailsOverlayOriginal } from "./straight-rails-overlay";
import { useMemoState, usePickedState, UseState, SetState } from "../common/utils/state-utils";
import { TrackLocalStorageService } from "../track-models/TrackLocalStorageService";
import { useFileUpload } from "../common/hooks/useFileUpload";
import { parseOsmXml } from "../osm-input/parse-osm-xml";
import { distanceInMM } from "../geo/distance";
import { isFunction } from "../common/utils/type-helpers";
import { AppBar, Button, Dialog, IconButton, Stack, Toolbar, Typography } from "@mui/material";
import {
  Edit as EditIcon,
  Fullscreen as FullscreenIcon,
  SmartDisplay as SmartDisplayIcon,
  Tune as TuneIcon,
} from "@mui/icons-material";

const StraightRailsOverlay = memo(StraightRailsOverlayOriginal);

interface TrackPlayerProps {
  initialTrack: Track;
}
export const TrackPlayer: FC<TrackPlayerProps> = ({ initialTrack }) => {
  const initialCoord = useMemo(
    () => (initialTrack.path.length > 0 ? initialTrack.path[0] : { lat: 0, lng: 0 }),
    [initialTrack]
  );
  const trackState = useAutosavingTrackState(initialTrack);
  const [track, setTrack] = trackState;
  const [playedSeconds, setPlayedSeconds] = useState(0);
  const [pathLengthMM, setPathLengthMM] = useMemoState(0);
  const [currentCenter, setCurrentCenter] = useState<LatLngLiteral>(initialCoord);
  const [projectedPointInfo, setProjectedPointInfo] = useState<{ p: LatLngLiteral; precedingPathIndex: number }>();
  const [currentDistanceMM, setCurrentDistanceMM] = useState<number>();
  const [precedingTrackPointIndex, setPrecedingTrackPointIndex] = useState(-1);
  const [isEditingModeOn, setEditingModeOn] = useState(false);
  const viewOptionsState = useMemoState(DefaultViewOptions);
  const [isViewOptionsDialogOpen, setViewOptionsDialogOpen] = useState(false);
  const [distanceFromStartMap, setDistanceFromStartMap] = useState<DistanceWithCoord[]>([]);

  const videoPlayerAndMapRef = useRef<HTMLDivElement>(null);

  const [viewOptions] = viewOptionsState;
  const timingPoints = track.timingPoints;
  const path = track.path;

  const onOsmFileUploaded = async (file: File) => {
    const osmXml = await file.text();
    const nodes = parseOsmXml(osmXml);
    console.log("parsed ", nodes.length, "nodes");
    const path = nodes.map((n) => n.coord);
    setTrack((track) => ({ ...track, path: path }));
    setCurrentCenter(path[0]);
  };
  const { HiddenFileInput, showUploadDialog } = useFileUpload("osm-import", onOsmFileUploaded);

  useEffect(() => {
    const dfsMap = computeDistanceFromStartMap(path);
    const pathLength = dfsMap[dfsMap.length - 1][0];
    setPathLengthMM(pathLength);
    setDistanceFromStartMap(dfsMap);
  }, [path, setPathLengthMM]);

  useEffect(() => {
    if (!projectedPointInfo) {
      setCurrentDistanceMM(undefined);
    } else {
      const currentDistance =
        computePathLength(path, projectedPointInfo.precedingPathIndex) +
        distanceInMM(path[projectedPointInfo.precedingPathIndex], projectedPointInfo.p);
      setCurrentDistanceMM(currentDistance);
    }
  }, [projectedPointInfo, path]);

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
        playedSeconds
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

    setPrecedingTrackPointIndex(precedingIndex);
    setCurrentCenter(interpolatedCoord);
  }, [playedSeconds, timingPoints, initialCoord, distanceFromStartMap]);

  const showMapAsOverlay = !isEditingModeOn;

  const toggleEditingMode = useCallback(() => setEditingModeOn(!isEditingModeOn), [isEditingModeOn]);
  const keyHandler = useCallback(
    (ev: KeyboardEvent) => {
      if (ev.key === "f") {
        enterFullscreen(videoPlayerAndMapRef, isEditingModeOn);
      } else if (ev.key === "E") {
        toggleEditingMode();
      }
    },
    [isEditingModeOn, toggleEditingMode]
  );

  useEffect(() => {
    document.body.addEventListener("keypress", keyHandler);

    return () => {
      document.body.removeEventListener("keypress", keyHandler);
    };
  });

  return (
    <div>
      <AppBar position="static" sx={{ mb: 2 }}>
        <Toolbar>
          {/* TODO: make text wrap properly or cut off with ellipsis if too long */}
          <Typography variant="h6" component="div" flexGrow={1}>
            {track.title}
          </Typography>
          <IconButton
            color="inherit"
            onClick={toggleEditingMode}
            title={isEditingModeOn ? "Switch to viewing mode" : "Switch to editing mode"}
          >
            {isEditingModeOn ? <SmartDisplayIcon /> : <EditIcon />}
          </IconButton>
          <IconButton
            color="inherit"
            title="Enter fullscreen"
            disabled={isEditingModeOn}
            onClick={() => {
              enterFullscreen(videoPlayerAndMapRef, isEditingModeOn);
            }}
          >
            <FullscreenIcon />
          </IconButton>
          <IconButton
            color="inherit"
            title="Show view options"
            onClick={() => {
              setViewOptionsDialogOpen(!isViewOptionsDialogOpen);
            }}
          >
            <TuneIcon />
          </IconButton>
        </Toolbar>
      </AppBar>

      <Dialog open={isViewOptionsDialogOpen} onClose={() => setViewOptionsDialogOpen(false)}>
        <ViewOptionsDialog viewOptionsState={viewOptionsState} onCloseDialog={() => setViewOptionsDialogOpen(false)} />
      </Dialog>

      <TrackPlayerContainer isEditingModeOn={isEditingModeOn}>
        {isEditingModeOn && (
          <TrackPointsCol>
            <Stack spacing={1}>
              <Stack direction="row" spacing={1}>
                <Button variant="outlined" color="inherit" size="small" onClick={() => showUploadDialog()}>
                  Import OSM XML
                </Button>
                <Button
                  variant="outlined"
                  color="inherit"
                  size="small"
                  onClick={() => {
                    const path = [...track.path].reverse();
                    setTrack((track) => ({ ...track, path }));
                    setCurrentCenter(path[0]);
                  }}
                >
                  Reverse Path
                </Button>
              </Stack>
              <EditingControlsArea
                trackState={trackState}
                options={viewOptions.trackPointsEditorOptions}
                playedSeconds={playedSeconds}
                currentDistance={currentDistanceMM}
                precedingTimingPointIndex={precedingTrackPointIndex}
                pathLengthMM={pathLengthMM}
              />
            </Stack>
          </TrackPointsCol>
        )}
        <PlayerMapCol>
          <VideoAndMapContainer showMapAsOverlay={showMapAsOverlay} ref={videoPlayerAndMapRef}>
            <VideoPlayerContainer showMapAsOverlay={showMapAsOverlay}>
              <VideoPlayer
                videoUrl={track.videoUrl}
                onProgress={(ev) => {
                  setPlayedSeconds(ev.playedSeconds);
                }}
              />
            </VideoPlayerContainer>
            <LiveMapContainer showMapAsOverlay={showMapAsOverlay} mapOverlayPosition={viewOptions.mapOverlayPosition}>
              <LiveMap
                trackState={trackState}
                path={path}
                timingPointLocations={computeTimingPointLocations(distanceFromStartMap, timingPoints)}
                initialCenter={initialCoord}
                currentCenter={currentCenter}
                onMapMoved={(newCenter) => setProjectedPointInfo(newCenter)}
                playedSeconds={playedSeconds}
                isEditingModeOn={isEditingModeOn}
                viewOptions={viewOptions.mapViewOptions}
              />
            </LiveMapContainer>
            <StraightRailsOverlay optionsState={usePickedState(viewOptionsState, "straightRailsOverlay")} />
            <TrackTitle>{track.title}</TrackTitle>
          </VideoAndMapContainer>
        </PlayerMapCol>
      </TrackPlayerContainer>
      <LoadSaveFile onDownloadRequested={() => Tracks.serializeToJson(track)} />
      <HiddenFileInput />
    </div>
  );
};

const TrackTitle = styled.div`
  font-size: 120%;
  margin: 10px;
`;

const PlayerMapCol = styled.div`
  flex-grow: 1;
  max-width: 100%;
`;

interface VideoAndMapContainerProps {
  showMapAsOverlay: boolean;
}
const VideoAndMapContainer = styled.div<VideoAndMapContainerProps>`
  position: relative;
  ${(props) =>
    !!props.showMapAsOverlay &&
    css`
      aspect-ratio: 16/9;
      max-height: 90vh;
      margin: 0 auto;
    `}
`;

interface VideoPlayerContainerProps {
  showMapAsOverlay: boolean;
}
const VideoPlayerContainer = styled.div<VideoPlayerContainerProps>`
  width: 100%;
  aspect-ratio: 16/9;
  position: relative;
  ${(props) =>
    !!props.showMapAsOverlay
      ? css`
          height: 100%;
        `
      : css``}
`;

interface LiveMapContainerProps {
  showMapAsOverlay: boolean;
  mapOverlayPosition: "top-left" | "top-right";
}
const LiveMapContainer = styled.div<LiveMapContainerProps>`
  ${(props) =>
    !!props.showMapAsOverlay
      ? css`
          position: absolute;
          top: 0;
          width: 30%;
          height: 30%;
          ${props.mapOverlayPosition === "top-right"
            ? css`
                right: 0;
              `
            : css`
                left: 0;
              `}
        `
      : css`
          aspect-ratio: 16/9;
        `}
`;

function useAutosavingTrackState(initialTrack: Track): UseState<Track> {
  const [track, setTrack] = useState(initialTrack);
  const wrappedSetTrack: SetState<Track> = (newTrack) =>
    setTrack((prevTrack) => {
      const updatedTrack = typeof newTrack === "function" ? newTrack(prevTrack) : newTrack;
      TrackLocalStorageService.save(updatedTrack);
      return updatedTrack;
    });
  return [track, wrappedSetTrack];
}

function findPrecedingTimingPointIndex(offsetSec: number, timingPoints: TimingPoint[]): number {
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
  distance: number
): LatLngLiteral {
  if (distance < prevCoord[0] || distance > nextCoord[0])
    throw new Error(
      `Given distance ${distance} was outside of DistanceWithCoord range [${prevCoord[0]}, ${nextCoord[0]}]`
    );
  const p = (distance - prevCoord[0]) / (nextCoord[0] - prevCoord[0]);
  const lat = prevCoord[1].lat + p * (nextCoord[1].lat - prevCoord[1].lat);
  const lng = prevCoord[1].lng + p * (nextCoord[1].lng - prevCoord[1].lng);
  return { lat, lng };
}

interface TrackPlayerContainerProps {
  isEditingModeOn: boolean;
}
const TrackPlayerContainer = styled.div<TrackPlayerContainerProps>`
  display: flex;
  margin: 0 auto;
  justify-content: center;
  max-width: 100%;
  ${(props) =>
    !!props.isEditingModeOn &&
    css`
      width: 1400px;
    `}
`;

const TrackPointsCol = styled.div`
  width: 300px;
  margin-right: 10px;
`;

function computePathLength(path: readonly LatLngLiteral[], lastPointIndex?: number): number {
  if (!path || path.length < 2) {
    throw new Error(`Cannot compute length of path with less than 2 points, got ${path.length} nodes`);
  }
  const lpi = lastPointIndex ?? path.length - 1;
  let distance = 0;
  for (let i = 0; i < lpi; i++) {
    distance += distanceInMM(path[i], path[i + 1]);
  }
  return distance;
}

type DistanceWithCoord = [number, LatLngLiteral];
function computeDistanceFromStartMap(path: LatLngLiteral[]): DistanceWithCoord[] {
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

function computeTimingPointLocations(
  distanceFromStartMap: DistanceWithCoord[],
  timingPoints: TimingPoint[]
): LatLngLiteral[] {
  let dfsIdx = 1,
    tpIdx = 0;
  const result: LatLngLiteral[] = [];
  while (dfsIdx < distanceFromStartMap.length && tpIdx < timingPoints.length) {
    if (timingPoints[tpIdx].d < distanceFromStartMap[dfsIdx][0]) {
      const tpCoord = interpolateCoordinates(
        distanceFromStartMap[dfsIdx - 1],
        distanceFromStartMap[dfsIdx],
        timingPoints[tpIdx].d
      );
      result.push(tpCoord);
      tpIdx++;
    } else {
      dfsIdx++;
    }
  }
  return result;
}

async function enterFullscreen(videoPlayerAndMapRef: React.RefObject<HTMLDivElement>, isEditingModeOn: boolean) {
  const el = videoPlayerAndMapRef.current;
  if (!el || isEditingModeOn) return;
  if (!!document.fullscreenElement || !!(document as any).webkitFullscreenElement) {
    console.debug("already in fullscreen. doing nothing.");
    return;
  }
  try {
    if (el.requestFullscreen) {
      await el.requestFullscreen({ navigationUI: "hide" });
    } else if (isFunction((el as any).webkitRequestFullscreen)) {
      await (el as any).webkitRequestFullscreen();
    }
  } catch (e) {
    console.error("Could not enter fullscreen:", e);
  }
}
