import { LatLngLiteral, Map as LeafletMap } from "leaflet";
import { FC, useEffect, useRef, useState } from "react";
import { MapContainer, Marker, Pane, Polyline, TileLayer, useMapEvent } from "react-leaflet";
import styled from "styled-components";
import { Panel } from "../common-components/Panel";
import { UseState } from "../common-components/UseState";
import { TrackPoint } from "../track-models";
import useResizeObserver from "@react-hook/resize-observer";

interface LiveMapProps {
  waypoints: TrackPoint[];
  onMapMoved: (newCenter: LatLngLiteral) => void;
  initialCenter: LatLngLiteral;
  currentCenter: LatLngLiteral;
  playedSeconds: number;
  isEditingModeOn: boolean;
}

export const LiveMap: FC<LiveMapProps> = ({ waypoints, initialCenter, currentCenter, onMapMoved, isEditingModeOn }) => {
  const [map, setMap] = useState<LeafletMap | null>(null);
  const [isAutopanOn, setAutopanOn] = useState(true);
  const [isRoutePolylineOn, setRoutePolylineOn] = useState(true);
  const [isWaypointMarkersOn, setWaypointMarkersOn] = useState(false);
  const [isCrosshairOverlayOn, setCrosshairOverlayOn] = useState(true);

  const containerRef = useRef(null);

  useResizeObserver(containerRef, () => {
    if (map === null) return;
    map.invalidateSize();
  });

  useEffect(() => {
    if (map === null || !isAutopanOn) return;
    map.setView(currentCenter, undefined, { animate: true });
  }, [map, currentCenter, isAutopanOn]);

  return (
    <LiveMapContainer ref={containerRef}>
      <MapContainer
        center={initialCenter}
        zoom={17}
        style={{ height: "500px", width: "100%" }}
        whenCreated={(map) => {
          setMap(map);
        }}
      >
        <MapEventHandler onMapMoved={onMapMoved} />
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
          {isRoutePolylineOn && <Polyline color="purple" positions={waypoints.map((wp) => wp.p)} />}
          {isWaypointMarkersOn && waypoints.map((tc, idx) => <Marker position={tc.p} key={idx} />)}
        </AllWaypointsPane>
        <CurrentPositionPane name="current-position-pane">
          <Marker position={currentCenter} title="Current" />
        </CurrentPositionPane>
        {isEditingModeOn && isCrosshairOverlayOn && <CrosshairOverlay />}
      </MapContainer>
      <Panel>
        <CheckBox id="autopan" checkedState={[isAutopanOn, setAutopanOn]}>
          Auto-pan map to current position
        </CheckBox>
        <CheckBox id="waypoint-markers" checkedState={[isWaypointMarkersOn, setWaypointMarkersOn]}>
          Show markers for all waypoints
        </CheckBox>
        <CheckBox id="route-polyline" checkedState={[isRoutePolylineOn, setRoutePolylineOn]}>
          Show polyline for route
        </CheckBox>
        {isEditingModeOn && (
          <>
            <CheckBox id="crosshair-overlay" checkedState={[isCrosshairOverlayOn, setCrosshairOverlayOn]}>
              Show crosshair overlay for map center
            </CheckBox>
          </>
        )}
      </Panel>
    </LiveMapContainer>
  );
};

const LiveMapContainer = styled.div``;

const MapEventHandler: FC<{
  onMapMoved: (newCenter: LatLngLiteral) => void;
}> = ({ onMapMoved }) => {
  useMapEvent("moveend", (ev) => {
    const pos = (ev.target as LeafletMap).getCenter();
    onMapMoved(pos);
  });
  return null;
};

const BaseTileLayer = styled(TileLayer)`
  & img {
    filter: grayscale(0.7);
  }
`;

const AllWaypointsPane = styled(Pane)`
  z-index: 600;
  & img {
    filter: hue-rotate(90deg);
  }
`;

const CurrentPositionPane = styled(Pane)`
  z-index: 800;
`;

interface CheckBoxProps {
  id: string;
  checkedState: UseState<boolean>;
}
const CheckBox: FC<CheckBoxProps> = ({ id, checkedState: [isChecked, setChecked], children }) => (
  <label htmlFor={id} style={{ whiteSpace: "nowrap" }}>
    <input
      type="checkbox"
      id={id}
      checked={isChecked}
      onChange={(ev) => {
        setChecked(ev.target.checked);
      }}
    />{" "}
    {children}
  </label>
);

const crosshairColor = "#0077ff";
const CrosshairOverlay: FC = () => (
  <>
    <CrosshairOverlayItem
      style={{ left: 0, right: 0, top: "50%", bottom: "calc(50% - 1px)", borderTop: `1px solid ${crosshairColor}` }}
    />
    <CrosshairOverlayItem
      style={{ left: "50%", right: "calc(50% - 1px)", top: 0, bottom: 0, borderLeft: `1px solid ${crosshairColor}` }}
    />
  </>
);
const CrosshairOverlayItem = styled.div`
  position: absolute;
  z-index: 500;
`;
