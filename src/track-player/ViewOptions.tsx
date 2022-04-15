import { FC } from "react";
import styled from "styled-components";
import { Checkbox } from "../common/components/Checkbox";
import { UseState, pickState } from "../common/utils/state-utils";

export interface MapViewOptions {
  isAutopanOn: boolean;
  isTrackPolylineOn: boolean;
  editingModeOptions: {
    isCrosshairOverlayOn: boolean;
    isTimingPointMarkersOn: boolean;
    isPathPointMarkersOn: boolean;
  };
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
    editingModeOptions: {
      isCrosshairOverlayOn: true,
      isTimingPointMarkersOn: true,
      isPathPointMarkersOn: false,
    },
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
  const mapViewEditingOptionsState = pickState(mapViewOptionsState, "editingModeOptions");
  const trackPointsEditorOptionsState = pickState(viewOptionsState, "trackPointsEditorOptions");
  const straightRailsOverlayViewOptionsState = pickState(viewOptionsState, "straightRailsOverlay");

  return (
    <ViewOptionsDialogContainer>
      <SectionHeading style={{ marginTop: 0 }}>Map Options</SectionHeading>
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
        <Checkbox id="isTrackPolylineOn" checkedState={pickState(mapViewOptionsState, "isTrackPolylineOn")}>
          Show track path
        </Checkbox>
      </CheckboxListContainer>
      <SectionHeading>Map Options - Editing Mode</SectionHeading>
      <CheckboxListContainer>
        <Checkbox
          id="isCrosshairOverlayOn"
          checkedState={pickState(mapViewEditingOptionsState, "isCrosshairOverlayOn")}
        >
          Show crosshair overlay for map center
        </Checkbox>
        <Checkbox
          id="isTimingPointMarkersOn"
          checkedState={pickState(mapViewEditingOptionsState, "isTimingPointMarkersOn")}
        >
          Show timing points on track path
        </Checkbox>
        <Checkbox
          id="isPathPointMarkersOn"
          checkedState={pickState(mapViewEditingOptionsState, "isPathPointMarkersOn")}
        >
          Show markers for all track path points
        </Checkbox>
      </CheckboxListContainer>
      <SectionHeading>Track points editor options</SectionHeading>
      <CheckboxListContainer>
        <Checkbox
          id="isAutoscrollTrackPointsListOn"
          checkedState={pickState(trackPointsEditorOptionsState, "isAutoscrollTrackPointsListOn")}
        >
          Auto-scroll track points list to current track points
        </Checkbox>
      </CheckboxListContainer>
      <SectionHeading>Straight Rail Overlay</SectionHeading>
      <CheckboxListContainer>
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

const SectionHeading = styled.h4`
  margin-bottom: 5px;
`;
