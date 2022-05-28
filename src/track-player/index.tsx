import { FC, memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { LatLngLiteral } from "leaflet";
import { TimingPoint, Track, Tracks } from "../track-models";
import styled from "@emotion/styled";
import { css } from "@emotion/react";
import { VideoPlayer } from "./VideoPlayer";
import { LiveMap } from "./LiveMap";
import { DefaultViewOptions, ViewOptions, ViewOptionsDialog } from "./ViewOptions";
import { StraightRailsOverlay as StraightRailsOverlayOriginal } from "./straight-rails-overlay";
import { useMemoState, usePickedState, UseState, SetState } from "../common/utils/state-utils";
import { TrackLocalStorageService } from "../track-models/TrackLocalStorageService";
import { useFileUpload } from "../common/hooks/useFileUpload";
import { parseOsmXml } from "../osm-input/parse-osm-xml";
import { distanceInMM } from "../geo/distance";
import { isFunction, isUndefined } from "../common/utils/type-helpers";
import {
  AppBar,
  Box,
  Button,
  Card,
  Dialog,
  Fab,
  IconButton,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Toolbar,
  Typography,
} from "@mui/material";
import {
  Add as AddIcon,
  Download as DownloadIcon,
  Edit as EditIcon,
  Fullscreen as FullscreenIcon,
  SmartDisplay as SmartDisplayIcon,
  Tune as TuneIcon,
} from "@mui/icons-material";
import { useFileDownload } from "../common/hooks/useFileDownload";
import { augmentUuid, HasUuid } from "../common/utils/uuid";
import { formatDistanceMeters, formatTimeSec } from "./track-info-formatting";
import { TimingPointsList } from "./TimingPointsList";

const Placeholder: FC<{ width?: number | string; height?: number | string; text?: string }> = ({
  width,
  height,
  text,
}) => (
  <Box bgcolor="rgba(255, 255, 255, 0.13)" width={width} height={height}>
    <Box
      width="100%"
      height="100%"
      border="1px solid gray"
      boxSizing="border-box"
      display="flex"
      alignItems="center"
      justifyContent="center"
    >
      {text}
    </Box>
  </Box>
);

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
  const [track] = trackState;
  const [playedSeconds, setPlayedSeconds] = useState(0);
  const [pathLengthMM, setPathLengthMM] = useMemoState(0);
  const [currentCenter, setCurrentCenter] = useState<LatLngLiteral>(initialCoord);
  const [projectedPointInfo, setProjectedPointInfo] = useState<{ p: LatLngLiteral; precedingPathIndex: number }>();
  const [currentDistanceMM, setCurrentDistanceMM] = useState<number>();
  const [precedingTrackPointIndex, setPrecedingTrackPointIndex] = useState(-1);
  const isEditingModeOnState = useState(false);
  const [isEditingModeOn, setEditingModeOn] = isEditingModeOnState;
  const viewOptionsState = useMemoState(DefaultViewOptions);
  const [distanceFromStartMap, setDistanceFromStartMap] = useState<DistanceWithCoord[]>([]);

  const videoPlayerAndMapRef = useRef<HTMLDivElement>(null);

  const [viewOptions] = viewOptionsState;
  const timingPoints = track.timingPoints;
  const [path, setPath] = usePickedState(trackState, "path");
  const [, setTimingPoints] = usePickedState(trackState, "timingPoints");

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

  const toggleEditingMode = useCallback(() => setEditingModeOn(!isEditingModeOn), [isEditingModeOn, setEditingModeOn]);
  const enterFullscreen = useCallback(
    () => _enterFullscreen(videoPlayerAndMapRef, isEditingModeOn),
    [videoPlayerAndMapRef, isEditingModeOn]
  );

  const keyHandler = useCallback(
    (ev: KeyboardEvent) => {
      if (ev.key === "f") {
        enterFullscreen();
      } else if (ev.key === "E") {
        toggleEditingMode();
      }
    },
    [toggleEditingMode, enterFullscreen]
  );
  useKeyPressHandler(keyHandler);

  const reversePath = useCallback(() => setPath((path) => [...path].reverse()), [setPath]);
  const downloadTrackAsFile = useFileDownload(`track_${track.uuid}.json`, () => Tracks.serializeToJson(track));
  const addTimingPoint = useCallback(
    () => _addTimingPoint(playedSeconds, currentDistanceMM, setTimingPoints),
    [playedSeconds, currentDistanceMM, setTimingPoints]
  );
  const deleteTimingPointById = useCallback(
    (id: string) => setTimingPoints((oldTimingPoints) => oldTimingPoints.filter((tp) => tp.uuid !== id)),
    [setTimingPoints]
  );

  const showMapAsOverlay = !isEditingModeOn;

  const straightRailOptionsState = usePickedState(viewOptionsState, "straightRailsOverlay");
  // TODO: show total path length & video duration in editing mode
  // TODO: allow editing of title editing mode
  // TODO: show track UUID & video URL in editing mode

  return (
    <div>
      <MenuBar
        isEditingState={isEditingModeOnState}
        viewOptionsState={viewOptionsState}
        trackTitle={track.title}
        onDownloadFileClicked={downloadTrackAsFile}
        onEnterFullscreenClicked={enterFullscreen}
      />

      <VideoAndMapContainer showMapAsOverlay={showMapAsOverlay} ref={videoPlayerAndMapRef}>
        <VideoContainer showMapAsOverlay={showMapAsOverlay}>
          <>
            <VideoPlayer
              videoUrl={track.videoUrl}
              onProgress={(ev) => {
                setPlayedSeconds(ev.playedSeconds);
              }}
            />
            {/* <Placeholder width="100%" height="100%" text="Video player" /> */}
          </>
          <StraightRailsOverlay optionsState={straightRailOptionsState} />
          {showMapAsOverlay && (
            <ViewingMapContainer>
              <>
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
                {/* <Placeholder width="100%" height="100%" text="Map" /> */}
              </>
            </ViewingMapContainer>
          )}
        </VideoContainer>
        {isEditingModeOn && (
          <EditingMapContainer>
            <>
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
              {/* <Placeholder width="100%" height="100%" text="Map" /> */}
            </>

            <AddTimingPointWidget
              playedSeconds={playedSeconds}
              currentDistanceMM={currentDistanceMM}
              onAddButtonClicked={addTimingPoint}
            />
          </EditingMapContainer>
        )}
      </VideoAndMapContainer>

      {isEditingModeOn && (
        <Stack direction="row" mt={2} spacing={2} width="90%" mx="auto">
          <Box sx={{ flexGrow: 1, height: "200px" }}>
            <VideoInfoArea
              trackTitle={track.title}
              videoUrl={track.videoUrl}
              pathLengthMM={pathLengthMM}
              onPathUploaded={setPath}
              onReversePathClicked={reversePath}
            />
          </Box>
          <Box width={300}>
            <>
              <TimingPointsListMemo timingPoints={timingPoints} onDeleteTimingPoint={deleteTimingPointById} />
              {/* <Placeholder width={300} height={350} text="TP List" /> */}
            </>
          </Box>
        </Stack>
      )}
    </div>
  );
};

interface VideoInfoAreaProps {
  trackTitle: string;
  videoUrl: string;
  pathLengthMM: number;
  onPathUploaded: (path: ReadonlyArray<LatLngLiteral & HasUuid>) => void;
  onReversePathClicked: () => void;
}
const VideoInfoArea: FC<VideoInfoAreaProps> = ({
  trackTitle,
  videoUrl,
  pathLengthMM,
  onPathUploaded,
  onReversePathClicked,
}) => (
  <Card raised sx={{ p: 2 }}>
    <Stack direction="row" spacing={1}>
      <Box flexGrow={1}>
        <Stack spacing={1}>
          <Box>
            <Typography variant="h6">Video Info:</Typography>
          </Box>
          <Box>
            <Typography variant="body1">Title: {trackTitle}</Typography>
          </Box>
          <Box>
            <Typography variant="body1">Video: {videoUrl}</Typography>
          </Box>
          <Stack direction="row" spacing={2}>
            <Typography variant="body1">Duration: --</Typography>
            <Typography variant="body1">Total path length: {formatDistanceMeters(pathLengthMM)}</Typography>
          </Stack>
        </Stack>
      </Box>
      <Stack spacing={1} width={170}>
        <ImportOsmXmlButton onPathUploaded={onPathUploaded} />
        <Button variant="outlined" color="inherit" size="small" onClick={onReversePathClicked}>
          Reverse Path
        </Button>
      </Stack>
    </Stack>
  </Card>
);

interface WithShowAsMapOverlay {
  showMapAsOverlay: boolean;
}
const VideoAndMapContainer = styled(Box)<WithShowAsMapOverlay>(
  ({ showMapAsOverlay }) =>
    css`
      position: relative;
      margin: 0 auto;
      display: flex;
      align-items: center;
      ${showMapAsOverlay
        ? css`
            max-height: calc(100vh - 64px - 32px);
            aspect-ratio: 16/9;
          `
        : css`
            width: calc(90%);
            aspect-ratio: 25/9;
          `}
    `
);
const VideoContainer = styled(Box)<WithShowAsMapOverlay>(
  ({ showMapAsOverlay }) =>
    css`
      position: absolute;
      aspect-ratio: 16/9;
      ${showMapAsOverlay
        ? css`
            width: 100%;
          `
        : css`
            /* width: calc(64% - 8px); */
            height: 100%;
          `}
    `
);
const EditingMapContainer = styled(Box)`
  /* width: calc(36% - 8px); */
  height: 100%;
  position: absolute;
  right: 0;
  aspect-ratio: 1/1;
`;
const ViewingMapContainer = styled(Box)`
  position: absolute;
  top: 0;
  right: 0;
  width: 30%;
  height: 30%;
`;

const TimingPointsListMemo = memo(TimingPointsList);

const ImportOsmXmlButton: FC<{ onPathUploaded: (path: ReadonlyArray<LatLngLiteral & HasUuid>) => void }> = ({
  onPathUploaded,
}) => {
  const onOsmFileUploaded = async (file: File) => {
    const osmXml = await file.text();
    // TODO error handling
    const nodes = parseOsmXml(osmXml);
    console.log("parsed ", nodes.length, "nodes");
    const path = nodes.map((n) => n.coord);
    onPathUploaded(path.map(augmentUuid));
  };
  const { HiddenFileInput, showUploadDialog } = useFileUpload("osm-import", onOsmFileUploaded);

  return (
    <>
      <Button variant="outlined" color="inherit" size="small" onClick={showUploadDialog}>
        Import OSM XML
      </Button>
      <HiddenFileInput />
    </>
  );
};

function useKeyPressHandler(keyHandler: (ev: KeyboardEvent) => void) {
  useEffect(() => {
    document.body.addEventListener("keypress", keyHandler);

    return () => {
      document.body.removeEventListener("keypress", keyHandler);
    };
  });
}

const MenuBar: FC<{
  trackTitle: string;
  isEditingState: UseState<boolean>;
  viewOptionsState: UseState<ViewOptions>;
  onDownloadFileClicked: () => void;
  onEnterFullscreenClicked: () => void;
}> = ({
  trackTitle,
  isEditingState: [isEditingModeOn, setIsEditingModeOn],
  viewOptionsState,
  onDownloadFileClicked,
  onEnterFullscreenClicked,
}) => (
  <AppBar position="static" sx={{ mb: 2 }}>
    <Toolbar>
      {/* TODO: make text wrap properly or cut off with ellipsis if too long */}
      <Typography variant="h6" component="div" flexGrow={1}>
        {trackTitle}
      </Typography>
      <ToggleButtonGroup
        value={isEditingModeOn ? "editing" : "viewing"}
        exclusive
        onChange={(_, newValue) => setIsEditingModeOn(newValue === "editing")}
        size="small"
        sx={{ mr: 3 }}
      >
        <ToggleButton value={"viewing"} sx={{ pl: { md: 2 }, pr: { md: 1.5 } }}>
          <Box mr={0.5} display={{ xs: "none", md: "initial" }}>
            Viewing
          </Box>
          <SmartDisplayIcon />
        </ToggleButton>
        <ToggleButton value={"editing"} sx={{ pl: { md: 2 }, pr: { md: 1.5 } }}>
          <Box mr={0.5} display={{ xs: "none", md: "initial" }}>
            Editing
          </Box>
          <EditIcon />
        </ToggleButton>
      </ToggleButtonGroup>
      <IconButton color="inherit" onClick={onDownloadFileClicked} title="Download track as file">
        <DownloadIcon />
      </IconButton>
      <IconButton
        color="inherit"
        title="Enter fullscreen"
        disabled={isEditingModeOn}
        onClick={onEnterFullscreenClicked}
      >
        <FullscreenIcon />
      </IconButton>
      <ViewOptionsButton viewOptionsState={viewOptionsState} />
    </Toolbar>
  </AppBar>
);

const ViewOptionsButton: FC<{
  viewOptionsState: UseState<ViewOptions>;
}> = ({ viewOptionsState }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <>
      <IconButton color="inherit" title="Show view options" onClick={() => setIsOpen(!isOpen)}>
        <TuneIcon />
      </IconButton>
      <Dialog open={isOpen} onClose={() => setIsOpen(false)}>
        <ViewOptionsDialog viewOptionsState={viewOptionsState} onCloseDialog={() => setIsOpen(false)} />
      </Dialog>
    </>
  );
};
const AddTimingPointWidget: FC<{
  playedSeconds: number;
  currentDistanceMM: number | undefined;
  onAddButtonClicked: () => void;
}> = ({ playedSeconds, currentDistanceMM, onAddButtonClicked }) => (
  <Box position="absolute" bottom={0} right={0} zIndex={5000} m={2}>
    <Card raised sx={{ pl: 2, pr: 1 }}>
      <Stack direction="row" alignItems="center" spacing={2}>
        <Box>
          <Typography fontFamily="monospace" my={1}>
            t = {formatTimeSec(playedSeconds)}
          </Typography>
          <Typography fontFamily="monospace" my={1}>
            d = {isUndefined(currentDistanceMM) ? "--" : formatDistanceMeters(currentDistanceMM)}
          </Typography>
        </Box>
        <Fab color="secondary" onClick={onAddButtonClicked}>
          <AddIcon />
        </Fab>
      </Stack>
    </Card>
  </Box>
);

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

function computePathLength(path: ReadonlyArray<LatLngLiteral>, lastPointIndex?: number): number {
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
function computeDistanceFromStartMap(path: ReadonlyArray<LatLngLiteral>): DistanceWithCoord[] {
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
  timingPoints: ReadonlyArray<TimingPoint>
): ReadonlyArray<LatLngLiteral> {
  let dfsIdx = 1,
    tpIdx = 0;
  const result: Array<LatLngLiteral> = [];
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

async function _enterFullscreen(videoPlayerAndMapRef: React.RefObject<HTMLDivElement>, isEditingModeOn: boolean) {
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

function _addTimingPoint(
  playedSeconds: number,
  currentDistanceMM: number | undefined,
  setTimingPoints: SetState<ReadonlyArray<TimingPoint & HasUuid>>
) {
  if (isUndefined(currentDistanceMM)) return;

  setTimingPoints((oldTimingPoints) => {
    const timingPoints = [...oldTimingPoints];
    const newTimingPoint = augmentUuid({ t: playedSeconds, d: currentDistanceMM });
    const newIdx = timingPoints.findIndex((wp) => wp.t > newTimingPoint.t);
    if (newIdx === -1) {
      timingPoints.push(newTimingPoint);
    } else {
      timingPoints.splice(newIdx, 0, newTimingPoint);
    }
    return timingPoints;
  });
}
