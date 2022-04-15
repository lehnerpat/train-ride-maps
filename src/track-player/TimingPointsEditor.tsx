import { FC, useEffect, useRef, useState } from "react";
import styled from "styled-components";
import { Panel } from "../common-components/Panel";
import { SetState, UseState } from "../common-components/state-utils";
import { TimingPoint } from "../track-models";

import { TrackPointsEditorOptions } from "./ViewOptions";

interface TimingPointsEditorProps {
  options: TrackPointsEditorOptions;
  timingPointsState: UseState<TimingPoint[]>;
  playedSeconds: number;
  currentDistance: number | undefined;
  precedingTimingPointIndex: number;
  pathLengthMM: number;
}
export const TimingPointsEditor: FC<TimingPointsEditorProps> = ({
  options,
  timingPointsState,
  playedSeconds,
  currentDistance,
  precedingTimingPointIndex,
  pathLengthMM,
}) => {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [timingPoints] = timingPointsState;

  const isEditing = editingIndex !== null;

  return (
    <TimingPointsEditorContainer>
      <SectionHeading>Video Data:</SectionHeading>
      <div style={{ margin: "0 10px" }}>Path length: {formatDistanceMeters(pathLengthMM)}</div>
      <SectionHeading>{!isEditing ? "Add new timing point:" : `Editing timing point ${editingIndex}:`}</SectionHeading>
      <EditingArea
        timingPointsState={timingPointsState}
        timeSeconds={playedSeconds}
        distance={currentDistance}
        editingIndexState={[editingIndex, setEditingIndex]}
      />
      <SectionHeading>Timing points:</SectionHeading>
      <TimingPointList
        timingPoints={timingPoints}
        precedingTimingPointIndex={precedingTimingPointIndex}
        isStartEditingPossible={!isEditing}
        isAutoScrollOn={options.isAutoscrollTrackPointsListOn}
        editingIndex={editingIndex}
        onStartEditing={(index) => {
          setEditingIndex(index);
        }}
      />
    </TimingPointsEditorContainer>
  );
};

const SectionHeading = styled.h3`
  margin-left: 15px;
`;

const TimingPointsEditorContainer = styled(Panel)`
  padding: 0;
  margin-top: 0;
`;
interface EditingAreaProps extends InputFieldProps {
  timingPointsState: UseState<TimingPoint[]>;
  editingIndexState: UseState<number | null>;
}
const EditingArea: FC<EditingAreaProps> = ({
  timeSeconds,
  distance,
  timingPointsState: [timingPoints, setTimingPoints],
  editingIndexState: [editingIndex, setEditingIndex],
}) => {
  const editingTimingPoint = editingIndex !== null ? timingPoints[editingIndex] : null;
  return (
    <EditingAreaContainer>
      <EditingInputFieldsGrid
        timeSeconds={editingTimingPoint !== null ? editingTimingPoint.t : timeSeconds}
        distance={editingTimingPoint !== null ? editingTimingPoint.d : distance}
      />
      <div style={{ textAlign: "right", fontSize: "70%" }}>Position map to choose distance</div>
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <button
          onClick={() => {
            if (typeof timeSeconds === "number" && typeof distance === "number") {
              addTimingPoint({ t: timeSeconds, d: distance }, setTimingPoints);
            }
          }}
        >
          Add new timing point
        </button>
      </div>
      {editingIndex !== null && editingTimingPoint !== null && (
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <button
            onClick={() => {
              setEditingIndex(null);
              deleteTimingPoint(editingIndex, setTimingPoints);
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
  distance: number | undefined;
}

const EditingInputFieldsGrid: FC<InputFieldProps> = ({ timeSeconds, distance }) => (
  <EditingInputFieldsGridContainer>
    <>
      <EditingInputFieldLabel htmlFor="new-wp-time">t =</EditingInputFieldLabel>
      <EditingInputField id="new-wp-time" type="text" readOnly value={formatTimeSec(timeSeconds)} />
    </>
    <>
      <EditingInputFieldLabel htmlFor="new-wp-distance">d =</EditingInputFieldLabel>
      <EditingInputField
        id="new-wp-distance"
        type="text"
        readOnly
        value={typeof distance === "number" ? formatDistanceMeters(distance) : "--"}
      />
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

interface TimingPointListProps {
  timingPoints: TimingPoint[];
  precedingTimingPointIndex: number;
  isStartEditingPossible: boolean;
  onStartEditing: (idx: number) => void;
  editingIndex: number | null;
  isAutoScrollOn: boolean;
}

const previousPointClassName = "previous";
const nextPointClassName = "next";
const TimingPointList: FC<TimingPointListProps> = ({
  timingPoints,
  precedingTimingPointIndex,
  isStartEditingPossible,
  onStartEditing,
  editingIndex,
  isAutoScrollOn,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ref = containerRef.current;
    if (!isAutoScrollOn || ref === null) return;
    const prevEntryEl = ref.querySelector<HTMLElement>(`.${previousPointClassName}`);
    const nextEntryEl = ref.querySelector<HTMLElement>(`.${nextPointClassName}`);

    const top = prevEntryEl?.offsetTop ?? nextEntryEl?.offsetTop ?? 0;
    const bottom =
      nextEntryEl !== null
        ? nextEntryEl.offsetTop + nextEntryEl.offsetHeight
        : prevEntryEl !== null
        ? prevEntryEl.offsetTop + prevEntryEl.offsetHeight
        : ref.scrollHeight;

    if (ref.scrollTop > top) {
      ref.scrollTo({ top, behavior: "smooth" });
    } else if (ref.scrollTop + ref.clientHeight < bottom) {
      ref.scrollTo({ top: bottom - ref.clientHeight, behavior: "smooth" });
    }
  }, [precedingTimingPointIndex, isAutoScrollOn]);

  return (
    <TimingPointListContainer ref={containerRef}>
      {timingPoints.map((tp, idx) => {
        const prevNextClass =
          idx === precedingTimingPointIndex
            ? previousPointClassName
            : idx === precedingTimingPointIndex + 1
            ? nextPointClassName
            : "";
        const editingClass = idx === editingIndex ? "editing" : "";
        return (
          <TimingPointListEntry
            key={idx}
            timingPoint={tp}
            className={`${prevNextClass} ${editingClass}`}
            index={idx}
            isStartEditingPossible={isStartEditingPossible}
            onStartEditing={onStartEditing}
          />
        );
      })}
    </TimingPointListContainer>
  );
};
const TimingPointListContainer = styled.div`
  max-height: 600px;
  overflow-y: auto;
  position: relative;
`;

interface TimingPointListEntryProps {
  timingPoint: TimingPoint;
  className?: string;
  index: number;
  isStartEditingPossible: boolean;
  onStartEditing: (idx: number) => void;
}

const TimingPointListEntry: FC<TimingPointListEntryProps> = ({
  timingPoint,
  className,
  index,
  isStartEditingPossible,
  onStartEditing,
}) => (
  <TimingPointListEntryContainer>
    <TimingPointListEntryInfoContainer>
      <div>{index}</div>
      <TimingPointEditButton
        disabled={!isStartEditingPossible}
        title="Edit this timingPoint"
        onClick={() => {
          if (isStartEditingPossible && typeof onStartEditing === "function") onStartEditing(index);
        }}
      >
        E
      </TimingPointEditButton>
    </TimingPointListEntryInfoContainer>
    <TimingPointListEntryDataContainer className={className}>
      <>
        <TimingPointListEntryContainerLabel>t =</TimingPointListEntryContainerLabel>
        <span>{formatTimeSec(timingPoint.t)}</span>
      </>
      <>
        <TimingPointListEntryContainerLabel>d =</TimingPointListEntryContainerLabel>
        <span>{formatDistanceMeters(timingPoint.d)}</span>
      </>
    </TimingPointListEntryDataContainer>
  </TimingPointListEntryContainer>
);
const TimingPointListEntryContainer = styled.div`
  display: flex;
  font-family: monospace;
  gap: 5px;
  margin: 5px 10px;
`;

const TimingPointListEntryInfoContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 5px;
  align-items: center;
  justify-content: center;
`;
const TimingPointEditButton = styled.button`
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

const activeTimingPointColor = "#678fd4";
const TimingPointListEntryDataContainer = styled.div`
  border: 1px solid transparent;
  background: #333;
  display: grid;
  grid-template-columns: 3.2em auto;
  column-gap: 5px;
  flex-grow: 1;

  &.${previousPointClassName}, &.${nextPointClassName} {
    border-left-color: ${activeTimingPointColor};
    border-right-color: ${activeTimingPointColor};
  }
  &.${previousPointClassName} {
    border-top-color: ${activeTimingPointColor};
  }
  &.${nextPointClassName} {
    border-bottom-color: ${activeTimingPointColor};
  }
  &.editing {
    background: #594a33;
  }
`;
const TimingPointListEntryContainerLabel = styled.div`
  text-align: right;
`;

function addTimingPoint(newTimingPoint: TimingPoint, setTimingPoints: SetState<TimingPoint[]>) {
  setTimingPoints((oldTimingPoints) => {
    const timingPoints = [...oldTimingPoints];
    const newIdx = timingPoints.findIndex((wp) => wp.t > newTimingPoint.t);
    if (newIdx === -1) {
      timingPoints.push(newTimingPoint);
    } else {
      timingPoints.splice(newIdx, 0, newTimingPoint);
    }
    return timingPoints;
  });
}

function deleteTimingPoint(index: number, setTimingPoints: SetState<TimingPoint[]>) {
  setTimingPoints((oldTimingPoints) => {
    const timingPoints = [...oldTimingPoints];
    timingPoints.splice(index, 1);
    return timingPoints;
  });
}

function formatTimeSec(tSec: number): string {
  return tSec.toFixed(1) + "s";
}

function formatDistanceMeters(dMM: number): string {
  return (dMM / 1000).toFixed(3) + "m";
}
