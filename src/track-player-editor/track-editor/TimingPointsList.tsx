import { FC, useLayoutEffect, useRef } from "react";
import {
  Box,
  Card,
  IconButton,
  ListItem,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Stack,
  Typography,
} from "@mui/material";
import {
  AccessTime as JumpToTimeIcon,
  DeleteForever as DeleteIcon,
  MoreHoriz as MoreIcon,
  Place as JumpToLocationIcon,
} from "@mui/icons-material";
import ForwardIcon from "@mui/icons-material/Forward";
import { TimingPoint } from "../../track-models";
import { HasUuid } from "../../common/utils/uuid";
import { List, RowComponentProps, useListRef } from "react-window";
import PopupState, { bindTrigger, bindMenu } from "material-ui-popup-state";
import { formatDistanceMeters, formatTimeSec } from "./track-info-formatting";
import { Theme, lighten } from "@mui/material/styles";
import { TimingPointProgressState } from "../shared/usePlayerState";

interface TimingPointsListProps {
  timingPoints: ReadonlyArray<TimingPoint & HasUuid>;
  onDeleteTimingPoint: (uuid: string) => void;
  onJumpToTime: (timeSeconds: number) => void;
  onJumpToLocation: (distanceMM: number) => void;
  isAutoScrollOn: boolean;
  timingPointProgressState: TimingPointProgressState;
}

type RowData = Pick<
  TimingPointsListProps,
  | "timingPoints"
  | "onDeleteTimingPoint"
  | "onJumpToTime"
  | "onJumpToLocation"
  | "timingPointProgressState"
>;

const ROW_HEIGHT_PX = 34 as const;

export const TimingPointsList: FC<TimingPointsListProps> = (props) => {
  const {
    isAutoScrollOn,
    timingPoints,
    onDeleteTimingPoint,
    onJumpToTime,
    onJumpToLocation,
    timingPointProgressState,
  } = props;

  const precedingIndex = (() => {
    if (timingPointProgressState.type === "before-first") return -1;
    if (timingPointProgressState.type === "after-last") return timingPointProgressState.last.index;
    if (timingPointProgressState.type === "exactly-on") return timingPointProgressState.current.index;
    if (timingPointProgressState.type === "between") return timingPointProgressState.preceding.index;
    return -1;
  })();

  const listRef = useListRef(null);
  const prevPrecedingIndex = useRef(precedingIndex);

  useLayoutEffect(() => {
    const ref = listRef.current;
    if (!isAutoScrollOn || ref === null) return;

    const index = precedingIndex >= prevPrecedingIndex.current ? precedingIndex + 1 : precedingIndex;
    // scrollToRow throws a RangeError for out-of-range indexes
    if (index >= 0 && index < timingPoints.length) {
      ref.scrollToRow({ index, align: "smart" });
    }
    prevPrecedingIndex.current = precedingIndex;
  }, [precedingIndex, isAutoScrollOn, timingPoints.length, listRef]);

  return (
    <Card raised>
      <Typography variant="h6" sx={{ p: 2, pb: 0.5 }}>
        Timing Points:
      </Typography>
      <List
        style={{ height: 300, width: "100%", padding: `${ROW_HEIGHT_PX / 2}px 0` }}
        rowHeight={ROW_HEIGHT_PX}
        rowCount={timingPoints.length}
        overscanCount={5}
        rowComponent={ItemRenderer}
        rowProps={{
          timingPoints,
          onDeleteTimingPoint,
          onJumpToTime,
          onJumpToLocation,
          timingPointProgressState,
        }}
        listRef={listRef}
      />
    </Card>
  );
};

function ItemRenderer({
  index,
  style,
  ariaAttributes,
  timingPoints,
  onDeleteTimingPoint,
  onJumpToTime,
  onJumpToLocation,
  timingPointProgressState,
}: RowComponentProps<RowData>) {
  const timingPoint = timingPoints[index];
  const markerState = (() => {
    if (timingPointProgressState.type === "exactly-on" && timingPointProgressState.current.index === index)
      return "exactly-on";
    if (timingPointProgressState.type === "before-first" && index === 0) return "before";
    if (timingPointProgressState.type === "between" && timingPointProgressState.succeeding.index === index)
      return "before";
    if (timingPointProgressState.type === "after-last" && index === timingPoints.length - 1) return "after";
    return "none";
  })();
  const isHighlightedStrong =
    (timingPointProgressState.type === "exactly-on" && timingPointProgressState.current.index === index) ||
    (timingPointProgressState.type === "between" &&
      (timingPointProgressState.preceding.index === index || timingPointProgressState.succeeding.index === index)) ||
    (timingPointProgressState.type === "before-first" && index === 0) ||
    (timingPointProgressState.type === "after-last" && index === timingPoints.length - 1);
  const isHighlightedWeak =
    timingPointProgressState.type === "exactly-on" &&
    (timingPointProgressState.previous?.index === index || timingPointProgressState.next?.index === index);

  return (
    <ListItem
      {...ariaAttributes}
      style={style}
      component="div"
      disablePadding
      dense
      sx={[
        { pr: 1 },
        isHighlightedStrong &&
          ((theme: Theme) => ({
            backgroundColor: lighten(theme.palette.background.paper, 0.22),
            fontWeight: "bold",
          })),
        isHighlightedWeak &&
          ((theme: Theme) => ({
            backgroundColor: lighten(theme.palette.background.paper, 0.175),
            fontWeight: "bold",
          })),
      ]}
    >
      <TimingPointData timingPoint={timingPoint} markerState={markerState} />
      <TimingPointMenu
        timingPoint={timingPoint}
        onDeleteTimingPoint={onDeleteTimingPoint}
        onJumpToTime={onJumpToTime}
        onJumpToLocation={onJumpToLocation}
      />
    </ListItem>
  );
}

const TimingPointData: FC<{
  timingPoint: TimingPoint & HasUuid;
  markerState: "exactly-on" | "before" | "after" | "none";
}> = ({ timingPoint, markerState }) => (
  <Stack
    direction="row"
    spacing={0.5}
    sx={{ flexGrow: 1, pl: 0.5, pr: 1, fontFamily: "monospace", alignItems: "center" }}
  >
    <Box sx={{ display: "flex", alignItems: "center", minWidth: 20 }}>
      {markerState === "exactly-on" && <ForwardIcon fontSize="small" />}
      {markerState === "before" && (
        <ForwardIcon fontSize="small" style={{ transform: `translateY(-${ROW_HEIGHT_PX / 2}px)` }} />
      )}
      {markerState === "after" && (
        <ForwardIcon fontSize="small" style={{ transform: `translateY(${ROW_HEIGHT_PX / 2}px)` }} />
      )}
    </Box>
    <Box>t={formatTimeSec(timingPoint.t)}</Box>
    <Box sx={{ opacity: 0.6 }}>|</Box>
    <Box>d={formatDistanceMeters(timingPoint.d)}</Box>
  </Stack>
);

const TimingPointMenu: FC<{
  timingPoint: TimingPoint & HasUuid;
  onDeleteTimingPoint: (uuid: string) => void;
  onJumpToTime: (timeSeconds: number) => void;
  onJumpToLocation: (distanceMM: number) => void;
}> = ({ timingPoint, onDeleteTimingPoint, onJumpToTime, onJumpToLocation }) => (
  <PopupState variant="popover" popupId={`tp_menu_${timingPoint.uuid}`}>
    {(popupState) => {
      return (
        <>
          <IconButton size="small" title="Timing point actions" {...bindTrigger(popupState)}>
            <MoreIcon />
          </IconButton>
          <Menu {...bindMenu(popupState)}>
            <MenuItem
              onClick={() => {
                onJumpToTime(timingPoint.t);
                popupState.close();
              }}
              title={`Jump to time ${formatTimeSec(timingPoint.t)}`}
            >
              <ListItemIcon>
                <JumpToTimeIcon />
              </ListItemIcon>
              <ListItemText>Jump to time</ListItemText>
            </MenuItem>
            <MenuItem
              onClick={() => {
                onJumpToLocation(timingPoint.d);
                popupState.close();
              }}
              title={`Jump to location ${formatDistanceMeters(timingPoint.d)}`}
            >
              <ListItemIcon>
                <JumpToLocationIcon />
              </ListItemIcon>
              <ListItemText>Jump to location</ListItemText>
            </MenuItem>
            <MenuItem
              onClick={() => {
                onDeleteTimingPoint(timingPoint.uuid);
                popupState.close();
              }}
              title={`Delete timing point t=${formatTimeSec(timingPoint.t)} / d=${formatDistanceMeters(timingPoint.d)}`}
            >
              <ListItemIcon>
                <DeleteIcon />
              </ListItemIcon>
              <ListItemText>Delete</ListItemText>
            </MenuItem>
          </Menu>
        </>
      );
    }}
  </PopupState>
);
