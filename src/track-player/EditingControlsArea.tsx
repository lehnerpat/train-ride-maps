import { FC, memo, useEffect, useRef, useState } from "react";
import styled from "@emotion/styled";
import { Panel } from "../common/components/Panel";
import { SetState, usePickedState, UseState } from "../common/utils/state-utils";
import { TimingPoint, Track } from "../track-models";
import { Card, Stack } from "@mui/material";
import { EditingControlsAreaOptions } from "./ViewOptions";
import { TimingPointsList } from "./TimingPointsTable";
import { augmentUuid, HasUuid } from "../common/utils/uuid";

interface EditingControlsAreaProps {
  trackState: UseState<Track>;
  options: EditingControlsAreaOptions;
  playedSeconds: number;
  currentDistance: number | undefined;
  precedingTimingPointIndex: number;
  pathLengthMM: number;
}
export const EditingControlsArea: FC<EditingControlsAreaProps> = ({
  trackState,
  options,
  playedSeconds,
  currentDistance,
  precedingTimingPointIndex,
  pathLengthMM,
}) => {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingTpId, setEditingTpId] = useState<string | null>(null);
  const timingPointsState = usePickedState(trackState, "timingPoints");
  const [timingPoints, setTimingPoints] = timingPointsState;

  const isEditing = editingIndex !== null;

  useEffect(() => {
    if (editingTpId === null) {
      setEditingIndex(null);
      return;
    }
    const idx = timingPoints.findIndex((timingPoint) => timingPoint.uuid === editingTpId);
    setEditingIndex(idx >= 0 ? idx : null);
  }, [editingTpId, timingPoints]);

  return (
    <Stack spacing={2}>
      <Card raised>
        <VideoDataSection trackState={trackState} pathLengthMM={pathLengthMM} />
        <SectionHeading>
          {!isEditing ? "Add new timing point:" : `Editing timing point ${editingIndex}:`}
        </SectionHeading>
        <EditingArea
          timingPointsState={timingPointsState}
          timeSeconds={playedSeconds}
          distance={currentDistance}
          editingIndex={editingIndex}
          onClearEditing={() => setEditingTpId(null)}
        />
        {/* <SectionHeading>Timing points:</SectionHeading>
      <TimingPointList
        timingPoints={timingPoints}
        precedingTimingPointIndex={precedingTimingPointIndex}
        isStartEditingPossible={!isEditing}
        isAutoScrollOn={options.isAutoscrollTimingPointsListOn}
        editingIndex={editingIndex}
        onStartEditing={(index) => {
          setEditingIndex(index);
        }}
      /> */}
      </Card>

      <TimingPointsListMemo
        timingPoints={timingPoints}
        onEditTimingPoint={setEditingTpId}
        onDeleteTimingPoint={(tpId) => deleteTimingPointById(tpId, setTimingPoints)}
      />
    </Stack>
  );
};

const TimingPointsListMemo = memo(TimingPointsList);

const VideoDataSection: FC<{
  trackState: UseState<Track>;
  pathLengthMM: number;
}> = ({ trackState, pathLengthMM }) => (
  <VideoDataSectionContainer>
    <SectionHeading>Video Data:</SectionHeading>
    <VideoDataItemsGrid>
      <>
        <div>Title:</div>
        <div>{trackState[0].title}</div>
      </>
      <>
        <div>Path length:</div>
        <div>{formatDistanceMeters(pathLengthMM)}</div>
      </>
    </VideoDataItemsGrid>
  </VideoDataSectionContainer>
);
const VideoDataSectionContainer = styled.div``;
const VideoDataItemsGrid = styled.div`
  display: grid;
  margin: 0 10px;
  column-gap: 10px;
  row-gap: 4px;
  grid-template-columns: max-content auto;
`;

const SectionHeading = styled.h3`
  margin-left: 10px;
`;

const TimingPointsEditorContainer = styled(Panel)`
  padding: 0;
  margin-top: 0;
  display: flex;
  flex-direction: column;
  max-height: calc(100vh - 150px);
`;
interface EditingAreaProps extends InputFieldProps {
  timingPointsState: UseState<ReadonlyArray<TimingPoint & HasUuid>>;
  editingIndex: number | null;
  onClearEditing: () => void;
}
const EditingArea: FC<EditingAreaProps> = ({
  timeSeconds,
  distance,
  timingPointsState: [timingPoints, setTimingPoints],
  editingIndex,
  onClearEditing,
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
              onClearEditing();
              deleteTimingPoint(editingIndex, setTimingPoints);
            }}
          >
            Delete
          </button>
          <button disabled>Save</button>
          <button onClick={onClearEditing}>Cancel</button>
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
  timingPoints: ReadonlyArray<TimingPoint>;
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
  /* max-height: 600px; */
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

function addTimingPoint(newTimingPoint: TimingPoint, setTimingPoints: SetState<ReadonlyArray<TimingPoint & HasUuid>>) {
  setTimingPoints((oldTimingPoints) => {
    const timingPoints = [...oldTimingPoints];
    const newTimingPointWithId = augmentUuid(newTimingPoint);
    const newIdx = timingPoints.findIndex((wp) => wp.t > newTimingPointWithId.t);
    if (newIdx === -1) {
      timingPoints.push(newTimingPointWithId);
    } else {
      timingPoints.splice(newIdx, 0, newTimingPointWithId);
    }
    return timingPoints;
  });
}

function deleteTimingPoint(index: number, setTimingPoints: SetState<ReadonlyArray<TimingPoint & HasUuid>>) {
  setTimingPoints((oldTimingPoints) => {
    const timingPoints = [...oldTimingPoints];
    timingPoints.splice(index, 1);
    return timingPoints;
  });
}

function deleteTimingPointById(tpId: string, setTimingPoints: SetState<ReadonlyArray<TimingPoint & HasUuid>>) {
  setTimingPoints((oldTimingPoints) => {
    return oldTimingPoints.filter((tp) => tp.uuid !== tpId);
  });
}

function formatTimeSec(tSec: number): string {
  return tSec.toFixed(1) + "s";
}

function formatDistanceMeters(dMM: number): string {
  return (dMM / 1000).toFixed(3) + "m";
}
