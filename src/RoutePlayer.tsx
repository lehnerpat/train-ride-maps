import { FC, useEffect, useState } from "react";
import "./App.css";
import { MapContainer, Marker, Pane, Polyline, TileLayer, useMapEvent } from "react-leaflet";
import ReactPlayer from "react-player/youtube";
import { LatLngLiteral, Map as LeafletMap } from "leaflet";
import { Route, Waypoint } from "./Route";
import styled from "styled-components";

interface RoutePlayerProps {
  route: Route;
}
export const RoutePlayer: FC<RoutePlayerProps> = ({ route }) => {
  const initialCoord = route.waypoints[0].p;
  const [waypoints, setWaypoints] = useState(route.waypoints);
  const [durationSec, setDurationSec] = useState<number>();
  const [playedSeconds, setPlayedSeconds] = useState(0);
  const [currentCenter, setCurrentCenter] = useState<LatLngLiteral>(initialCoord);
  const [lastClickedCoord, setLastClickedCoord] = useState<LatLngLiteral>();
  const [map, setMap] = useState<LeafletMap | null>(null);

  const [wpInputTime, setWpInputTime] = useState(0);
  const [wpInputTimeTouched, setWpInputTimeTouched] = useState(false);

  useEffect(() => {
    if (map === null) return;
    const [prev, next] = findAdjacentCoordinates(playedSeconds, waypoints);
    const interpolated =
      prev === null ? next?.p : next === null ? prev.p : interpolateCoordinates(prev, next, playedSeconds);
    if (!!interpolated) {
      setCurrentCenter(interpolated);
      map.setView(interpolated, undefined, { animate: true });
    }
  }, [playedSeconds, map, waypoints]);

  return (
    <RoutePlayerContainer>
      <WaypointsCol>
        <InfoPane>
          <div style={{ marginBottom: "20px" }}>
            <div>
              <input
                type="number"
                value={wpInputTimeTouched ? wpInputTime : playedSeconds}
                style={{ width: "120px" }}
                onChange={(ev) => {
                  setWpInputTime(ev.target.valueAsNumber);
                  setWpInputTimeTouched(true);
                }}
              />
              <Button
                onClick={() => {
                  setWpInputTime(playedSeconds);
                  setWpInputTimeTouched(false);
                }}
              >
                Now
              </Button>
            </div>
            <div>
              lat:
              <input
                type="number"
                value={!!lastClickedCoord ? lastClickedCoord.lat : ""}
                style={{ width: "120px" }}
                readOnly
              />
            </div>
            <div>
              lng:
              <input
                type="number"
                value={!!lastClickedCoord ? lastClickedCoord.lng : ""}
                style={{ width: "120px" }}
                readOnly
              />
            </div>
            <div>
              <Button
                onClick={() => {
                  if (!lastClickedCoord) return;
                  const t = wpInputTimeTouched ? wpInputTime : playedSeconds;
                  addWaypoint({ t, p: lastClickedCoord }, setWaypoints);
                }}
              >
                Add WP
              </Button>
              <Button
                onClick={() => {
                  copyToClipboard(
                    waypoints.map(({ t, p: { lat, lng } }) => `{t:${t}, p:{lat:${lat},lng:${lng}}}`).join(", ")
                  );
                }}
              >
                Copy WPs
              </Button>
            </div>
          </div>
          <WpList>
            {waypoints.map((tc, idx) => (
              <WpListItem key={idx}>
                <div>
                  t={tc.t}s, p={"{"}
                </div>
                <div>lat={tc.p.lat},</div>
                <div>
                  lng={tc.p.lng}
                  {"}"}
                </div>
              </WpListItem>
            ))}
          </WpList>
        </InfoPane>
      </WaypointsCol>
      <PlayerMapCol>
        <InfoPane>
          <div>Duration: {typeof durationSec === "number" ? durationSec + "s" : "---"}</div>
          <div>Current: {playedSeconds.toFixed(0)}s</div>
        </InfoPane>
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
            onDuration={(duration) => {
              setDurationSec(duration);
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
              <Polyline color="purple" positions={waypoints.map((wp) => wp.p)} />
              {waypoints.map((tc, idx) => (
                <Marker position={tc.p} key={idx} />
              ))}
            </Pane>
            <Pane name="current-position-pane">
              <Marker position={currentCenter} title="Current" />
            </Pane>
          </MapContainer>
        </div>
        <InfoPane>
          <div style={{ display: "flex" }}>
            <div>Last click:</div>
            <CoordDisplay
              type="text"
              readOnly
              value={!!lastClickedCoord ? formatLatLngLiteral(lastClickedCoord) : ""}
            />
            <Button
              onClick={() => {
                if (!!lastClickedCoord) {
                  copyToClipboard(formatLatLngLiteral(lastClickedCoord));
                }
              }}
            >
              Copy
            </Button>
            <Button
              onClick={() => {
                setLastClickedCoord(undefined);
              }}
            >
              Clear
            </Button>
          </div>
        </InfoPane>
      </PlayerMapCol>
    </RoutePlayerContainer>
  );
};

function addWaypoint(newWaypoint: Waypoint, setWaypoints: React.Dispatch<React.SetStateAction<Waypoint[]>>) {
  setWaypoints((oldWaypoints) => {
    const newWaypoints = [...oldWaypoints];
    const newIdx = newWaypoints.findIndex((wp) => wp.t > newWaypoint.t);
    if (newIdx === -1) {
      newWaypoints.push(newWaypoint);
    } else {
      newWaypoints.splice(newIdx, 0, newWaypoint);
    }
    return newWaypoints;
  });
}

function formatLatLngLiteral(p: LatLngLiteral): string {
  const { lat, lng } = p;
  return `{ lat: ${lat}, lng: ${lng} }`;
}

const ClickHandler: FC<{ setLastClickedCoord: React.Dispatch<React.SetStateAction<LatLngLiteral | undefined>> }> = ({
  setLastClickedCoord,
}) => {
  useMapEvent("contextmenu", (ev) => {
    const pos = ev.latlng;
    setLastClickedCoord(pos);
  });
  return null;
};

function findAdjacentCoordinates(offsetSec: number, coordinates: Waypoint[]): [Waypoint | null, Waypoint | null] {
  const coordinatesCount = coordinates.length;
  if (!coordinates || !Array.isArray(coordinates) || coordinatesCount === 0) return [null, null];
  if (offsetSec < coordinates[0].t) return [null, coordinates[0]];
  if (offsetSec >= coordinates[coordinatesCount - 1].t) return [coordinates[coordinatesCount - 1], null];
  const nextIndex = coordinates.findIndex((tc) => tc.t > offsetSec);
  if (nextIndex === -1) throw new Error("nextIndex was -1 but should never be here");
  if (nextIndex === 0) throw new Error("nextIndex was 0 but should never be here");
  return [coordinates[nextIndex - 1], coordinates[nextIndex]];
}

function interpolateCoordinates(prevCoord: Waypoint, nextCoord: Waypoint, offsetSec: number): LatLngLiteral {
  if (offsetSec < prevCoord.t || offsetSec > nextCoord.t)
    throw new Error(`Given offsetSec ${offsetSec} was outside of TimedCoord range [${prevCoord.t}, ${nextCoord.t}]`);
  const p = (offsetSec - prevCoord.t) / (nextCoord.t - prevCoord.t);
  const lat = prevCoord.p.lat + p * (nextCoord.p.lat - prevCoord.p.lat);
  const lng = prevCoord.p.lng + p * (nextCoord.p.lng - prevCoord.p.lng);
  return { lat, lng };
}

const InfoPane = styled.div`
  margin: 20px 0;
  background: #282828;
  border: 1px solid gray;
  border-radius: 2px;
  padding: 10px 20px;
  color: #eee;
`;

const CoordDisplay = styled.input`
  background: #333;
  color: white;
  border: 1px solid gray;
  border-radius: 2px;
  margin: 0 10px;
  width: fit-content;
  font-family: monospace;
  padding: 2px 5px;
  flex-grow: 1;
`;

const Button = styled.button`
  background: #333;
  color: white;
  border: 1px solid gray;
  border-radius: 2px;
  padding: 2px 5px;
`;

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

const WpList = styled.ul`
  padding-left: 10px;
`;
const WpListItem = styled.li`
  font-family: monospace;
`;

function copyToClipboard(s: string) {
  navigator.clipboard.writeText(s);
}
