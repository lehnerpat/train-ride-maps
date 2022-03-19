import { LatLngLiteral, Map as LeafletMap } from "leaflet";
import { FC, useEffect, useRef, useState } from "react";
import { Pane, TileLayer, useMapEvent } from "react-leaflet";
import styled from "styled-components";
import { TrackPoint } from "../track-models";
import useResizeObserver from "@react-hook/resize-observer";
import { RFeature, RLayerTileWebGL, RLayerVector, RMap, ROSMWebGL } from "rlayers";
import { fromLonLat } from "ol/proj";
import { Coordinate } from "ol/coordinate";
import { RAttribution, RZoom } from "rlayers/control";
import { LineString, MultiPoint, Point } from "ol/geom";
import { RCircle, RRegularShape, RStroke, RStyle } from "rlayers/style";
import { UseState } from "../common-components/state-utils";

function c(lll: LatLngLiteral): Coordinate {
  return fromLonLat([lll.lng, lll.lat]);
}

interface LiveMapProps {
  trackPoints: TrackPoint[];
  onMapMoved: (newCenter: LatLngLiteral) => void;
  initialCenter: LatLngLiteral;
  currentCenter: LatLngLiteral;
  playedSeconds: number;
  isEditingModeOn: boolean;
}

export const LiveMap: FC<LiveMapProps> = ({
  trackPoints,
  initialCenter,
  currentCenter,
  onMapMoved,
  isEditingModeOn,
}) => {
  // const [map, setMap] = useState<LeafletMap | null>(null);
  const [isAutopanOn, setAutopanOn] = useState(true);
  const [isTrackPolylineOn, setTrackPolylineOn] = useState(true);
  const [isTrackPointMarkersOn, setTrackPointMarkersOn] = useState(false);
  const [isCrosshairOverlayOn, setCrosshairOverlayOn] = useState(true);

  const containerRef = useRef(null);
  const mapRef = useRef<RMap>(null);

  // TODO
  useResizeObserver(containerRef, () => {
    const map = mapRef.current;
    if (map === null) return;
    map.ol.updateSize();
  });

  useEffect(() => {
    const map = mapRef.current;
    if (map === null || !isAutopanOn) return;
    map.ol.getView().animate({ center: c(currentCenter), duration: 50 });
  }, [mapRef, currentCenter, isAutopanOn]);

  return (
    <LiveMapContainer ref={containerRef}>
      <RMap height={"100%"} initial={{ center: c(initialCenter), zoom: 17 }} ref={mapRef} noDefaultControls>
        <ROSMWebGL />
        <RLayerTileWebGL
          url="http://{a-c}.tiles.openrailwaymap.org/standard/{z}/{x}/{y}.png"
          properties={{ crossOrigin: null, tilePixelRatio: 2 }}
          maxZoom={19}
          attributions={
            'Style: <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA 2.0</a> <a href="https://www.openrailwaymap.org/">OpenRailwayMap</a> and OpenStreetMap'
          }
        />
        <RLayerVector>
          {isTrackPolylineOn && (
            <RFeature geometry={new LineString(trackPoints.map((tp) => c(tp.p)))}>
              <RStyle>
                <RStroke color={"purple"} width={4} />
              </RStyle>
            </RFeature>
          )}
          {isTrackPointMarkersOn && (
            <RFeature geometry={new MultiPoint(trackPoints.map((tp) => c(tp.p)))}>
              <RStyle>
                <RCircle radius={4}>
                  <RStroke color={"blue"} width={2} />
                </RCircle>
              </RStyle>
            </RFeature>
          )}
          <RFeature geometry={new Point(c(currentCenter))}>
            <RStyle>
              <RRegularShape radius1={0} radius2={8} points={4}>
                <RStroke color={"purple"} width={2} />
              </RRegularShape>
            </RStyle>
          </RFeature>
        </RLayerVector>
        <RAttribution />
        <RZoom />
      </RMap>
      {/* <MapContainer
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
          {isTrackPolylineOn && <Polyline color="purple" positions={trackPoints.map((wp) => wp.p)} />}
          {isTrackPointMarkersOn && trackPoints.map((tc, idx) => <Marker position={tc.p} key={idx} />)}
        </AllTrackPointsPane>
        <CurrentPositionPane name="current-position-pane">
          <Marker position={currentCenter} title="Current" />
        </CurrentPositionPane>
        {isEditingModeOn && isCrosshairOverlayOn && <CrosshairOverlay />}
      </MapContainer> */}
      {/* <Panel>
        <CheckBox id="autopan" checkedState={[isAutopanOn, setAutopanOn]}>
          Auto-pan map to current position
        </CheckBox>
        <CheckBox id="trackPoint-markers" checkedState={[isTrackPointMarkersOn, setTrackPointMarkersOn]}>
          Show markers for all track points
        </CheckBox>
        <CheckBox id="track-polyline" checkedState={[isTrackPolylineOn, setTrackPolylineOn]}>
          Show polyline for track
        </CheckBox>
        {isEditingModeOn && (
          <>
            <CheckBox id="crosshair-overlay" checkedState={[isCrosshairOverlayOn, setCrosshairOverlayOn]}>
              Show crosshair overlay for map center
            </CheckBox>
          </>
        )}
      </Panel> */}
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
