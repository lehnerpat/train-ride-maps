import { FC } from "react";
import styled from "styled-components";
import { Checkbox } from "../common/components/Checkbox";
import { UseState, pickState } from "../common/utils/state-utils";

export interface MapViewOptions {
  isAutopanOn: boolean;
  isTrackPolylineOn: boolean;
  isAllTrackPointMarkersOn: boolean;
  isCrosshairOverlayOn: boolean;
}

export interface TrackPointsEditorOptions {
  isAutoscrollTrackPointsListOn: boolean;
}

export interface StraightRailsOverlayViewOptions {
  isOn: boolean;
  isEditing: boolean;
}

export interface ViewOptions {
  mapOverlayPosition: "top-left" | "top-right";
  mapViewOptions: MapViewOptions;
  trackPointsEditorOptions: TrackPointsEditorOptions;
  straightRailsOverlay: StraightRailsOverlayViewOptions;
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
  straightRailsOverlay: {
    isOn: false,
    isEditing: false,
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
  const straightRailsOverlayViewOptionsState = pickState(viewOptionsState, "straightRailsOverlay");

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
        <h4>Straight Rail Overlay</h4>
        <Checkbox id="straightRailsOverlay-isOn" checkedState={pickState(straightRailsOverlayViewOptionsState, "isOn")}>
          Show straight rail overlay
        </Checkbox>
        <button
          disabled={!straightRailsOverlayViewOptionsState[0].isOn}
          onClick={() => {
            straightRailsOverlayViewOptionsState[1]((prev) => ({ ...prev, isEditing: true }));
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
