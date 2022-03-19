import { FC } from "react";
import styled from "styled-components";
import { Checkbox } from "../common-components/Checkbox";
import { UseState, pickState } from "../common-components/state-utils";

export interface MapViewOptions {
  isAutopanOn: boolean;
  isTrackPolylineOn: boolean;
  isAllTrackPointMarkersOn: boolean;
  isCrosshairOverlayOn: boolean;
}

export interface TrackPointsEditorOptions {
  isAutoscrollTrackPointsListOn: boolean;
}

export interface StraightTrackOverlayOptions {
  isOn: boolean;
  isEditing: boolean;
  line1LeftPercent: number;
  line1RotateDeg: number;
  line2LeftPercent: number;
  line2RotateDeg: number;
}

export interface ViewOptions {
  mapOverlayPosition: "top-left" | "top-right";
  mapViewOptions: MapViewOptions;
  trackPointsEditorOptions: TrackPointsEditorOptions;
  straightTrackOverlayOptions: StraightTrackOverlayOptions;
}

export const DefaultViewOptions: ViewOptions = {
  mapOverlayPosition: "top-right",
  mapViewOptions: {
    isAutopanOn: true,
    isTrackPolylineOn: true,
    isAllTrackPointMarkersOn: false,
    isCrosshairOverlayOn: true,
  },
  trackPointsEditorOptions: {
    isAutoscrollTrackPointsListOn: true,
  },
  straightTrackOverlayOptions: {
    isOn: false,
    isEditing: false,
    line1LeftPercent: 30,
    line1RotateDeg: 5,
    line2LeftPercent: 40,
    line2RotateDeg: -5,
  },
};

interface ViewOptionsDialogProps {
  viewOptionsState: UseState<ViewOptions>;
  onCloseDialog: () => void;
}
export const ViewOptionsDialog: FC<ViewOptionsDialogProps> = ({ viewOptionsState, onCloseDialog }) => {
  const mapOverlayPositionState = pickState(viewOptionsState, "mapOverlayPosition");
  const mapViewOptionsState = pickState(viewOptionsState, "mapViewOptions");
  const trackPointsEditorOptionsState = pickState(viewOptionsState, "trackPointsEditorOptions");
  const straightTrackOverlayOptionsState = pickState(viewOptionsState, "straightTrackOverlayOptions");

  return (
    <ViewOptionsDialogContainer>
      <h3 style={{ marginTop: 0 }}>Map Options</h3>
      <CheckboxListContainer>
        <Checkbox
          id="mapOverlayPosition"
          checkedState={[
            mapOverlayPositionState[0] === "top-right",
            () => mapOverlayPositionState[1]((p) => (p === "top-left" ? "top-right" : "top-left")),
          ]}
        >
          Map overlay on top right (else top left)
        </Checkbox>
        <Checkbox id="isAutoPanOn" checkedState={pickState(mapViewOptionsState, "isAutopanOn")}>
          Auto-pan map to current position
        </Checkbox>
        <Checkbox
          id="isAllTrackPointMarkersOn"
          checkedState={pickState(mapViewOptionsState, "isAllTrackPointMarkersOn")}
        >
          Show markers for all track points
        </Checkbox>
        <Checkbox id="isTrackPolylineOn" checkedState={pickState(mapViewOptionsState, "isTrackPolylineOn")}>
          Show polyline for track
        </Checkbox>
        <Checkbox id="isCrosshairOverlayOn" checkedState={pickState(mapViewOptionsState, "isCrosshairOverlayOn")}>
          Show crosshair overlay for map center (only in editing mode)
        </Checkbox>
      </CheckboxListContainer>
      <h3>Track points editor options</h3>
      <CheckboxListContainer>
        <Checkbox
          id="isAutoscrollTrackPointsListOn"
          checkedState={pickState(trackPointsEditorOptionsState, "isAutoscrollTrackPointsListOn")}
        >
          Auto-scroll track points list to current track points
        </Checkbox>
        <h4>Straight Track Overlay</h4>
        <Checkbox id="straightTrackOverlay-isOn" checkedState={pickState(straightTrackOverlayOptionsState, "isOn")}>
          Show straight track overlay
        </Checkbox>
        <button
          disabled={!straightTrackOverlayOptionsState[0].isOn}
          onClick={() => {
            straightTrackOverlayOptionsState[1]((prev) => ({ ...prev, isEditing: true }));
            onCloseDialog();
          }}
        >
          Edit overlay lines
        </button>
      </CheckboxListContainer>
    </ViewOptionsDialogContainer>
  );
};

const ViewOptionsDialogContainer = styled.div`
  position: absolute;
  top: 30px;
  right: 0;
  background: #333;
  border: 2px solid gray;
  border-radius: 3px;
  padding: 0.5em 1em;
  max-width: min(100%, 300px);
  z-index: 2000;
`;

const CheckboxListContainer = styled.div`
  display: flex;
  flex-direction: column;
`;
