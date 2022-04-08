import { LatLngLiteral, Map as LeafletMap, Point, Polyline as LeafletPolyline } from "leaflet";
import React, { FC, useEffect, useRef, useState } from "react";
import { MapContainer, Marker, Pane, Polyline, TileLayer, useMapEvent } from "react-leaflet";
import styled from "styled-components";
import useResizeObserver from "@react-hook/resize-observer";
import { MapViewOptions } from "./ViewOptions";
import { SetState } from "../common-components/state-utils";

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
  const [projectedPoint, setProjectedPoint] = useState<LatLngLiteral>();

  const containerRef = useRef(null);
  const polylineRef = useRef(null);

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
        <MapEventHandler onMapMoved={onMapMoved} polylineRef={polylineRef} setProjectedPoint={setProjectedPoint} />
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
          {isTrackPolylineOn && <Polyline color="purple" positions={path} ref={polylineRef} />}
          {isAllTrackPointMarkersOn && path.map((p, idx) => <Marker position={p} key={idx} />)}
          {!!projectedPoint && <Marker position={projectedPoint} />}
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
  polylineRef: React.MutableRefObject<null>;
  setProjectedPoint: SetState<LatLngLiteral | undefined>;
}> = ({ onMapMoved, polylineRef, setProjectedPoint }) => {
  useMapEvent("moveend", (ev) => {
    const map = ev.target as LeafletMap;
    const pos = map.getCenter();
    onMapMoved(pos);
    if (!!polylineRef.current) {
      const pl = polylineRef.current as LeafletPolyline;
      const mapCenterPoint = map.latLngToLayerPoint(pos);
      console.log("mapCenterPoint", mapCenterPoint);
      const closestOnLine = pl.closestLayerPoint(mapCenterPoint);
      const projectedPoint = map.layerPointToLatLng(closestOnLine);
      console.log("closestOnLine", closestOnLine, projectedPoint);
      setProjectedPoint(projectedPoint);
      // debugger;
    }
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
      style={{
        left: "calc(50% - 20px)",
        right: "calc(50% - 20px)",
        top: "50%",
        bottom: "calc(50% - 1px)",
        borderTop: `1px solid ${crosshairColor}`,
        transformOrigin: "center",
        transform: "rotate(45deg)",
      }}
    />
    <CrosshairOverlayItem
      style={{
        left: "50%",
        right: "calc(50% - 1px)",
        top: "calc(50% - 20px)",
        bottom: "calc(50% - 20px)",
        borderLeft: `1px solid ${crosshairColor}`,
        transformOrigin: "center",
        transform: "rotate(45deg)",
      }}
    />
  </>
);
const CrosshairOverlayItem = styled.div`
  position: absolute;
  z-index: 500;
`;
