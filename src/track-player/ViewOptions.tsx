import { FC, ReactNode } from "react";
import { UseState, pickState } from "../common/utils/state-utils";
import { Box, Button, Card, FormControlLabel, Stack, Switch, Typography } from "@mui/material";

export interface MapViewOptions {
  isAutopanOn: boolean;
  isTrackPolylineOn: boolean;
  editingModeOptions: {
    isCrosshairOverlayOn: boolean;
    isTimingPointMarkersOn: boolean;
    isPathPointMarkersOn: boolean;
  };
}

export interface EditingControlsAreaOptions {
  isAutoscrollTimingPointsListOn: boolean;
}

export interface StraightRailsOverlayViewOptions {
  isOn: boolean;
  isEditing: boolean;
}

export interface ViewOptions {
  mapOverlayPosition: "top-left" | "top-right";
  mapViewOptions: MapViewOptions;
  trackPointsEditorOptions: EditingControlsAreaOptions;
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
    isAutoscrollTimingPointsListOn: true,
  },
  straightRailsOverlay: {
    isOn: false,
    isEditing: false,
  },
};

interface ToggleSwitchProps {
  id: string;
  checkedState: UseState<boolean>;
  children?: React.ReactNode;
}
export const ToggleSwitch: FC<ToggleSwitchProps> = ({ id, checkedState: [isChecked, setChecked], children }) => (
  <FormControlLabel
    control={
      <Switch
        checked={isChecked}
        onChange={(ev) => {
          setChecked(ev.target.checked);
        }}
      />
    }
    label={children}
  />
);

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
    <Card raised sx={{ p: 2 }}>
      <SectionHeading>Map Options</SectionHeading>
      <Stack>
        <ToggleSwitch
          id="mapOverlayPosition"
          checkedState={[
            mapOverlayPositionState[0] === "top-right",
            () => mapOverlayPositionState[1]((p) => (p === "top-left" ? "top-right" : "top-left")),
          ]}
        >
          Map overlay on top right (else top left)
        </ToggleSwitch>
        <ToggleSwitch id="isAutoPanOn" checkedState={pickState(mapViewOptionsState, "isAutopanOn")}>
          Auto-pan map to current position
        </ToggleSwitch>
        <ToggleSwitch id="isTrackPolylineOn" checkedState={pickState(mapViewOptionsState, "isTrackPolylineOn")}>
          Show track path
        </ToggleSwitch>
      </Stack>
      <SectionHeading>Map Options - Editing Mode</SectionHeading>
      <Stack>
        <ToggleSwitch
          id="isCrosshairOverlayOn"
          checkedState={pickState(mapViewEditingOptionsState, "isCrosshairOverlayOn")}
        >
          Show crosshair overlay for map center
        </ToggleSwitch>
        <ToggleSwitch
          id="isTimingPointMarkersOn"
          checkedState={pickState(mapViewEditingOptionsState, "isTimingPointMarkersOn")}
        >
          Show timing points on track path
        </ToggleSwitch>
        <ToggleSwitch
          id="isPathPointMarkersOn"
          checkedState={pickState(mapViewEditingOptionsState, "isPathPointMarkersOn")}
        >
          Show markers for all track path points
        </ToggleSwitch>
      </Stack>
      <SectionHeading>Track points editor options</SectionHeading>
      <Stack>
        <ToggleSwitch
          id="isAutoscrollTrackPointsListOn"
          checkedState={pickState(trackPointsEditorOptionsState, "isAutoscrollTimingPointsListOn")}
        >
          Auto-scroll track points list to current track points
        </ToggleSwitch>
      </Stack>
      <SectionHeading>Straight Rail Overlay</SectionHeading>
      <Stack>
        <Stack direction="row">
          <Box flexGrow={1}>
            <ToggleSwitch
              id="straightRailsOverlay-isOn"
              checkedState={pickState(straightRailsOverlayViewOptionsState, "isOn")}
            >
              Show straight rail overlay
            </ToggleSwitch>
          </Box>
          <Button
            variant="contained"
            disabled={!straightRailsOverlayViewOptionsState[0].isOn}
            onClick={() => {
              straightRailsOverlayViewOptionsState[1]((prev) => ({ ...prev, isEditing: true }));
              onCloseDialog();
            }}
          >
            Edit overlay
          </Button>
        </Stack>
      </Stack>
    </Card>
  );
};

const SectionHeading: FC<{ children: ReactNode }> = ({ children }) => (
  <Typography variant="h6" sx={{ "&:not(:first-child)": { mt: 1 } }}>
    {children}
  </Typography>
);
