import { LatLngLiteral, Map as LeafletMap, Polyline as LeafletPolyline } from "leaflet";
import React, { FC, useEffect, useRef, useState } from "react";
import { CircleMarker, MapContainer, Marker, Pane, Polyline, TileLayer, useMapEvent } from "react-leaflet";
import styled from "styled-components";
import useResizeObserver from "@react-hook/resize-observer";
import { MapViewOptions } from "./ViewOptions";
import { SetState } from "../common-components/state-utils";
import { closestPointOnPath } from "../geo/distance";

interface LiveMapProps {
  path: LatLngLiteral[];
  onMapMoved: (projection: { p: LatLngLiteral; precedingPathIndex: number } | undefined) => void;
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
        {isEditingModeOn && (
          <MapEventHandler
            onMapMoved={onMapMoved}
            polylineRef={polylineRef}
            setProjectedPoint={setProjectedPoint}
            path={path}
          />
        )}
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
          {isEditingModeOn && !!projectedPoint && !!map && (
            <>
              <Polyline positions={[map.getCenter(), projectedPoint]} color="gray" dashArray={[4]} />
              <CircleMarker center={projectedPoint} radius={3} fillOpacity={1} color="#3388ff" />
            </>
          )}
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
  onMapMoved: (projection: { p: LatLngLiteral; precedingPathIndex: number } | undefined) => void;
  polylineRef: React.MutableRefObject<null>;
  setProjectedPoint: SetState<LatLngLiteral | undefined>;
  path: LatLngLiteral[];
}> = ({ onMapMoved, polylineRef, setProjectedPoint, path }) => {
  useMapEvent("moveend", (ev) => {
    const map = ev.target as LeafletMap;
    const pos = map.getCenter();
    if (!!polylineRef.current) {
      const pl = polylineRef.current as LeafletPolyline;
      const mapCenterPoint = map.latLngToLayerPoint(pos);
      const cp = closestPointOnPath(pos, path);
      // Note: closestLayerPoint() returns null sometimes (e.g. if no part of the path is visible), even though typings don't reflect this
      const closestOnLine = pl.closestLayerPoint(mapCenterPoint);
      const projectedPoint = closestOnLine === null ? undefined : map.layerPointToLatLng(closestOnLine);
      console.table({
        lat: {
          custom: cp.closestOnPath.lat,
          leaflet: projectedPoint?.lat,
          delta: !!projectedPoint && cp.closestOnPath.lat - projectedPoint.lat,
        },
        lng: {
          custom: cp.closestOnPath.lng,
          leaflet: projectedPoint?.lng,
          delta: !!projectedPoint && cp.closestOnPath.lng - projectedPoint.lng,
        },
      });
      setProjectedPoint(cp.closestOnPath);
      onMapMoved({ p: cp.closestOnPath, precedingPathIndex: cp.index1 });
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
