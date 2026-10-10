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
import { TimingPoint } from "../track-models";
import { HasUuid } from "../common/utils/uuid";
import { List, RowComponentProps, useListRef } from "react-window";
import PopupState, { bindTrigger, bindMenu } from "material-ui-popup-state";
import { formatDistanceMeters, formatTimeSec } from "./track-info-formatting";
import { Theme, lighten } from "@mui/material/styles";

interface TimingPointsListProps {
  timingPoints: ReadonlyArray<TimingPoint & HasUuid>;
  onDeleteTimingPoint: (uuid: string) => void;
  onJumpToTime: (timeSeconds: number) => void;
  onJumpToLocation: (distanceMM: number) => void;
  precedingIndex: number;
  isAutoScrollOn: boolean;
}

type RowData = Pick<
  TimingPointsListProps,
  "timingPoints" | "onDeleteTimingPoint" | "onJumpToTime" | "onJumpToLocation" | "precedingIndex"
>;

export const TimingPointsList: FC<TimingPointsListProps> = (props) => {
  const { isAutoScrollOn, precedingIndex, timingPoints, onDeleteTimingPoint, onJumpToTime, onJumpToLocation } =
    props;
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
      <Typography variant="h6" sx={{ p: 2 }}>
        Timing Points:
      </Typography>
      <List
        style={{ height: 300, width: "100%" }}
        rowHeight={34}
        rowCount={timingPoints.length}
        overscanCount={5}
        rowComponent={ItemRenderer}
        rowProps={{ timingPoints, onDeleteTimingPoint, onJumpToTime, onJumpToLocation, precedingIndex }}
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
  precedingIndex,
}: RowComponentProps<RowData>) {
  const timingPoint = timingPoints[index];
  const isCurrent = index === precedingIndex || index === precedingIndex + 1;

  return (
    <ListItem
      {...ariaAttributes}
      style={style}
      component="div"
      disablePadding
      dense
      sx={[
        { px: 1 },
        isCurrent &&
          ((theme: Theme) => ({
            backgroundColor: lighten(theme.palette.background.paper, 0.2),
            fontWeight: "bold",
          })),
      ]}
    >
      <TimingPointData timingPoint={timingPoint} />
      <TimingPointMenu
        timingPoint={timingPoint}
        onDeleteTimingPoint={onDeleteTimingPoint}
        onJumpToTime={onJumpToTime}
        onJumpToLocation={onJumpToLocation}
      />
    </ListItem>
  );
}

const TimingPointData: FC<{ timingPoint: TimingPoint & HasUuid }> = ({ timingPoint }) => (
  <Stack direction="row" spacing={0.5} sx={{ flexGrow: 1, px: 1, fontFamily: "monospace" }}>
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
