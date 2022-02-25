import { FC, useEffect, useState } from "react";
import { MapContainer, Marker, Pane, Polyline, TileLayer, useMapEvent } from "react-leaflet";
import ReactPlayer from "react-player/youtube";
import { LatLngLiteral, Map as LeafletMap } from "leaflet";
import { Route, Waypoint } from "../route-models";
import styled from "styled-components";
import { WaypointsEditor } from "./WaypointsEditor";
import { UseState } from "../common-components/UseState";

interface RoutePlayerProps {
  routeState: UseState<Route>;
}
export const RoutePlayer: FC<RoutePlayerProps> = ({ routeState: [route, setRoute] }) => {
  const initialCoord = route.waypoints.length > 0 ? route.waypoints[0].p : { lat: 0, lng: 0 };
  const [playedSeconds, setPlayedSeconds] = useState(0);
  const [currentCenter, setCurrentCenter] = useState<LatLngLiteral>(initialCoord);
  const [lastClickedCoord, setLastClickedCoord] = useState<LatLngLiteral>();
  const [map, setMap] = useState<LeafletMap | null>(null);
  const [adjacentCoordIndexes, setAdjacentCoordIndex] = useState<[number | null, number | null]>([
    null,
    route.waypoints.length > 0 ? 0 : null,
  ]);

  const waypoints = route.waypoints;

  useEffect(() => {
    if (map === null) return;
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
      map.setView(interpolated, undefined, { animate: true });
    }
  }, [playedSeconds, map, waypoints]);

  const setWaypoints = (newWaypoints: React.SetStateAction<Waypoint[]>) => {
    setRoute((prevRoute) => {
      return {
        ...prevRoute,
        waypoints: typeof newWaypoints === "function" ? newWaypoints(prevRoute.waypoints) : newWaypoints,
      };
    });
  };

  return (
    <RoutePlayerContainer>
      <WaypointsCol>
        <WaypointsEditor
          waypointsState={[waypoints, setWaypoints]}
          playedSeconds={playedSeconds}
          lastMapClickPosition={lastClickedCoord}
          adjactedCoordinateIndex={adjacentCoordIndexes}
        />
      </WaypointsCol>
      <PlayerMapCol>
        <div className="player-container">
          <ReactPlayer
            className="react-player"
            controls
            progressInterval={100}
            width="800px"
            height="450px"
            url={route.videoUrl}
            onProgress={(ev) => {
              setPlayedSeconds(ev.playedSeconds);
            }}
            config={{ playerVars: { start: 1 } }}
          />
        </div>
        <div className="map-container">
          <MapContainer
            center={initialCoord}
            zoom={17}
            style={{ height: "400px", width: "100%" }}
            whenCreated={(map) => {
              setMap(map);
            }}
          >
            <ClickHandler setLastClickedCoord={setLastClickedCoord} />
            <TileLayer
              className="main-layer"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              detectRetina
              maxZoom={20}
              minNativeZoom={2}
              maxNativeZoom={18}
            />
            <TileLayer
              url="http://{s}.tiles.openrailwaymap.org/standard/{z}/{x}/{y}.png"
              attribution='<a href="https://www.openstreetmap.org/copyright">© OpenStreetMap contributors</a>, Style: <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA 2.0</a> <a href="http://www.openrailwaymap.org/">OpenRailwayMap</a> and OpenStreetMap'
              minZoom={2}
              maxZoom={20}
              maxNativeZoom={18}
              tileSize={256}
              detectRetina
            />
            <Pane name="all-waypoints-pane">
              <Polyline color="purple" positions={route.waypoints.map((wp) => wp.p)} />
              {route.waypoints.map((tc, idx) => (
                <Marker position={tc.p} key={idx} />
              ))}
            </Pane>
            <Pane name="current-position-pane">
              <Marker position={currentCenter} title="Current" />
            </Pane>
          </MapContainer>
        </div>
      </PlayerMapCol>
    </RoutePlayerContainer>
  );
};

const ClickHandler: FC<{ setLastClickedCoord: React.Dispatch<React.SetStateAction<LatLngLiteral | undefined>> }> = ({
  setLastClickedCoord,
}) => {
  useMapEvent("contextmenu", (ev) => {
    const pos = ev.latlng;
    setLastClickedCoord(pos);
  });
  return null;
};

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
`;

const WaypointsCol = styled.div`
  width: 250px;
  margin-right: 10px;
`;
const PlayerMapCol = styled.div`
  width: 800px;
`;
