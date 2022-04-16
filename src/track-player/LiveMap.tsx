import "./leaflet-setup";
import {
  LatLngLiteral,
  Map as LeafletMap,
  Polyline as LeafletPolyline,
  Control as LeafletControl,
  LatLng,
} from "leaflet";
import React, { createContext, FC, useEffect, useRef, useState } from "react";
import { CircleMarker, MapContainer, Marker, Pane, Polyline, TileLayer, useMapEvent } from "react-leaflet";
import CustomLeafletControl from "../common/components/CustomLeafletControl";
import styled from "styled-components";
import useResizeObserver from "@react-hook/resize-observer";
import { DefaultViewOptions, MapViewOptions } from "./ViewOptions";
import { SetState } from "../common/utils/state-utils";
import { closestPointOnPath } from "../geo/distance";

const LiveMapContext = createContext({ isEditingModeOn: false, viewOptions: DefaultViewOptions.mapViewOptions });

interface LiveMapProps {
  path: LatLngLiteral[];
  timingPointLocations: LatLngLiteral[];
  onMapMoved: (projection: { p: LatLngLiteral; precedingPathIndex: number } | undefined) => void;
  initialCenter: LatLngLiteral;
  currentCenter: LatLngLiteral;
  playedSeconds: number;
  isEditingModeOn: boolean;
  viewOptions: MapViewOptions;
}

export const LiveMap: FC<LiveMapProps> = ({
  path,
  timingPointLocations,
  initialCenter,
  currentCenter,
  onMapMoved,
  isEditingModeOn,
  viewOptions,
}) => {
  const [map, setMap] = useState<LeafletMap | null>(null);
  const [attributionHtml, setAttributionHtml] = useState("");
  const [projectedPoint, setProjectedPoint] = useState<LatLngLiteral>();

  const containerRef = useRef(null);
  const polylineRef = useRef(null);

  const { isAutopanOn } = viewOptions;

  useResizeObserver(containerRef, () => {
    if (map === null) return;
    map.invalidateSize();
  });

  useEffect(() => {
    if (map === null || !isAutopanOn) return;
    try {
      map.setView(currentCenter, undefined, { animate: true });
    } catch (e) {
      console.error("Error while auto-panning the map:", e);
    }
  }, [map, currentCenter, isAutopanOn]);

  return (
    <LiveMapContainer ref={containerRef}>
      <LiveMapContext.Provider value={{ isEditingModeOn, viewOptions }}>
        <MapContainer
          center={initialCenter}
          zoom={17}
          style={{ height: "100%", width: "100%" }}
          whenCreated={(map) => {
            setMap(map);
            setAttributionHtml(collectAttributions(map));
          }}
          attributionControl={false}
        >
          {isEditingModeOn && (
            <MapEventHandler
              onMapMoved={onMapMoved}
              polylineRef={polylineRef}
              setProjectedPoint={setProjectedPoint}
              path={path}
            />
          )}

          <OsmTileLayer />
          <OrmTileLayer />

          <TrackPathPane path={path} polylineRef={polylineRef} />
          <ProjectedPointPane projectedPoint={projectedPoint} mapCenter={map?.getCenter()} />
          <TimingPointsPane timingPointLocations={timingPointLocations} />
          <CurrentPositionPane currentCenter={currentCenter} />
          <CrosshairOverlay />

          <CustomLeafletControl position="bottomright" style={{ border: "none", margin: 0 }}>
            <CustomAttributionContainer>
              <CustomAttributionTextContainer>
                <div
                  className="leaflet-control-attribution leaflet-control"
                  dangerouslySetInnerHTML={{ __html: attributionHtml }}
                />
              </CustomAttributionTextContainer>
              <CustomAttributionGlyphContainer>©</CustomAttributionGlyphContainer>
            </CustomAttributionContainer>
          </CustomLeafletControl>
        </MapContainer>
      </LiveMapContext.Provider>
    </LiveMapContainer>
  );
};

const CustomAttributionGlyphContainer = styled.div``;

const CustomAttributionTextContainer = styled.div``;

const CustomAttributionContainer = styled.div`
  background: #ffffffcc;
  color: black;
  display: flex;
  gap: 10px;
  align-items: center;
  justify-content: center;
  padding: 6px 9px;
  min-width: 30px;
  border-radius: 15px;
  box-sizing: border-box;

  > ${CustomAttributionTextContainer} {
    display: none;
  }

  &:hover {
    > ${CustomAttributionTextContainer} {
      display: block;
    }
    > ${CustomAttributionGlyphContainer} {
      display: none;
    }
  }
`;

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
const OsmTileLayer = () => (
  <BaseTileLayer
    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    detectRetina
    minZoom={2}
    maxZoom={20}
    minNativeZoom={2}
    maxNativeZoom={18}
  />
);
const OrmTileLayer = () => (
  <TileLayer
    url="http://{s}.tiles.openrailwaymap.org/standard/{z}/{x}/{y}.png"
    attribution='<a href="https://www.openstreetmap.org/copyright">© OpenStreetMap contributors</a>, Style: <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA 2.0</a> <a href="http://www.openrailwaymap.org/">OpenRailwayMap</a> and OpenStreetMap'
    detectRetina
    minZoom={2}
    maxZoom={20}
    minNativeZoom={2}
    maxNativeZoom={18}
    tileSize={256}
  />
);

const TrackPathPane: FC<{ path: LatLngLiteral[]; polylineRef: React.MutableRefObject<null> }> = ({
  path,
  polylineRef,
}) => (
  <TrackPathPaneContainer name="track-path-pane">
    <LiveMapContext.Consumer>
      {({ isEditingModeOn, viewOptions: { isTrackPolylineOn, editingModeOptions } }) => (
        <>
          {isTrackPolylineOn && <Polyline color="purple" positions={path} ref={polylineRef} />}
          {isEditingModeOn &&
            editingModeOptions.isPathPointMarkersOn &&
            path.map((p, idx) => <CircleMarker center={p} radius={3} color="purple" fillOpacity={1} key={idx} />)}
        </>
      )}
    </LiveMapContext.Consumer>
  </TrackPathPaneContainer>
);

const TrackPathPaneContainer = styled(Pane)`
  z-index: 600;
`;

const ProjectedPointPane: FC<{ projectedPoint: LatLngLiteral | undefined; mapCenter: LatLng | undefined }> = ({
  projectedPoint,
  mapCenter,
}) => (
  <ProjectedPointPaneContainer name="projected-point-pane">
    <LiveMapContext.Consumer>
      {({ isEditingModeOn }) =>
        isEditingModeOn &&
        !!projectedPoint &&
        !!mapCenter && (
          <>
            <Polyline positions={[mapCenter, projectedPoint]} color="gray" dashArray={[4]} />
            <CircleMarker center={projectedPoint} radius={3} fillOpacity={1} color="#3388ff" />
          </>
        )
      }
    </LiveMapContext.Consumer>
  </ProjectedPointPaneContainer>
);

const ProjectedPointPaneContainer = styled(Pane)`
  z-index: 600;
`;

const TimingPointsPane: FC<{ timingPointLocations: LatLngLiteral[] }> = ({ timingPointLocations }) => (
  <TimingPointsPaneContainer name="timing-points-pane">
    <LiveMapContext.Consumer>
      {({ isEditingModeOn, viewOptions }) =>
        isEditingModeOn &&
        viewOptions.editingModeOptions.isTimingPointMarkersOn &&
        timingPointLocations.map((tp, idx) => <CircleMarker center={tp} color="green" radius={6} key={idx} />)
      }
    </LiveMapContext.Consumer>
  </TimingPointsPaneContainer>
);

const TimingPointsPaneContainer = styled(Pane)`
  z-index: 800;
`;

const CurrentPositionPane: FC<{ currentCenter: LatLngLiteral }> = ({ currentCenter }) => (
  <CurrentPositionPaneContainer name="current-position-pane">
    <Marker position={currentCenter} title="Current" />
  </CurrentPositionPaneContainer>
);
const CurrentPositionPaneContainer = styled(Pane)`
  z-index: 900;
`;

const crosshairColor = "#0077ff";
const CrosshairOverlay: FC = () => (
  <LiveMapContext.Consumer>
    {({ isEditingModeOn, viewOptions: { editingModeOptions } }) =>
      isEditingModeOn &&
      editingModeOptions.isCrosshairOverlayOn && (
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
      )
    }
  </LiveMapContext.Consumer>
);
const CrosshairOverlayItem = styled.div`
  position: absolute;
  z-index: 500;
`;

function collectAttributions(map: LeafletMap) {
  const prefix = new LeafletControl.Attribution().options.prefix;
  const layerAttributions: string[] = [];
  map.eachLayer((l) => {
    if (l.getAttribution) {
      const attribution = l.getAttribution();
      if (attribution) layerAttributions.push(attribution);
    }
  });
  const layerAttributionsHtml = layerAttributions.join(", ");
  const overallHtml = [prefix, layerAttributionsHtml].join(" | ");
  return overallHtml;
}
