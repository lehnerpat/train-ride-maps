import { FC, useEffect, useState } from "react";
import { LatLngLiteral } from "leaflet";
import { Track, Tracks, TrackPoint } from "../track-models";
import styled, { css } from "styled-components";
import { TrackPointsEditor } from "./TrackPointsEditor";
import { VideoPlayer } from "./VideoPlayer";
import { LiveMap } from "./LiveMap";
import { TrackLocalStorageService } from "../common-components/TrackLocalStorageService";
import { LoadSaveFile } from "../LoadSaveFile";
import { SetState, UseState } from "../common-components/UseState";
import { DefaultViewOptions, ViewOptionsDialog } from "./ViewOptions";

interface TrackPlayerProps {
  initialTrack: Track;
}
export const TrackPlayer: FC<TrackPlayerProps> = ({ initialTrack }) => {
  const initialCoord = initialTrack.trackPoints.length > 0 ? initialTrack.trackPoints[0].p : { lat: 0, lng: 0 };
  const [track, setTrack] = useAutosavingTrackState(initialTrack);
  const [playedSeconds, setPlayedSeconds] = useState(0);
  const [currentCenter, setCurrentCenter] = useState<LatLngLiteral>(initialCoord);
  const [interactionMapCenter, setInteractionMapCenter] = useState<LatLngLiteral>();
  const [adjacentCoordIndexes, setAdjacentCoordIndex] = useState<[number | null, number | null]>([
    null,
    track.trackPoints.length > 0 ? 0 : null,
  ]);
  const [isEditingModeOn, setEditingModeOn] = useState(false);
  const [viewOptions, setViewOptions] = useState(DefaultViewOptions);
  const [isViewOptionsDialogOpen, setViewOptionsDialogOpen] = useState(false);

  const trackPoints = track.trackPoints;

  useEffect(() => {
    const [prev, next] = findAdjacentCoordinates(playedSeconds, trackPoints);
    setAdjacentCoordIndex([prev, next]);
    let interpolated: LatLngLiteral | undefined;
    if (prev === null) {
      if (next !== null) {
        interpolated = trackPoints[next].p;
      }
    } else if (next === null) {
      interpolated = trackPoints[prev].p;
    } else {
      interpolated = interpolateCoordinates(trackPoints[prev], trackPoints[next], playedSeconds);
    }

    if (!!interpolated) {
      setCurrentCenter(interpolated);
    }
  }, [playedSeconds, trackPoints]);

  const setTrackPoints = (newTrackPoints: React.SetStateAction<TrackPoint[]>) => {
    setTrack((prevTrack) => {
      return {
        ...prevTrack,
        trackPoints: typeof newTrackPoints === "function" ? newTrackPoints(prevTrack.trackPoints) : newTrackPoints,
      };
    });
  };

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
        <TopButtonSpacer />
        <TopButton
          onClick={() => {
            setViewOptionsDialogOpen(!isViewOptionsDialogOpen);
          }}
        >
          Map options
        </TopButton>
      </TopButtonPanel>
      {isViewOptionsDialogOpen && <ViewOptionsDialog viewOptionsState={[viewOptions, setViewOptions]} />}
      <TrackPlayerContainer isEditingModeOn={isEditingModeOn}>
        {isEditingModeOn && (
          <TrackPointsCol>
            <TrackPointsEditor
              trackPointsState={[trackPoints, setTrackPoints]}
              playedSeconds={playedSeconds}
              mapCenter={interactionMapCenter}
              adjacentCoordinateIndex={adjacentCoordIndexes}
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
                onMapMoved={(newCenter) => setInteractionMapCenter(newCenter)}
                trackPoints={trackPoints}
                playedSeconds={playedSeconds}
                isEditingModeOn={isEditingModeOn}
                viewOptions={viewOptions.mapViewOptions}
              />
            </LiveMapContainer>
          </VideoAndMapContainer>
        </PlayerMapCol>
      </TrackPlayerContainer>
      <LoadSaveFile onDownloadRequested={() => Tracks.serializeToJson(track)} />
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
  ${(props) =>
    !!props.showMapAsOverlay &&
    css`
      aspect-ratio: 16/9;
      max-height: 90vh;
      position: relative;
      margin: 0 auto;
    `}
`;

interface VideoPlayerContainerProps {
  showMapAsOverlay: boolean;
}
const VideoPlayerContainer = styled.div<VideoPlayerContainerProps>`
  width: 100%;
  aspect-ratio: 16/9;
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
      TrackLocalStorageService.save(track);
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

function findAdjacentCoordinates(offsetSec: number, coordinates: TrackPoint[]): [number | null, number | null] {
  const coordinatesCount = coordinates.length;
  if (!coordinates || !Array.isArray(coordinates) || coordinatesCount === 0) return [null, null];
  if (offsetSec < coordinates[0].t) return [null, 0];
  if (offsetSec >= coordinates[coordinatesCount - 1].t) return [coordinatesCount - 1, null];
  const nextIndex = coordinates.findIndex((tc) => tc.t > offsetSec);
  if (nextIndex === -1) throw new Error("nextIndex was -1 but should never be here");
  if (nextIndex === 0) throw new Error("nextIndex was 0 but should never be here");
  return [nextIndex - 1, nextIndex];
}

function interpolateCoordinates(prevCoord: TrackPoint, nextCoord: TrackPoint, offsetSec: number): LatLngLiteral {
  if (offsetSec < prevCoord.t || offsetSec > nextCoord.t)
    throw new Error(`Given offsetSec ${offsetSec} was outside of TimedCoord range [${prevCoord.t}, ${nextCoord.t}]`);
  const p = (offsetSec - prevCoord.t) / (nextCoord.t - prevCoord.t);
  const lat = prevCoord.p.lat + p * (nextCoord.p.lat - prevCoord.p.lat);
  const lng = prevCoord.p.lng + p * (nextCoord.p.lng - prevCoord.p.lng);
  return { lat, lng };
}

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
