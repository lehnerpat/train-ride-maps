import { LatLngLiteral } from "leaflet";
import { FC } from "react";
import styled from "styled-components";
import { Panel } from "../common-components/Panel";
import { UseState } from "../common-components/UseState";
import { Waypoint } from "../route-models";

interface WaypointsEditorProps {
  waypointsState: UseState<Waypoint[]>;
  playedSeconds: number;
  lastMapClickPosition: LatLngLiteral | undefined;
  adjactedCoordinateIndex: [number | null, number | null];
}
export const WaypointsEditor: FC<WaypointsEditorProps> = ({
  waypointsState: [waypoints, setWaypoints],
  playedSeconds,
  lastMapClickPosition,
  adjactedCoordinateIndex,
}) => (
  <WaypointsEditorContainer>
    <EditingArea setWaypoints={setWaypoints} timeSeconds={playedSeconds} position={lastMapClickPosition} />
    <h3 style={{ marginLeft: "15px" }}>Waypoints:</h3>
    <WaypointList waypoints={waypoints} adjactedCoordinateIndex={adjactedCoordinateIndex} />
  </WaypointsEditorContainer>
);
const WaypointsEditorContainer = styled(Panel)`
  padding: 0;
`;
interface WaypointSetterProp {
  setWaypoints: React.Dispatch<React.SetStateAction<Waypoint[]>>;
}
const EditingArea: FC<InputFieldProps & WaypointSetterProp> = ({ timeSeconds, position, setWaypoints }) => (
  <EditingAreaContainer>
    <EditingInputFieldsGrid timeSeconds={timeSeconds} position={position} />
    <div style={{ textAlign: "right", fontSize: "70%" }}>Right-click the map to pick a coordinate</div>
    <div style={{ display: "flex", justifyContent: "flex-end" }}>
      <button
        onClick={() => {
          if (typeof timeSeconds === "number" && typeof position === "object") {
            addWaypoint({ t: timeSeconds, p: position }, setWaypoints);
          }
        }}
      >
        Add waypoint
      </button>
    </div>
  </EditingAreaContainer>
);
const EditingAreaContainer = styled.div`
  margin: 5px 10px;
`;

interface InputFieldProps {
  timeSeconds: number;
  position: LatLngLiteral | undefined;
}

const EditingInputFieldsGrid: FC<InputFieldProps> = ({ timeSeconds, position }) => (
  <EditingInputFieldsGridContainer>
    <>
      <EditingInputFieldLabel htmlFor="new-wp-time">t =</EditingInputFieldLabel>
      <EditingInputField id="new-wp-time" type="number" readOnly value={timeSeconds} />
    </>
    <>
      <EditingInputFieldLabel htmlFor="new-wp-lat">lat =</EditingInputFieldLabel>
      <EditingInputField id="new-wp-lat" type="number" readOnly value={position?.lat} />
    </>
    <>
      <EditingInputFieldLabel htmlFor="new-wp-lng">lng =</EditingInputFieldLabel>
      <EditingInputField id="new-wp-lng" type="number" readOnly value={position?.lng} />
    </>
  </EditingInputFieldsGridContainer>
);
const EditingInputFieldsGridContainer = styled.div`
  display: grid;
  grid-template-columns: 3.2em auto;
  font-family: monospace;
  column-gap: 5px;
  align-items: center;
`;
const EditingInputFieldLabel = styled.label`
  text-align: right;
`;
const EditingInputField = styled.input`
  font-family: monospace;
  background: #333;
  color: #eee;
`;

interface WaypointListProps {
  waypoints: Waypoint[];
  adjactedCoordinateIndex: [number | null, number | null];
}

const WaypointList: FC<WaypointListProps> = ({ waypoints, adjactedCoordinateIndex }) => (
  <WaypointListContainer>
    {waypoints.map((wp, idx) => (
      <WaypointListEntry
        key={idx}
        waypoint={wp}
        className={idx === adjactedCoordinateIndex[0] ? "previous" : idx === adjactedCoordinateIndex[1] ? "next" : ""}
      />
    ))}
  </WaypointListContainer>
);
const WaypointListContainer = styled.div`
  max-height: 500px;
  overflow-y: auto;
`;

const WaypointListEntry: FC<{ waypoint: Waypoint; className?: string }> = ({ waypoint, className }) => (
  <WaypointListEntryContainer className={className}>
    <>
      <WaypointListEntryContainerLabel>t =</WaypointListEntryContainerLabel>
      <span>{waypoint.t}s</span>
    </>
    <>
      <WaypointListEntryContainerLabel>lat =</WaypointListEntryContainerLabel>
      <span>{waypoint.p.lat}</span>
    </>
    <>
      <WaypointListEntryContainerLabel>lng =</WaypointListEntryContainerLabel>
      <span>{waypoint.p.lng}</span>
    </>
  </WaypointListEntryContainer>
);

const activeWaypointColor = "#678fd4";
const WaypointListEntryContainer = styled.div`
  border: 1px solid transparent;
  background: #333;
  margin: 5px 10px;
  display: grid;
  grid-template-columns: 3.2em auto;
  column-gap: 5px;
  font-family: monospace;

  &.previous,
  &.next {
    border-left-color: ${activeWaypointColor};
    border-right-color: ${activeWaypointColor};
  }
  &.previous {
    border-top-color: ${activeWaypointColor};
  }
  &.next {
    border-bottom-color: ${activeWaypointColor};
  }
`;
const WaypointListEntryContainerLabel = styled.div`
  text-align: right;
`;

function addWaypoint(newWaypoint: Waypoint, setRoute: React.Dispatch<React.SetStateAction<Waypoint[]>>) {
  setRoute((oldWaypoints) => {
    const waypoints = [...oldWaypoints];
    const newIdx = waypoints.findIndex((wp) => wp.t > newWaypoint.t);
    if (newIdx === -1) {
      waypoints.push(newWaypoint);
    } else {
      waypoints.splice(newIdx, 0, newWaypoint);
    }
    return waypoints;
  });
}
