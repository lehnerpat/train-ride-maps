import { LatLngLiteral, Map as LeafletMap } from "leaflet";
import { FC, useEffect, useRef, useState } from "react";
import { MapContainer, Marker, Pane, Polyline, TileLayer, useMapEvent } from "react-leaflet";
import styled from "styled-components";
import useResizeObserver from "@react-hook/resize-observer";
import { MapViewOptions } from "./ViewOptions";

interface LiveMapProps {
  path: LatLngLiteral[];
  onMapMoved: (newCenter: LatLngLiteral) => void;
  initialCenter: LatLngLiteral;
  currentCenter: LatLngLiteral;
  playedSeconds: number;
  isEditingModeOn: boolean;
  viewOptions: MapViewOptions;
}

export const LiveMap: FC<LiveMapProps> = ({
  path,
  initialCenter,
  currentCenter,
  onMapMoved,
  isEditingModeOn,
  viewOptions: { isAutopanOn, isAllTrackPointMarkersOn, isCrosshairOverlayOn, isTrackPolylineOn },
}) => {
  const [map, setMap] = useState<LeafletMap | null>(null);

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
        style={{ height: "100%", width: "100%" }}
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
        <AllTrackPointsPane name="all-trackPoints-pane">
          {isTrackPolylineOn && <Polyline color="purple" positions={path} />}
          {isAllTrackPointMarkersOn && path.map((p, idx) => <Marker position={p} key={idx} />)}
        </AllTrackPointsPane>
        <CurrentPositionPane name="current-position-pane">
          <Marker position={currentCenter} title="Current" />
        </CurrentPositionPane>
        {isEditingModeOn && isCrosshairOverlayOn && <CrosshairOverlay />}
      </MapContainer>
    </LiveMapContainer>
  );
};

const LiveMapContainer = styled.div`
  height: 100%;
`;

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

const AllTrackPointsPane = styled(Pane)`
  z-index: 600;
  & img {
    filter: hue-rotate(90deg);
  }
`;

const CurrentPositionPane = styled(Pane)`
  z-index: 800;
`;

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
