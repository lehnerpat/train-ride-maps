import { LatLngLiteral } from "leaflet";
import { FC, useState } from "react";
import styled from "styled-components";
import { Panel } from "../common-components/Panel";
import { UseState } from "../common-components/UseState";
import { TrackPoint } from "../track-models";

interface WaypointsEditorProps {
  waypointsState: UseState<TrackPoint[]>;
  playedSeconds: number;
  mapCenter: LatLngLiteral | undefined;
  adjactedCoordinateIndex: [number | null, number | null];
}
export const WaypointsEditor: FC<WaypointsEditorProps> = ({
  waypointsState: [waypoints, setWaypoints],
  playedSeconds,
  mapCenter,
  adjactedCoordinateIndex,
}) => {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const isEditing = editingIndex !== null;

  return (
    <WaypointsEditorContainer>
      <h3 style={{ marginLeft: "15px" }}>{!isEditing ? "Add new waypoint:" : `Editing waypoint ${editingIndex}:`}</h3>
      <EditingArea
        waypointsState={[waypoints, setWaypoints]}
        timeSeconds={playedSeconds}
        position={mapCenter}
        editingIndexState={[editingIndex, setEditingIndex]}
      />
      <h3 style={{ marginLeft: "15px" }}>Waypoints:</h3>
      <WaypointList
        waypoints={waypoints}
        adjactedCoordinateIndex={adjactedCoordinateIndex}
        isStartEditingPossible={!isEditing}
        editingIndex={editingIndex}
        onStartEditing={(index) => {
          setEditingIndex(index);
        }}
      />
    </WaypointsEditorContainer>
  );
};
const WaypointsEditorContainer = styled(Panel)`
  padding: 0;
  margin-top: 0;
`;
interface EditingAreaProps extends InputFieldProps {
  waypointsState: UseState<TrackPoint[]>;
  editingIndexState: UseState<number | null>;
}
const EditingArea: FC<EditingAreaProps> = ({
  timeSeconds,
  position,
  waypointsState: [waypoints, setWaypoints],
  editingIndexState: [editingIndex, setEditingIndex],
}) => {
  const editingWaypoint = editingIndex !== null ? waypoints[editingIndex] : null;
  return (
    <EditingAreaContainer>
      <EditingInputFieldsGrid
        timeSeconds={editingWaypoint !== null ? editingWaypoint.t : timeSeconds}
        position={editingWaypoint !== null ? editingWaypoint.p : position}
      />
      <div style={{ textAlign: "right", fontSize: "70%" }}>Right-click the map to pick a coordinate</div>
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <button
          onClick={() => {
            if (typeof timeSeconds === "number" && typeof position === "object") {
              addWaypoint({ t: timeSeconds, p: position }, setWaypoints);
            }
          }}
        >
          Add new waypoint
        </button>
      </div>
      {editingIndex !== null && editingWaypoint !== null && (
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <button
            onClick={() => {
              setEditingIndex(null);
              deleteWaypoint(editingIndex, setWaypoints);
            }}
          >
            Delete
          </button>
          <button disabled>Save</button>
          <button
            onClick={() => {
              setEditingIndex(null);
            }}
          >
            Cancel
          </button>
        </div>
      )}
    </EditingAreaContainer>
  );
};
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
      <EditingInputField id="new-wp-lat" type="number" readOnly value={position?.lat || ""} />
    </>
    <>
      <EditingInputFieldLabel htmlFor="new-wp-lng">lng =</EditingInputFieldLabel>
      <EditingInputField id="new-wp-lng" type="number" readOnly value={position?.lng || ""} />
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
  waypoints: TrackPoint[];
  adjactedCoordinateIndex: [number | null, number | null];
  isStartEditingPossible: boolean;
  onStartEditing: (idx: number) => void;
  editingIndex: number | null;
}

const WaypointList: FC<WaypointListProps> = ({
  waypoints,
  adjactedCoordinateIndex,
  isStartEditingPossible,
  onStartEditing,
  editingIndex,
}) => (
  <WaypointListContainer>
    {waypoints.map((wp, idx) => {
      const prevNextClass =
        idx === adjactedCoordinateIndex[0] ? "previous" : idx === adjactedCoordinateIndex[1] ? "next" : "";
      const editingClass = idx === editingIndex ? "editing" : "";
      return (
        <WaypointListEntry
          key={idx}
          waypoint={wp}
          className={`${prevNextClass} ${editingClass}`}
          index={idx}
          isStartEditingPossible={isStartEditingPossible}
          onStartEditing={onStartEditing}
        />
      );
    })}
  </WaypointListContainer>
);
const WaypointListContainer = styled.div`
  max-height: 600px;
  overflow-y: auto;
`;

interface WaypointListEntryProps {
  waypoint: TrackPoint;
  className?: string;
  index: number;
  isStartEditingPossible: boolean;
  onStartEditing: (idx: number) => void;
}

const WaypointListEntry: FC<WaypointListEntryProps> = ({
  waypoint,
  className,
  index,
  isStartEditingPossible,
  onStartEditing,
}) => (
  <WaypointListEntryContainer>
    <WaypointListEntryInfoContainer>
      <div>{index}</div>
      <WaypointEditButton
        disabled={!isStartEditingPossible}
        title="Edit this waypoint"
        onClick={() => {
          if (isStartEditingPossible && typeof onStartEditing === "function") onStartEditing(index);
        }}
      >
        E
      </WaypointEditButton>
    </WaypointListEntryInfoContainer>
    <WaypointListEntryDataContainer className={className}>
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
    </WaypointListEntryDataContainer>
  </WaypointListEntryContainer>
);
const WaypointListEntryContainer = styled.div`
  display: flex;
  font-family: monospace;
  gap: 5px;
  margin: 5px 10px;
`;

const WaypointListEntryInfoContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 5px;
  align-items: center;
  justify-content: center;
`;
const WaypointEditButton = styled.button`
  color: #eee;
  background: #282828;
  border: 1px solid gray;
  &:hover {
    background: #333;
  }
  &[disabled] {
    opacity: 0.5;
  }
`;

const activeWaypointColor = "#678fd4";
const WaypointListEntryDataContainer = styled.div`
  border: 1px solid transparent;
  background: #333;
  display: grid;
  grid-template-columns: 3.2em auto;
  column-gap: 5px;
  flex-grow: 1;

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
  &.editing {
    background: #594a33;
  }
`;
const WaypointListEntryContainerLabel = styled.div`
  text-align: right;
`;

function addWaypoint(newWaypoint: TrackPoint, setWaypoints: React.Dispatch<React.SetStateAction<TrackPoint[]>>) {
  setWaypoints((oldWaypoints) => {
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

function deleteWaypoint(index: number, setWaypoints: React.Dispatch<React.SetStateAction<TrackPoint[]>>) {
  setWaypoints((oldWaypoints) => {
    const waypoints = [...oldWaypoints];
    waypoints.splice(index, 1);
    return waypoints;
  });
}
