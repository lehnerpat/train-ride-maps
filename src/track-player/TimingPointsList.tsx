import { FC, PureComponent, useLayoutEffect, useRef } from "react";
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
import { MoreHoriz as MoreIcon, DeleteForever as DeleteIcon } from "@mui/icons-material";
import { TimingPoint } from "../track-models";
import { HasUuid } from "../common/utils/uuid";
import { FixedSizeList, ListChildComponentProps } from "react-window";
import PopupState, { bindTrigger, bindMenu } from "material-ui-popup-state";
import { formatDistanceMeters, formatTimeSec } from "./track-info-formatting";
import { Theme, lighten } from "@mui/material/styles";

interface TimingPointsListProps {
  timingPoints: ReadonlyArray<TimingPoint & HasUuid>;
  onDeleteTimingPoint: (uuid: string) => void;
  precedingIndex: number;
  isAutoScrollOn: boolean;
}

export const TimingPointsList: FC<TimingPointsListProps> = (props) => {
  const { isAutoScrollOn, precedingIndex } = props;
  const listRef = useRef<FixedSizeList>(null);
  const prevPrecedingIndex = useRef(precedingIndex);

  useLayoutEffect(() => {
    const ref = listRef.current;
    if (!isAutoScrollOn || ref === null) return;

    if (precedingIndex >= prevPrecedingIndex.current) {
      ref.scrollToItem(precedingIndex + 1, "smart");
    } else {
      ref.scrollToItem(precedingIndex, "smart");
    }
    prevPrecedingIndex.current = precedingIndex;
  }, [precedingIndex, isAutoScrollOn]);

  return (
    <Card raised>
      <Typography variant="h6" p={2}>
        Timing Points:
      </Typography>
      <FixedSizeList
        height={300}
        width="100%"
        itemSize={34}
        itemCount={props.timingPoints.length}
        overscanCount={5}
        itemData={props}
        ref={listRef}
      >
        {ItemRenderer}
      </FixedSizeList>
    </Card>
  );
};

class ItemRenderer extends PureComponent<ListChildComponentProps<TimingPointsListProps>> {
  render() {
    const { timingPoints, onDeleteTimingPoint, precedingIndex } = this.props.data;
    const timingPoint = timingPoints[this.props.index];
    const isCurrent = this.props.index === precedingIndex || this.props.index === precedingIndex + 1;

    return (
      <ListItem
        style={this.props.style}
        key={timingPoint.uuid}
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
        <DeleteMenu timingPoint={timingPoint} onDeleteTimingPoint={onDeleteTimingPoint} />
      </ListItem>
    );
  }
}

const TimingPointData: FC<{ timingPoint: TimingPoint & HasUuid }> = ({ timingPoint }) => (
  <Stack direction="row" flexGrow={1} sx={{ px: 1, fontFamily: "monospace" }} spacing={0.5}>
    <Box>t={formatTimeSec(timingPoint.t)}</Box>
    <Box sx={{ opacity: 0.6 }}>|</Box>
    <Box>d={formatDistanceMeters(timingPoint.d)}</Box>
  </Stack>
);

const DeleteMenu: FC<{ timingPoint: TimingPoint & HasUuid; onDeleteTimingPoint: (uuid: string) => void }> = ({
  timingPoint,
  onDeleteTimingPoint,
}) => (
  <PopupState variant="popover" popupId={`tp_menu_${timingPoint.uuid}`}>
    {(popupState) => {
      return (
        <>
          <IconButton size="small" {...bindTrigger(popupState)}>
            <MoreIcon />
          </IconButton>
          <Menu {...bindMenu(popupState)}>
            <MenuItem
              onClick={() => onDeleteTimingPoint(timingPoint.uuid)}
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
