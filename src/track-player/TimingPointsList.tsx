import { FC, PureComponent } from "react";
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

interface TimingPointsListProps {
  timingPoints: ReadonlyArray<TimingPoint & HasUuid>;
  onDeleteTimingPoint: (uuid: string) => void;
}

// TODO: highlight current timing points
// TODO: autoscroll when option is on
export const TimingPointsList: FC<TimingPointsListProps> = (props) => {
  return (
    <Card raised>
      <Typography variant="h6" p={2}>
        Timing Points:
      </Typography>
      <FixedSizeList
        height={400}
        width="100%"
        itemSize={34}
        itemCount={props.timingPoints.length}
        overscanCount={5}
        itemData={props}
      >
        {ItemRenderer}
      </FixedSizeList>
    </Card>
  );
};

class ItemRenderer extends PureComponent<ListChildComponentProps<TimingPointsListProps>> {
  render() {
    const { timingPoints, onDeleteTimingPoint } = this.props.data;
    const timingPoint = timingPoints[this.props.index];

    return (
      <ListItem style={this.props.style} key={timingPoint.uuid} component="div" disablePadding dense sx={{ px: 1 }}>
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
          <Menu anchorOrigin={{ vertical: "top", horizontal: "right" }} {...bindMenu(popupState)}>
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
