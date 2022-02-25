import { LatLngLiteral, Map as LeafletMap } from "leaflet";
import { FC, useEffect, useState } from "react";
import { MapContainer, Marker, Pane, Polyline, TileLayer, useMapEvent } from "react-leaflet";
import styled from "styled-components";
import { Waypoint } from "../route-models";

interface LiveMapProps {
  waypoints: Waypoint[];
  setLastClickedCoord: React.Dispatch<React.SetStateAction<LatLngLiteral | undefined>>;
  initialCenter: LatLngLiteral;
  currentCenter: LatLngLiteral;
  playedSeconds: number;
}

export const LiveMap: FC<LiveMapProps> = ({ waypoints, initialCenter, currentCenter, setLastClickedCoord }) => {
  const [map, setMap] = useState<LeafletMap | null>(null);

  useEffect(() => {
    if (map === null) return;
    map.setView(currentCenter, undefined, { animate: true });
  }, [map, currentCenter]);

  return (
    <LiveMapContainer>
      <MapContainer
        center={initialCenter}
        zoom={17}
        style={{ height: "400px", width: "100%" }}
        whenCreated={(map) => {
          setMap(map);
        }}
      >
        <ClickHandler setLastClickedCoord={setLastClickedCoord} />
        <BaseTileLayer
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
        <AllWaypointsPane name="all-waypoints-pane">
          <Polyline color="purple" positions={waypoints.map((wp) => wp.p)} />
          {waypoints.map((tc, idx) => (
            <Marker position={tc.p} key={idx} />
          ))}
        </AllWaypointsPane>
        <Pane name="current-position-pane">
          <Marker position={currentCenter} title="Current" />
        </Pane>
      </MapContainer>
    </LiveMapContainer>
  );
};

const LiveMapContainer = styled.div``;

const ClickHandler: FC<{ setLastClickedCoord: React.Dispatch<React.SetStateAction<LatLngLiteral | undefined>> }> = ({
  setLastClickedCoord,
}) => {
  useMapEvent("contextmenu", (ev) => {
    const pos = ev.latlng;
    setLastClickedCoord(pos);
  });
  return null;
};

const BaseTileLayer = styled(TileLayer)`
  & img {
    filter: grayscale(0.7);
  }
`;

const AllWaypointsPane = styled(Pane)`
  & img {
    filter: hue-rotate(90deg);
  }
`;
