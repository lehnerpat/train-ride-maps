import "./leaflet-setup";
import {
  LatLngLiteral,
  Map as LeafletMap,
  Polyline as LeafletPolyline,
  Control as LeafletControl,
  LatLng,
  DivIcon,
} from "leaflet";
import React, { createContext, FC, useCallback, useEffect, useRef, useState } from "react";
import { CircleMarker, MapContainer, Marker, Pane, Polyline, TileLayer, useMapEvent } from "react-leaflet";
import CustomLeafletControl from "../common/components/CustomLeafletControl";
import styled from "styled-components";
import { Theme, CSSObject } from "@mui/material/styles";
import useResizeObserver from "@react-hook/resize-observer";
import { DefaultViewOptions, MapViewOptions } from "./ViewOptions";
import { SetState, UseState } from "../common/utils/state-utils";
import { closestPointOnPath } from "../geo/distance";
import DraggableLines from "leaflet-draggable-lines";
import { LeafletContext } from "@react-leaflet/core";
import { Track } from "../track-models";
import { augmentUuid } from "../common/utils/uuid";
import { Button, ButtonGroup, ButtonProps } from "@mui/material";
import { Add as AddIcon, Remove as RemoveIcon, Timeline as TimelineIcon } from "@mui/icons-material";

const LiveMapContext = createContext({ isEditingModeOn: false, viewOptions: DefaultViewOptions.mapViewOptions });

interface LiveMapProps {
  trackState: UseState<Track>;
  path: ReadonlyArray<LatLngLiteral>;
  timingPointLocations: ReadonlyArray<LatLngLiteral>;
  onMapMoved: (projection: { p: LatLngLiteral; precedingPathIndex: number } | undefined) => void;
  initialCenter: LatLngLiteral;
  currentCenter: LatLngLiteral;
  playedSeconds: number;
  isEditingModeOn: boolean;
  viewOptions: MapViewOptions;
}

function createDragMarker(layer: LeafletPolyline, i: number, length: number) {
  const color = i === 0 ? "lime" : i === length - 1 ? "red" : "purple";
  return {
    icon: new DivIcon({
      html: `<svg width="12" height="12"><path stroke-width="0" fill="${color}" fill-opacity="1"  d="M0,6a6,6 0 1,0 12,0 a6,6 0 1,0 -12,0 "></path></svg>`,
      className: "",
      iconSize: [12, 12],
    }),
  };
}

export const LiveMap: FC<LiveMapProps> = ({
  trackState,
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

  const zoomIn = useCallback(() => map?.zoomIn(), [map]);
  const zoomOut = useCallback(() => map?.zoomOut(), [map]);

  return (
    <LiveMapContainer ref={containerRef}>
      <LiveMapContext.Provider value={{ isEditingModeOn, viewOptions }}>
        <MapContainer
          center={initialCenter}
          zoom={17}
          style={{ height: "100%", width: "100%" }}
          ref={useCallback((map: LeafletMap | null) => {
            if (map === null) return;
            setMap(map);
            setAttributionHtml(collectAttributions(map));
          }, [])}
          attributionControl={false}
          zoomControl={false}
        >
          {isEditingModeOn && (
            <MapEventHandler onMapMoved={onMapMoved} setProjectedPoint={setProjectedPoint} path={path} />
          )}

          <OsmTileLayer />
          <OrmTileLayer />

          {isEditingModeOn ? (
            <TrackPathPaneEditingMode trackState={trackState} path={path} />
          ) : (
            <TrackPathPaneViewingMode path={path} />
          )}
          <ProjectedPointPane projectedPoint={projectedPoint} mapCenter={map?.getCenter()} />
          <TimingPointsPane timingPointLocations={timingPointLocations} />
          <CurrentPositionPane currentCenter={currentCenter} />
          <CrosshairOverlay />

          <CustomLeafletControl position="topright" style={{ border: "none", margin: 0 }}>
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

          <CustomLeafletControl position="topleft">
            <ButtonGroup
              orientation="vertical"
              variant="contained"
              size="small"
              sx={{ "& .MuiButtonGroup-grouped.MuiButtonGroup-grouped": mapControlButtonMixin }}
            >
              <Button onClick={zoomIn}>
                <AddIcon />
              </Button>
              <Button onClick={zoomOut}>
                <RemoveIcon />
              </Button>
            </ButtonGroup>
          </CustomLeafletControl>
        </MapContainer>
      </LiveMapContext.Provider>
    </LiveMapContainer>
  );
};

const mapControlButtonMixin = (theme: Theme): CSSObject => ({
  minWidth: 0,
  padding: theme.spacing(0.5),
  color: theme.palette.getContrastText(theme.palette.grey[800]),
  backgroundColor: theme.palette.grey[800],
  borderColor: "currentColor",
  "&:hover": {
    backgroundColor: theme.palette.grey[700],
  },
});

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
  setProjectedPoint: SetState<LatLngLiteral | undefined>;
  path: ReadonlyArray<LatLngLiteral>;
}> = ({ onMapMoved, setProjectedPoint, path }) => {
  useMapEvent("moveend", (ev) => {
    const map = ev.target as LeafletMap;
    const pos = map.getCenter();
    const cp = closestPointOnPath(pos, path);
    setProjectedPoint(cp.closestOnPath);
    onMapMoved({ p: cp.closestOnPath, precedingPathIndex: cp.index1 });
  });
  return null;
};

const BaseTileLayer = styled(TileLayer)`
  & img {
    filter: grayscale(0.7);
  }
`;
const osmAttribution = `&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors`;
const OsmTileLayer = () => (
  <BaseTileLayer
    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
    attribution={osmAttribution}
    detectRetina
    minZoom={2}
    maxZoom={20}
    minNativeZoom={2}
    maxNativeZoom={18}
  />
);
const ormAttribution = `<a href="https://www.openstreetmap.org/copyright">© OpenStreetMap contributors</a>, Style: <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA 2.0</a> <a href="http://www.openrailwaymap.org/">OpenRailwayMap</a> and OpenStreetMap`;
const OrmTileLayer = () => (
  <TileLayer
    url="http://{s}.tiles.openrailwaymap.org/standard/{z}/{x}/{y}.png"
    attribution={ormAttribution}
    detectRetina
    minZoom={2}
    maxZoom={20}
    minNativeZoom={2}
    maxNativeZoom={18}
    tileSize={256}
  />
);

const TrackPathPaneViewingMode: FC<{ path: ReadonlyArray<LatLngLiteral> }> = ({ path }) => (
  <TrackPathPaneContainer name="track-path-pane-viewing-mode">
    <LiveMapContext.Consumer>
      {({ viewOptions: { isTrackPolylineOn } }) =>
        isTrackPolylineOn && <Polyline color="purple" positions={path as any /* TODO */} interactive={false} />
      }
    </LiveMapContext.Consumer>
  </TrackPathPaneContainer>
);

interface TrackPathPaneEditingModeProps {
  path: ReadonlyArray<LatLngLiteral>;
  trackState: UseState<Track>;
}

interface TrackPathPaneEditingModeState {
  isPathEditing: boolean;
}

class TrackPathPaneEditingMode extends React.Component<TrackPathPaneEditingModeProps, TrackPathPaneEditingModeState> {
  static contextType = LeafletContext;
  context!: NonNullable<React.ContextType<typeof LeafletContext>>;

  state: Readonly<TrackPathPaneEditingModeState> = {
    isPathEditing: false,
  };

  private draggableLines: DraggableLines | null = null;
  private polyline: LeafletPolyline | null = null;

  private saveTrackState() {
    this.props.trackState[1]((t) => ({
      ...t,
      path: (this.polyline!.getLatLngs() as LatLng[]).map((l: LatLng) => augmentUuid(l)),
    }));
  }

  componentDidMount() {
    const map = this.context.map;
    this.draggableLines = new DraggableLines(map, {
      enableForLayer: false,
      dragMarkerOptions: createDragMarker,
    });
    this.draggableLines.on("dragend insert remove", (ev) => {
      this.saveTrackState();
    });
    this.polyline = new LeafletPolyline(this.props.path as any /* TODO */, {
      color: "purple",
      interactive: true,
    }).addTo(map);
  }

  componentWillUnmount() {
    const map = this.context.map;
    if (!!this.polyline) {
      this.draggableLines?.disableForLayer(this.polyline);
      this.polyline?.removeFrom(map);
    }
    this.draggableLines?.disable();
    this.draggableLines = null;
    this.polyline = null;
  }

  render() {
    return (
      <TrackPathPaneContainer name="track-path-pane">
        <>
          <CustomLeafletControl position="topleft">
            <MapPushButton
              pushed={this.state.isPathEditing}
              onClick={this.onEditModeBtnClicked}
              title="Edit track geometry"
            >
              <TimelineIcon />
            </MapPushButton>
          </CustomLeafletControl>
        </>
      </TrackPathPaneContainer>
    );
  }

  private onEditModeBtnClicked = (ev: React.MouseEvent) => {
    ev.preventDefault();
    if (!this.draggableLines || !this.polyline) return;
    if (!this.state.isPathEditing) {
      this.draggableLines.enableForLayer(this.polyline);
      this.setState(() => ({ isPathEditing: true }));
    } else {
      this.draggableLines.disableForLayer(this.polyline);
      this.draggableLines.disable();
      this.setState(() => ({ isPathEditing: false }));
    }
  };
}

const pushedButtonMixin = (theme: Theme): CSSObject => ({
  backgroundColor: theme.palette.primary.dark,
  boxShadow: theme.shadows[8],
  "&:hover": {
    backgroundColor: theme.palette.primary.main,
  },
});

const MapPushButton: FC<Omit<ButtonProps, "variant" | "size"> & { pushed: boolean }> = ({
  pushed,
  sx,
  ...restProps
}) => (
  <Button
    variant="contained"
    size="small"
    sx={[mapControlButtonMixin, pushed && pushedButtonMixin, ...(Array.isArray(sx) ? sx : [sx])]}
    {...restProps}
  />
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
            <Polyline positions={[mapCenter, projectedPoint]} color="gray" dashArray={[4]} interactive={false} />
            <CircleMarker center={projectedPoint} radius={3} fillOpacity={1} color="#3388ff" interactive={false} />
          </>
        )
      }
    </LiveMapContext.Consumer>
  </ProjectedPointPaneContainer>
);

const ProjectedPointPaneContainer = styled(Pane)`
  z-index: 600;
`;

const TimingPointsPane: FC<{ timingPointLocations: ReadonlyArray<LatLngLiteral> }> = ({ timingPointLocations }) => (
  <TimingPointsPaneContainer name="timing-points-pane">
    <LiveMapContext.Consumer>
      {({ isEditingModeOn, viewOptions }) =>
        isEditingModeOn &&
        viewOptions.editingModeOptions.isTimingPointMarkersOn &&
        timingPointLocations.map((tp, idx) => (
          <CircleMarker key={idx} center={tp} color="green" radius={6} interactive={false} />
        ))
      }
    </LiveMapContext.Consumer>
  </TimingPointsPaneContainer>
);

const TimingPointsPaneContainer = styled(Pane)`
  z-index: 800;
`;

const CurrentPositionPane: FC<{ currentCenter: LatLngLiteral }> = ({ currentCenter }) => (
  <CurrentPositionPaneContainer name="current-position-pane">
    <Marker position={currentCenter} title="Current" interactive={false} />
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
  const layerAttributions: string[] = [osmAttribution, ormAttribution];
  const layerAttributionsHtml = layerAttributions.join(", ");
  const overallHtml = [prefix, layerAttributionsHtml].join(" | ");
  return overallHtml;
}
