import { LatLngLiteral } from "leaflet";
import { FC, useState } from "react";
import styled from "styled-components";
import { Panel } from "../common-components/Panel";
import { SetState, UseState } from "../common-components/UseState";
import { TrackPoint } from "../track-models";

interface TrackPointsEditorProps {
  trackPointsState: UseState<TrackPoint[]>;
  playedSeconds: number;
  mapCenter: LatLngLiteral | undefined;
  adjactedCoordinateIndex: [number | null, number | null];
}
export const TrackPointsEditor: FC<TrackPointsEditorProps> = ({
  trackPointsState: [trackPoints, setTrackPoints],
  playedSeconds,
  mapCenter,
  adjactedCoordinateIndex,
}) => {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const isEditing = editingIndex !== null;

  return (
    <TrackPointsEditorContainer>
      <h3 style={{ marginLeft: "15px" }}>
        {!isEditing ? "Add new track point:" : `Editing track point ${editingIndex}:`}
      </h3>
      <EditingArea
        trackPointsState={[trackPoints, setTrackPoints]}
        timeSeconds={playedSeconds}
        position={mapCenter}
        editingIndexState={[editingIndex, setEditingIndex]}
      />
      <h3 style={{ marginLeft: "15px" }}>Track points:</h3>
      <TrackPointList
        trackPoints={trackPoints}
        adjactedCoordinateIndex={adjactedCoordinateIndex}
        isStartEditingPossible={!isEditing}
        editingIndex={editingIndex}
        onStartEditing={(index) => {
          setEditingIndex(index);
        }}
      />
    </TrackPointsEditorContainer>
  );
};
const TrackPointsEditorContainer = styled(Panel)`
  padding: 0;
  margin-top: 0;
`;
interface EditingAreaProps extends InputFieldProps {
  trackPointsState: UseState<TrackPoint[]>;
  editingIndexState: UseState<number | null>;
}
const EditingArea: FC<EditingAreaProps> = ({
  timeSeconds,
  position,
  trackPointsState: [trackPoints, setTrackPoints],
  editingIndexState: [editingIndex, setEditingIndex],
}) => {
  const editingTrackPoint = editingIndex !== null ? trackPoints[editingIndex] : null;
  return (
    <EditingAreaContainer>
      <EditingInputFieldsGrid
        timeSeconds={editingTrackPoint !== null ? editingTrackPoint.t : timeSeconds}
        position={editingTrackPoint !== null ? editingTrackPoint.p : position}
      />
      <div style={{ textAlign: "right", fontSize: "70%" }}>Position map to choose coordinate</div>
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <button
          onClick={() => {
            if (typeof timeSeconds === "number" && typeof position === "object") {
              addTrackPoint({ t: timeSeconds, p: position }, setTrackPoints);
            }
          }}
        >
          Add new track point
        </button>
      </div>
      {editingIndex !== null && editingTrackPoint !== null && (
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <button
            onClick={() => {
              setEditingIndex(null);
              deleteTrackPoint(editingIndex, setTrackPoints);
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

interface TrackPointListProps {
  trackPoints: TrackPoint[];
  adjactedCoordinateIndex: [number | null, number | null];
  isStartEditingPossible: boolean;
  onStartEditing: (idx: number) => void;
  editingIndex: number | null;
}

const TrackPointList: FC<TrackPointListProps> = ({
  trackPoints,
  adjactedCoordinateIndex,
  isStartEditingPossible,
  onStartEditing,
  editingIndex,
}) => (
  <TrackPointListContainer>
    {trackPoints.map((wp, idx) => {
      const prevNextClass =
        idx === adjactedCoordinateIndex[0] ? "previous" : idx === adjactedCoordinateIndex[1] ? "next" : "";
      const editingClass = idx === editingIndex ? "editing" : "";
      return (
        <TrackPointListEntry
          key={idx}
          trackPoint={wp}
          className={`${prevNextClass} ${editingClass}`}
          index={idx}
          isStartEditingPossible={isStartEditingPossible}
          onStartEditing={onStartEditing}
        />
      );
    })}
  </TrackPointListContainer>
);
const TrackPointListContainer = styled.div`
  max-height: 600px;
  overflow-y: auto;
`;

interface TrackPointListEntryProps {
  trackPoint: TrackPoint;
  className?: string;
  index: number;
  isStartEditingPossible: boolean;
  onStartEditing: (idx: number) => void;
}

const TrackPointListEntry: FC<TrackPointListEntryProps> = ({
  trackPoint,
  className,
  index,
  isStartEditingPossible,
  onStartEditing,
}) => (
  <TrackPointListEntryContainer>
    <TrackPointListEntryInfoContainer>
      <div>{index}</div>
      <TrackPointEditButton
        disabled={!isStartEditingPossible}
        title="Edit this trackPoint"
        onClick={() => {
          if (isStartEditingPossible && typeof onStartEditing === "function") onStartEditing(index);
        }}
      >
        E
      </TrackPointEditButton>
    </TrackPointListEntryInfoContainer>
    <TrackPointListEntryDataContainer className={className}>
      <>
        <TrackPointListEntryContainerLabel>t =</TrackPointListEntryContainerLabel>
        <span>{trackPoint.t}s</span>
      </>
      <>
        <TrackPointListEntryContainerLabel>lat =</TrackPointListEntryContainerLabel>
        <span>{trackPoint.p.lat}</span>
      </>
      <>
        <TrackPointListEntryContainerLabel>lng =</TrackPointListEntryContainerLabel>
        <span>{trackPoint.p.lng}</span>
      </>
    </TrackPointListEntryDataContainer>
  </TrackPointListEntryContainer>
);
const TrackPointListEntryContainer = styled.div`
  display: flex;
  font-family: monospace;
  gap: 5px;
  margin: 5px 10px;
`;

const TrackPointListEntryInfoContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 5px;
  align-items: center;
  justify-content: center;
`;
const TrackPointEditButton = styled.button`
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

const activeTrackPointColor = "#678fd4";
const TrackPointListEntryDataContainer = styled.div`
  border: 1px solid transparent;
  background: #333;
  display: grid;
  grid-template-columns: 3.2em auto;
  column-gap: 5px;
  flex-grow: 1;

  &.previous,
  &.next {
    border-left-color: ${activeTrackPointColor};
    border-right-color: ${activeTrackPointColor};
  }
  &.previous {
    border-top-color: ${activeTrackPointColor};
  }
  &.next {
    border-bottom-color: ${activeTrackPointColor};
  }
  &.editing {
    background: #594a33;
  }
`;
const TrackPointListEntryContainerLabel = styled.div`
  text-align: right;
`;

function addTrackPoint(newTrackPoint: TrackPoint, setTrackPoints: SetState<TrackPoint[]>) {
  setTrackPoints((oldTrackPoints) => {
    const trackPoints = [...oldTrackPoints];
    const newIdx = trackPoints.findIndex((wp) => wp.t > newTrackPoint.t);
    if (newIdx === -1) {
      trackPoints.push(newTrackPoint);
    } else {
      trackPoints.splice(newIdx, 0, newTrackPoint);
    }
    return trackPoints;
  });
}

function deleteTrackPoint(index: number, setTrackPoints: SetState<TrackPoint[]>) {
  setTrackPoints((oldTrackPoints) => {
    const trackPoints = [...oldTrackPoints];
    trackPoints.splice(index, 1);
    return trackPoints;
  });
}
