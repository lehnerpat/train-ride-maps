import { FC, memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { LatLngLiteral } from "leaflet";
import { TimingPoint, Track, Tracks } from "../../track-models";
import styled from "@emotion/styled";
import { css } from "@emotion/react";
import { useVideoPlayer } from "./VideoPlayer";
import { EditingLiveMap, LiveMapHandle } from "../shared/live-map/LiveMap";
import { DefaultViewOptions, ViewOptions, ViewOptionsDialog } from "./ViewOptions";
import { StraightRailsOverlay as StraightRailsOverlayOriginal } from "./straight-rails-overlay";
import { useMemoState, usePickedState, UseState, SetState } from "../../common/utils/state-utils";
import { TrackLocalStorageService } from "../../track-models/TrackLocalStorageService";
import { distanceInMM } from "../../geo/distance";
import { isUndefined } from "../../common/utils/type-helpers";
import { AppBar, Box, Button, Card, Dialog, Fab, IconButton, Stack, Toolbar, Typography } from "@mui/material";
import {
  Add as AddIcon,
  ArrowBack as ArrowBackIcon,
  Download as DownloadIcon,
  Keyboard as KeyboardIcon,
  SmartDisplay as SmartDisplayIcon,
  Tune as TuneIcon,
} from "@mui/icons-material";
import { useFileDownload } from "../../common/hooks/useFileDownload";
import { augmentUuid, HasUuid } from "../../common/utils/uuid";
import { formatDistanceMeters, formatTimeSec } from "./track-info-formatting";
import { TimingPointsList } from "./TimingPointsList";
import { Link } from "wouter";
import { VideoInfoArea } from "./VideoInfoArea";
import { PageRouting } from "../../page-routing";
import { VideoOverrideButton } from "./VideoOverrideButton";
import { loadVideoUrlOverride, saveVideoUrlOverride } from "./video-url-override";
import { deepPurple } from "@mui/material/colors";
import { k, ksd } from "./keyboard-shortcut-utils";
import { DistanceWithCoord, usePlayerState } from "../usePlayerState";

const StraightRailsOverlay = memo(StraightRailsOverlayOriginal);

interface TrackEditorProps {
  initialTrack: Track;
}
export const TrackEditor: FC<TrackEditorProps> = ({ initialTrack }) => {
  const initialCoord = useMemo(
    () => (initialTrack.path.length > 0 ? initialTrack.path[0] : { lat: 0, lng: 0 }),
    [initialTrack],
  );
  const trackState = useAutosavingTrackState(initialTrack);
  const [track, setTrack] = trackState;
  const {
    playedSeconds,
    onPlayerProgress,
    distanceFromStartMap,
    pathLengthMM,
    currentCenter,
    precedingTrackPointIndex,
  } = usePlayerState(track);
  const [projectedPointInfo, setProjectedPointInfo] = useState<{ p: LatLngLiteral; precedingPathIndex: number }>();
  const [currentDistanceMM, setCurrentDistanceMM] = useState<number>();
  const [centerOnLocation, setCenterOnLocation] = useState<{ center: LatLngLiteral; requestId: number }>();
  const liveMapRef = useRef<LiveMapHandle>(null);
  const [isKeyboardModeActive, setIsKeyboardModeActive] = useState(false);
  const [videoUrlOverride, setVideoUrlOverride] = useState(() => loadVideoUrlOverride(initialTrack.uuid));
  const changeVideoUrlOverride = useCallback(
    (url: string | undefined, options?: { isLocalFile?: boolean }) => {
      setVideoUrlOverride((prev) => {
        if (prev?.startsWith("blob:")) URL.revokeObjectURL(prev);
        return url;
      });
      // Object URLs are meaningless after a reload, so only persist real URLs
      saveVideoUrlOverride(initialTrack.uuid, options?.isLocalFile ? undefined : url);
    },
    [initialTrack.uuid],
  );
  const locationRequestId = useRef(0);
  const isEditingModeOn = true;
  const isKeyboardFocusedModeOn = isEditingModeOn && isKeyboardModeActive;

  const viewOptionsState = useMemoState(DefaultViewOptions);

  const [viewOptions] = viewOptionsState;
  const timingPoints = track.timingPoints;
  const [path, setPath] = usePickedState(trackState, "path");
  const [, setTimingPoints] = usePickedState(trackState, "timingPoints");

  const videoPlayer = useVideoPlayer({
    videoUrl: videoUrlOverride ?? track.videoUrl,
    onProgress: onPlayerProgress,
  });

  useEffect(() => {
    if (!isEditingModeOn) {
      setIsKeyboardModeActive(false);
    }
  }, [isEditingModeOn]);

  useEffect(() => {
    console.log("precedingTrackPointIndex", precedingTrackPointIndex);
  }, [precedingTrackPointIndex]);

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

  const addTimingPoint = useCallback(
    () => _addTimingPoint(playedSeconds, currentDistanceMM, setTimingPoints),
    [playedSeconds, currentDistanceMM, setTimingPoints],
  );
  const deleteTimingPointById = useCallback(
    (id: string) => setTimingPoints((oldTimingPoints) => oldTimingPoints.filter((tp) => tp.uuid !== id)),
    [setTimingPoints],
  );

  const jumpToTime = videoPlayer.seekTo;
  const jumpToLocation = useCallback(
    (distanceMM: number) => {
      const center = findCoordinateAtDistance(distanceFromStartMap, distanceMM);
      if (!center) return;
      setCenterOnLocation({ center, requestId: ++locationRequestId.current });
    },
    [distanceFromStartMap],
  );
  const jumpToTimeAndLocation = useCallback(
    ({ time, distanceMM }: { time: number; distanceMM: number }) => {
      jumpToTime(time);
      jumpToLocation(distanceMM);
    },
    [jumpToTime, jumpToLocation],
  );

  const jumpToTimingPointByIndex = useCallback(
    (index: number) => {
      if (!timingPoints.length || index < 0 || index >= timingPoints.length) return;
      const timingPoint = timingPoints[index];
      if (!timingPoint) return;
      jumpToTimeAndLocation({ time: timingPoint.t, distanceMM: timingPoint.d });
    },
    [timingPoints, jumpToTimeAndLocation],
  );
  const jumpToNextTimingPoint = useCallback(() => {
    console.log("jumpToNextTimingPoint called, precedingTrackPointIndex:", precedingTrackPointIndex);
    jumpToTimingPointByIndex(precedingTrackPointIndex + 1);
  }, [jumpToTimingPointByIndex, precedingTrackPointIndex]);
  const jumpToPreviousTimingPoint = useCallback(() => {
    console.log("jumpToPreviousTimingPoint called, precedingTrackPointIndex:", precedingTrackPointIndex);
    jumpToTimingPointByIndex(precedingTrackPointIndex);
  }, [jumpToTimingPointByIndex, precedingTrackPointIndex]);

  const toggleKeyboardMode = useCallback(() => {
    setIsKeyboardModeActive((active) => !active);
  }, []);

  useEffect(() => {
    const togglePlayback = () => {
      const playback = videoPlayer.togglePlayback();
      if (playback) {
        void playback.catch((error) => console.error("Error while toggling video playback:", error));
      }
    };

    const sharedKeyboardShortcutHandlers = [
      k()
        .key(" ")
        .handle((ev) => {
          const target = ev.target instanceof Element ? ev.target : null;
          // Space natively activates focused buttons and links, so do nothing
          if (
            target?.closest(
              "button, a[href], summary, [role='button'], [role='switch'], [role='menuitem'], video, .media-container",
            )
          ) {
            return { shouldStopProcessing: true };
          }
          ev.preventDefault();
          togglePlayback();
          return { shouldStopProcessing: true };
        }),
    ];
    const keyboardShortcutHandlers = (() => {
      if (!isEditingModeOn) {
        return sharedKeyboardShortcutHandlers;
      }
      if (!isKeyboardFocusedModeOn) {
        return sharedKeyboardShortcutHandlers;
      }
      return [
        ...sharedKeyboardShortcutHandlers,
        ksd("w").handleAndStop(() => jumpToPreviousTimingPoint()),
        ksd("e").handleAndStop(() => jumpToNextTimingPoint()),
        ksd("a").handleAndStop(() => videoPlayer.seekBy(-1)),
        ksd("a")
          .shift()
          .handleAndStop(() => videoPlayer.seekBy(-0.1)),
        ksd("s").handleAndStop(() => videoPlayer.seekBy(-10)),
        ksd("s")
          .shift()
          .handleAndStop(() => videoPlayer.seekBy(-30)),
        ksd("d").handleAndStop(() => videoPlayer.seekBy(10)),
        ksd("d")
          .shift()
          .handleAndStop(() => videoPlayer.seekBy(30)),
        ksd("f").handleAndStop(() => videoPlayer.seekBy(1)),
        ksd("f")
          .shift()
          .handleAndStop(() => videoPlayer.seekBy(0.1)),

        ksd("g").handleAndStop(() => liveMapRef.current?.goToCurrentLocation()),
      ];
    })();

    const onKeyboardShortcut = (ev: KeyboardEvent) => {
      if (ev.key === "Escape" && !ev.altKey && !ev.ctrlKey && !ev.metaKey && !ev.shiftKey) {
        // Release focus from whatever element captured it, so other shortcuts reach the page again
        if (document.activeElement instanceof HTMLElement && document.activeElement !== document.body) {
          document.activeElement.blur();
        }
        return;
      }

      const target = ev.target instanceof Element ? ev.target : null;
      // Ignore most keyboard shortcuts when the focus is on an input element
      if (target?.closest("input, textarea, select, [contenteditable='true'], [role='textbox']")) return;

      const evKeyLowerCase = ev.key.toLowerCase();
      for (const handler of keyboardShortcutHandlers) {
        if (
          handler.key.toLowerCase() === evKeyLowerCase &&
          handler.alt === ev.altKey &&
          handler.ctrl === ev.ctrlKey &&
          handler.meta === ev.metaKey &&
          handler.shift === ev.shiftKey
        ) {
          const result = handler.handler(ev);
          if (result.shouldStopProcessing) return;
        }
      }
    };

    document.addEventListener("keydown", onKeyboardShortcut);
    return () => document.removeEventListener("keydown", onKeyboardShortcut);
  }, [
    isKeyboardFocusedModeOn,
    isEditingModeOn,
    videoPlayer,
    liveMapRef,
    jumpToNextTimingPoint,
    jumpToPreviousTimingPoint,
  ]);

  const reversePath = useCallback(() => setPath((path) => [...path].reverse()), [setPath]);
  const downloadTrackAsFile = useFileDownload(`track_${track.uuid}.json`, () => Tracks.serializeToJson(track));

  const showMapAsOverlay = !isEditingModeOn;

  const straightRailOptionsState = usePickedState(viewOptionsState, "straightRailsOverlay");

  return (
    <div>
      <MenuBar
        trackId={track.uuid}
        isKeyboardFocusedModeOn={isKeyboardFocusedModeOn}
        onToggleKeyboardMode={toggleKeyboardMode}
        videoUrlOverride={videoUrlOverride}
        onVideoUrlOverrideChange={changeVideoUrlOverride}
        viewOptionsState={viewOptionsState}
        trackTitle={track.title}
        onDownloadFileClicked={downloadTrackAsFile}
      />

      <VideoAndMapContainer showMapAsOverlay={showMapAsOverlay}>
        <VideoContainer showMapAsOverlay={showMapAsOverlay}>
          <videoPlayer.Player />
          <StraightRailsOverlay optionsState={straightRailOptionsState} />
        </VideoContainer>

        <EditingMapContainer>
          <EditingLiveMap
            ref={liveMapRef}
            trackState={trackState}
            path={path}
            timingPointLocations={computeTimingPointLocations(distanceFromStartMap, timingPoints)}
            initialCenter={initialCoord}
            currentCenter={currentCenter}
            centerOnLocation={centerOnLocation}
            onMapMoved={(newCenter) => setProjectedPointInfo(newCenter)}
            viewOptions={viewOptions.mapViewOptions}
          />

          <AddTimingPointWidget
            playedSeconds={playedSeconds}
            currentDistanceMM={currentDistanceMM}
            onAddButtonClicked={addTimingPoint}
          />
        </EditingMapContainer>
      </VideoAndMapContainer>

      {isEditingModeOn && (
        <>
          <Stack direction="row" spacing={2} sx={{ mt: 2, width: "90%", mx: "auto" }}>
            <Box sx={{ flexGrow: 1, minHeight: "200px" }}>
              <VideoInfoArea
                trackTitle={track.title}
                videoUrl={track.videoUrl}
                videoDuration={videoPlayer.duration}
                pathLengthMM={pathLengthMM}
                onTrackInfoChanged={(title, videoUrl) => setTrack((prev) => ({ ...prev, title, videoUrl }))}
                onPathUploaded={setPath}
                onReversePathClicked={reversePath}
              />
            </Box>
            <Box sx={{ width: 300 }}>
              <>
                <TimingPointsListMemo
                  timingPoints={timingPoints}
                  onDeleteTimingPoint={deleteTimingPointById}
                  onJumpToTime={jumpToTime}
                  onJumpToLocation={jumpToLocation}
                  precedingIndex={precedingTrackPointIndex}
                  isAutoScrollOn={viewOptions.trackPointsEditorOptions.isAutoscrollTimingPointsListOn}
                />
                {/* <Placeholder width={300} height={350} text="TP List" /> */}
              </>
            </Box>
          </Stack>
          <BottomInfoBar {...{ isEditingModeOn, isKeyboardFocusedModeOn }} />
        </>
      )}
    </div>
  );
};

function getModeTextAndShortcuts({
  isEditingModeOn,
  isKeyboardFocusedModeOn,
}: {
  isEditingModeOn: boolean;
  isKeyboardFocusedModeOn: boolean;
}): { modeText: string; shortcuts: { key: string; label: string }[] } {
  if (!isEditingModeOn) {
    return { modeText: "view", shortcuts: [] };
  }

  const sharedEditModeShortcuts = [{ key: "space", label: "play/pause" }];

  if (isKeyboardFocusedModeOn) {
    return {
      modeText: "edit/keyboard",
      shortcuts: [
        ...sharedEditModeShortcuts,
        { key: "a/s/d/f", label: "seek -1s/-10s/+10s/+0.1s" },
        { key: "w/e", label: "go to prev/next timing point" },
        { key: "g", label: "recenter map" },
      ],
    };
  }
  return { modeText: "edit", shortcuts: [...sharedEditModeShortcuts] };
}

const BottomInfoBar = ({
  isEditingModeOn,
  isKeyboardFocusedModeOn,
}: {
  isEditingModeOn: boolean;
  isKeyboardFocusedModeOn: boolean;
}) => {
  const { modeText, shortcuts } = getModeTextAndShortcuts({ isEditingModeOn, isKeyboardFocusedModeOn });

  return (
    <Box sx={{ position: "fixed", bottom: 0, width: "100%", backgroundColor: "#333" }}>
      <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
        <Box sx={{ backgroundColor: deepPurple.A100, color: "#222", px: 2 }}>
          <Typography sx={{ fontFamily: "Fire Code, monospace", fontWeight: "bold" }}>{modeText}</Typography>
        </Box>
        {shortcuts.map(({ key, label }, index) => (
          <>
            {index > 0 && (
              <Box key={"separator" + key} sx={{ fontFamily: "Fire Code, monospace", fontSize: "90%" }}>
                •
              </Box>
            )}
            <Box
              key={key}
              sx={{ fontFamily: "Fire Code, monospace", fontSize: "90%", pl: index === 0 ? 1 : undefined }}
            >
              <Typography sx={{ fontFamily: "inherit", fontSize: "inherit", color: deepPurple.A100 }} component="span">
                {key}
              </Typography>{" "}
              <Typography sx={{ fontFamily: "inherit", fontSize: "inherit" }} component="span">
                {label}
              </Typography>
            </Box>
          </>
        ))}
      </Stack>
    </Box>
  );
};

interface WithShowAsMapOverlay {
  showMapAsOverlay: boolean;
}
const VideoAndMapContainer = styled(Box, {
  shouldForwardProp: (prop) => prop !== "showMapAsOverlay",
})<WithShowAsMapOverlay>(
  ({ showMapAsOverlay }) => css`
    position: relative;
    margin: 0 auto;
    display: flex;
    align-items: center;
    ${
      showMapAsOverlay
        ? css`
            max-height: calc(100vh - 64px - 32px);
            aspect-ratio: 16/9;
          `
        : css`
            width: calc(90%);
            aspect-ratio: 25/9;
          `
    }
  `,
);
const VideoContainer = styled(Box, { shouldForwardProp: (prop) => prop !== "showMapAsOverlay" })<WithShowAsMapOverlay>(
  ({ showMapAsOverlay }) => css`
    position: absolute;
    aspect-ratio: 16/9;
    ${
      showMapAsOverlay
        ? css`
            width: 100%;
          `
        : css`
            /* width: calc(64% - 8px); */
            height: 100%;
          `
    }
  `,
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

const MenuBar: FC<{
  trackId: string;
  trackTitle: string;
  isKeyboardFocusedModeOn: boolean;
  onToggleKeyboardMode: () => void;
  videoUrlOverride: string | undefined;
  onVideoUrlOverrideChange: (url: string | undefined, options?: { isLocalFile?: boolean }) => void;
  viewOptionsState: UseState<ViewOptions>;
  onDownloadFileClicked: () => void;
}> = ({
  trackId,
  trackTitle,
  isKeyboardFocusedModeOn,
  onToggleKeyboardMode,
  videoUrlOverride,
  onVideoUrlOverrideChange,
  viewOptionsState,
  onDownloadFileClicked,
}) => (
  <AppBar position="static" sx={{ mb: 2 }}>
    <Toolbar>
      <Box sx={{ mr: 2 }}>
        <IconButton color="inherit" title="Back to start page" component={Link} href="/">
          <ArrowBackIcon />
        </IconButton>
      </Box>
      {/* TODO: make text wrap properly or cut off with ellipsis if too long */}
      <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
        {trackTitle}
      </Typography>
      <VideoOverrideButton override={videoUrlOverride} onChange={onVideoUrlOverrideChange} />
      <IconButton
        color={isKeyboardFocusedModeOn ? "secondary" : "inherit"}
        title={isKeyboardFocusedModeOn ? "Disable keyboard shortcuts" : "Enable keyboard shortcuts"}
        aria-label={isKeyboardFocusedModeOn ? "Disable keyboard shortcuts" : "Enable keyboard shortcuts"}
        aria-pressed={isKeyboardFocusedModeOn}
        onClick={onToggleKeyboardMode}
      >
        <KeyboardIcon />
      </IconButton>
      <IconButton color="inherit" onClick={onDownloadFileClicked} title="Download track as file">
        <DownloadIcon />
      </IconButton>
      <ViewOptionsButton viewOptionsState={viewOptionsState} />
      <Button
        size="small"
        variant="outlined"
        color="inherit"
        sx={{ ml: 2 }}
        component={Link}
        href={PageRouting.viewTrackPage(trackId)}
      >
        <SmartDisplayIcon fontSize="small" />
        <Box sx={{ ml: 0.5, display: { xs: "none", md: "initial" } }}>View</Box>
      </Button>
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
  <Box sx={{ position: "absolute", bottom: 0, right: 0, zIndex: 1000, m: 2 }}>
    <Card raised sx={{ pl: 2, pr: 1 }}>
      <Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
        <Box>
          <Typography sx={{ fontFamily: "monospace", my: 1 }}>t = {formatTimeSec(playedSeconds)}</Typography>
          <Typography sx={{ fontFamily: "monospace", my: 1 }}>
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

export function interpolateCoordinates(
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

function findCoordinateAtDistance(
  distanceFromStartMap: ReadonlyArray<DistanceWithCoord>,
  distance: number,
): LatLngLiteral | undefined {
  if (distanceFromStartMap.length === 0) return undefined;
  if (distance <= distanceFromStartMap[0][0]) return distanceFromStartMap[0][1];

  for (let i = 1; i < distanceFromStartMap.length; i++) {
    const prev = distanceFromStartMap[i - 1];
    const next = distanceFromStartMap[i];
    if (distance <= next[0]) {
      if (distance === next[0] || next[0] === prev[0]) return next[1];
      return interpolateCoordinates(prev, next, distance);
    }
  }

  return distanceFromStartMap[distanceFromStartMap.length - 1][1];
}

export function computeTimingPointLocations(
  distanceFromStartMap: DistanceWithCoord[],
  timingPoints: ReadonlyArray<TimingPoint>,
): ReadonlyArray<LatLngLiteral> {
  let dfsIdx = 1,
    tpIdx = 0;
  const result: Array<LatLngLiteral> = [];
  while (dfsIdx < distanceFromStartMap.length && tpIdx < timingPoints.length) {
    if (timingPoints[tpIdx].d < distanceFromStartMap[dfsIdx][0]) {
      const tpCoord = interpolateCoordinates(
        distanceFromStartMap[dfsIdx - 1],
        distanceFromStartMap[dfsIdx],
        timingPoints[tpIdx].d,
      );
      result.push(tpCoord);
      tpIdx++;
    } else {
      dfsIdx++;
    }
  }
  return result;
}

function _addTimingPoint(
  playedSeconds: number,
  currentDistanceMM: number | undefined,
  setTimingPoints: SetState<ReadonlyArray<TimingPoint & HasUuid>>,
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
