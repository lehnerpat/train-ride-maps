import { FC, memo, useEffect, useState } from "react";
import { LatLngLiteral } from "leaflet";
import { Track, Tracks } from "../track-models/new";
import styled, { css } from "styled-components";
import { TimingPointsEditor } from "./TimingPointsEditor";
import { VideoPlayer } from "./VideoPlayer";
import { LiveMap } from "./LiveMap";
import { LoadSaveFile } from "../common/components/LoadSaveFile";
import { DefaultViewOptions, ViewOptionsDialog } from "./ViewOptions";
import { StraightRailsOverlay as StraightRailsOverlayOriginal } from "./straight-rails-overlay";
import { useMemoState, usePickedState, UseState, SetState } from "../common-components/state-utils";
import { TrackLocalStorageService } from "../track-models/NewTrackLocalStorageService";
import { useFileUpload } from "../common/components/useFileUpload";
import { parseOsmXml } from "../osm-input/parse-osm-xml";
import { distanceInMM } from "../geo/distance";

const StraightRailsOverlay = memo(StraightRailsOverlayOriginal);

interface TrackPlayerProps {
  initialTrack: Track;
}
export const TrackPlayer: FC<TrackPlayerProps> = ({ initialTrack }) => {
  const initialCoord = initialTrack.path.length > 0 ? initialTrack.path[0] : { lat: 0, lng: 0 };
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
  const [viewOptions] = viewOptionsState;

  const [isViewOptionsDialogOpen, setViewOptionsDialogOpen] = useState(false);

  const onOsmFileUploaded = async (file: File) => {
    const osmXml = await file.text();
    const nodes = parseOsmXml(osmXml);
    console.log("parsed ", nodes.length, "nodes");
    const path = nodes.map((n) => n.coord);
    setTrack((track) => ({ ...track, path: path }));
    setCurrentCenter(path[0]);
  };
  const { HiddenFileInput, showUploadDialog } = useFileUpload("osm-import", onOsmFileUploaded);

  const path = track.path;

  useEffect(() => {
    setPathLengthMM(computePathLength(path, distanceInMM));
  }, [path, setPathLengthMM]);

  useEffect(() => {
    if (!projectedPointInfo) {
      setCurrentDistanceMM(undefined);
    } else {
      const currentDistance =
        computePathLength(path, distanceInMM, projectedPointInfo.precedingPathIndex) +
        distanceInMM(path[projectedPointInfo.precedingPathIndex], projectedPointInfo.p);
      setCurrentDistanceMM(currentDistance);
    }
  }, [projectedPointInfo, path]);

  // useEffect(() => {
  //   // TODO: refactor to return only one index
  //   const [prev, next] = findAdjacentCoordinates(playedSeconds, trackPoints);
  //   setPrecedingTrackPointIndex(prev === null ? -1 : prev);
  //   let interpolated: LatLngLiteral | undefined;
  //   if (prev === null) {
  //     if (next !== null) {
  //       interpolated = trackPoints[next].p;
  //     }
  //   } else if (next === null) {
  //     interpolated = trackPoints[prev].p;
  //   } else {
  //     interpolated = interpolateCoordinates(trackPoints[prev], trackPoints[next], playedSeconds);
  //   }

  //   if (!!interpolated) {
  //     setCurrentCenter(interpolated);
  //   }
  // }, [playedSeconds, trackPoints]);

  // const setTrackPoints = (newTrackPoints: React.SetStateAction<TrackPoint[]>) => {
  //   setTrack((prevTrack) => {
  //     return {
  //       ...prevTrack,
  //       trackPoints: typeof newTrackPoints === "function" ? newTrackPoints(prevTrack.trackPoints) : newTrackPoints,
  //     };
  //   });
  // };
  const timingPointsState = usePickedState(trackState, "timingPoints");

  const showMapAsOverlay = !isEditingModeOn;

  return (
    <div>
      <TopButtonPanel>
        <TopButton
          onClick={() => {
            setEditingModeOn(!isEditingModeOn);
          }}
        >
          {isEditingModeOn ? "Switch to viewing mode" : "Switch to editing mode"}
        </TopButton>
        {isEditingModeOn && (
          <>
            <TopButton onClick={() => showUploadDialog()}>{"Import OSM XML"}</TopButton>
            <TopButton onClick={() => showUploadDialog()} disabled={path.length > 0}>
              {path.length > 0 ? "Path already present" : "Import OSM XML"}
            </TopButton>
            <TopButton
              onClick={() => {
                const path = [...track.path].reverse();
                setTrack((track) => ({ ...track, path }));
                setCurrentCenter(path[0]);
              }}
              disabled={path.length === 0}
            >
              Reverse path
            </TopButton>
          </>
        )}
        <TopButtonSpacer />
        <TopButton
          onClick={() => {
            setViewOptionsDialogOpen(!isViewOptionsDialogOpen);
          }}
        >
          Map options
        </TopButton>
      </TopButtonPanel>
      {isViewOptionsDialogOpen && (
        <ViewOptionsDialog viewOptionsState={viewOptionsState} onCloseDialog={() => setViewOptionsDialogOpen(false)} />
      )}
      <TrackPlayerContainer isEditingModeOn={isEditingModeOn}>
        {isEditingModeOn && (
          <TrackPointsCol>
            <TimingPointsEditor
              options={viewOptions.trackPointsEditorOptions}
              timingPointsState={timingPointsState}
              playedSeconds={playedSeconds}
              currentDistance={currentDistanceMM}
              precedingTimingPointIndex={precedingTrackPointIndex}
              pathLengthMM={pathLengthMM}
            />
          </TrackPointsCol>
        )}
        <PlayerMapCol>
          <VideoAndMapContainer showMapAsOverlay={showMapAsOverlay}>
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
                initialCenter={initialCoord}
                currentCenter={currentCenter}
                onMapMoved={(newCenter) => setProjectedPointInfo(newCenter)}
                path={path}
                playedSeconds={playedSeconds}
                isEditingModeOn={isEditingModeOn}
                viewOptions={viewOptions.mapViewOptions}
              />
            </LiveMapContainer>
            <StraightRailsOverlay optionsState={usePickedState(viewOptionsState, "straightRailsOverlay")} />
          </VideoAndMapContainer>
        </PlayerMapCol>
      </TrackPlayerContainer>
      <LoadSaveFile onDownloadRequested={() => Tracks.serializeToJson(track)} />
      <HiddenFileInput />
    </div>
  );
};

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

const TopButtonPanel = styled.div`
  margin: 3px 0 5px;
  background: #222222;
  border: 1px solid #555;
  border-radius: 2px;
  padding: 0;
  color: #eee;
  display: flex;
`;

const TopButtonSpacer = styled.div`
  flex-grow: 1;
`;

const TopButton = styled.button`
  background: #242424;
  border: 1px solid #666;
  color: #eee;
  padding: 3px 7px;
  margin: -1px;
  margin-right: 0;

  &:hover {
    background: #333;
    border-color: gray;
  }
  &:active {
    background: #181818;
    color: #ccc;
  }
`;

// function findAdjacentCoordinates(offsetSec: number, coordinates: TrackPoint[]): [number | null, number | null] {
//   const coordinatesCount = coordinates.length;
//   if (!coordinates || !Array.isArray(coordinates) || coordinatesCount === 0) return [null, null];
//   if (offsetSec < coordinates[0].t) return [null, 0];
//   if (offsetSec >= coordinates[coordinatesCount - 1].t) return [coordinatesCount - 1, null];
//   const nextIndex = coordinates.findIndex((tc) => tc.t > offsetSec);
//   if (nextIndex === -1) throw new Error("nextIndex was -1 but should never be here");
//   if (nextIndex === 0) throw new Error("nextIndex was 0 but should never be here");
//   return [nextIndex - 1, nextIndex];
// }

// function interpolateCoordinates(prevCoord: TrackPoint, nextCoord: TrackPoint, offsetSec: number): LatLngLiteral {
//   if (offsetSec < prevCoord.t || offsetSec > nextCoord.t)
//     throw new Error(`Given offsetSec ${offsetSec} was outside of TimedCoord range [${prevCoord.t}, ${nextCoord.t}]`);
//   const p = (offsetSec - prevCoord.t) / (nextCoord.t - prevCoord.t);
//   const lat = prevCoord.p.lat + p * (nextCoord.p.lat - prevCoord.p.lat);
//   const lng = prevCoord.p.lng + p * (nextCoord.p.lng - prevCoord.p.lng);
//   return { lat, lng };
// }

interface TrackPlayerContainerProps {
  isEditingModeOn: boolean;
}
const TrackPlayerContainer = styled.div<TrackPlayerContainerProps>`
  display: flex;
  margin: 0 auto;
  justify-content: center;
  ${(props) =>
    !!props.isEditingModeOn &&
    css`
      width: 1110px;
    `}
`;

const TrackPointsCol = styled.div`
  width: 300px;
  margin-right: 10px;
`;

function computePathLength(
  path: readonly LatLngLiteral[],
  distanceFunction: (p1: LatLngLiteral, p2: LatLngLiteral) => number,
  lastPointIndex?: number
): number {
  if (!path || path.length < 2) {
    throw new Error(`Cannot compute length of path with less than 2 points, got ${path.length} nodes`);
  }
  const lpi = lastPointIndex ?? path.length - 1;
  let distance = 0;
  for (let i = 0; i < lpi; i++) {
    distance += distanceFunction(path[i], path[i + 1]);
  }
  return distance;
}
