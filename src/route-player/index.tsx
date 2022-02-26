import { FC, useEffect, useState } from "react";
import { LatLngLiteral } from "leaflet";
import { Route, Routes, Waypoint } from "../route-models";
import styled from "styled-components";
import { WaypointsEditor } from "./WaypointsEditor";
import { VideoPlayer } from "./VideoPlayer";
import { LiveMap } from "./LiveMap";
import { RouteLocalStorageService } from "../common-components/RouteLocalStorageService";
import { LoadSaveFile } from "../LoadSaveFile";

interface RoutePlayerProps {
  initialRoute: Route;
}
export const RoutePlayer: FC<RoutePlayerProps> = ({ initialRoute }) => {
  const initialCoord = initialRoute.waypoints.length > 0 ? initialRoute.waypoints[0].p : { lat: 0, lng: 0 };
  const [route, setRoute] = useState(initialRoute);
  const [playedSeconds, setPlayedSeconds] = useState(0);
  const [currentCenter, setCurrentCenter] = useState<LatLngLiteral>(initialCoord);
  const [lastClickedCoord, setLastClickedCoord] = useState<LatLngLiteral>();
  const [adjacentCoordIndexes, setAdjacentCoordIndex] = useState<[number | null, number | null]>([
    null,
    route.waypoints.length > 0 ? 0 : null,
  ]);
  const [isEditingModeOn, setEditingModeOn] = useState(false);

  const waypoints = route.waypoints;

  useEffect(() => {
    RouteLocalStorageService.save(route);
  }, [route]);

  useEffect(() => {
    const [prev, next] = findAdjacentCoordinates(playedSeconds, waypoints);
    setAdjacentCoordIndex([prev, next]);
    let interpolated: LatLngLiteral | undefined;
    if (prev === null) {
      if (next !== null) {
        interpolated = waypoints[next].p;
      }
    } else if (next === null) {
      interpolated = waypoints[prev].p;
    } else {
      interpolated = interpolateCoordinates(waypoints[prev], waypoints[next], playedSeconds);
    }

    if (!!interpolated) {
      setCurrentCenter(interpolated);
    }
  }, [playedSeconds, waypoints]);

  const setWaypoints = (newWaypoints: React.SetStateAction<Waypoint[]>) => {
    setRoute((prevRoute) => {
      return {
        ...prevRoute,
        waypoints: typeof newWaypoints === "function" ? newWaypoints(prevRoute.waypoints) : newWaypoints,
      };
    });
  };

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
      </TopButtonPanel>
      <RoutePlayerContainer>
        {isEditingModeOn && (
          <WaypointsCol>
            <WaypointsEditor
              waypointsState={[waypoints, setWaypoints]}
              playedSeconds={playedSeconds}
              lastMapClickPosition={lastClickedCoord}
              adjactedCoordinateIndex={adjacentCoordIndexes}
            />
          </WaypointsCol>
        )}
        <PlayerMapCol>
          <VideoPlayer
            videoUrl={route.videoUrl}
            onProgress={(ev) => {
              setPlayedSeconds(ev.playedSeconds);
            }}
          />
          <LiveMap
            initialCenter={initialCoord}
            currentCenter={currentCenter}
            setLastClickedCoord={setLastClickedCoord}
            waypoints={waypoints}
            playedSeconds={playedSeconds}
            isEditingModeOn={isEditingModeOn}
          />
        </PlayerMapCol>
      </RoutePlayerContainer>
      <LoadSaveFile onDownloadRequested={() => Routes.serializeToJson(route)} />
    </div>
  );
};

const TopButtonPanel = styled.div`
  margin: 3px 0 5px;
  background: #222222;
  border: 1px solid #555;
  border-radius: 2px;
  padding: 0;
  color: #eee;
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

function findAdjacentCoordinates(offsetSec: number, coordinates: Waypoint[]): [number | null, number | null] {
  const coordinatesCount = coordinates.length;
  if (!coordinates || !Array.isArray(coordinates) || coordinatesCount === 0) return [null, null];
  if (offsetSec < coordinates[0].t) return [null, 0];
  if (offsetSec >= coordinates[coordinatesCount - 1].t) return [coordinatesCount - 1, null];
  const nextIndex = coordinates.findIndex((tc) => tc.t > offsetSec);
  if (nextIndex === -1) throw new Error("nextIndex was -1 but should never be here");
  if (nextIndex === 0) throw new Error("nextIndex was 0 but should never be here");
  return [nextIndex - 1, nextIndex];
}

function interpolateCoordinates(prevCoord: Waypoint, nextCoord: Waypoint, offsetSec: number): LatLngLiteral {
  if (offsetSec < prevCoord.t || offsetSec > nextCoord.t)
    throw new Error(`Given offsetSec ${offsetSec} was outside of TimedCoord range [${prevCoord.t}, ${nextCoord.t}]`);
  const p = (offsetSec - prevCoord.t) / (nextCoord.t - prevCoord.t);
  const lat = prevCoord.p.lat + p * (nextCoord.p.lat - prevCoord.p.lat);
  const lng = prevCoord.p.lng + p * (nextCoord.p.lng - prevCoord.p.lng);
  return { lat, lng };
}

const RoutePlayerContainer = styled.div`
  display: flex;
  margin: 0 auto;
  width: 1110px;
  justify-content: center;
`;

const WaypointsCol = styled.div`
  width: 300px;
  margin-right: 10px;
`;
const PlayerMapCol = styled.div`
  flex-grow: 1;
  max-width: 1000px;
`;
