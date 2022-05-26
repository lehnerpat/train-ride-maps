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
import { Edit as EditIcon, MoreHoriz as MoreIcon, DeleteForever as DeleteIcon } from "@mui/icons-material";
import { TimingPoint } from "../track-models";
import { HasUuid } from "../common/utils/uuid";
import { FixedSizeList, ListChildComponentProps } from "react-window";
import PopupState, { bindTrigger, bindMenu } from "material-ui-popup-state";

interface TimingPointsListProps {
  timingPoints: ReadonlyArray<TimingPoint & HasUuid>;
  onEditTimingPoint: (uuid: string) => void;
  onDeleteTimingPoint: (uuid: string) => void;
}

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
    const { timingPoints, onEditTimingPoint, onDeleteTimingPoint } = this.props.data;
    const timingPoint = timingPoints[this.props.index];

    return (
      <ListItem style={this.props.style} key={timingPoint.uuid} component="div" disablePadding dense sx={{ px: 1 }}>
        <Stack direction="row" flexGrow={1} sx={{ px: 1, fontFamily: "monospace" }} spacing={0.5}>
          <Box>t={formatTimeSec(timingPoint.t)}</Box>
          <Box sx={{ opacity: 0.6 }}>|</Box>
          <Box>d={formatDistanceMeters(timingPoint.d)}</Box>
        </Stack>
        <IconButton size="small" onClick={() => onEditTimingPoint(timingPoint.uuid)}>
          <EditIcon />
        </IconButton>
        <PopupState variant="popover" popupId={`tp_menu_${timingPoint.uuid}`}>
          {(popupState) => (
            <>
              <IconButton size="small" {...bindTrigger(popupState)}>
                <MoreIcon />
              </IconButton>
              <Menu anchorOrigin={{ vertical: "top", horizontal: "right" }} {...bindMenu(popupState)}>
                <MenuItem
                  onClick={() => onDeleteTimingPoint(timingPoint.uuid)}
                  title={`Delete timing point t=${formatTimeSec(timingPoint.t)} / d=${formatDistanceMeters(
                    timingPoint.d
                  )}`}
                >
                  <ListItemIcon>
                    <DeleteIcon />
                  </ListItemIcon>
                  <ListItemText>Delete</ListItemText>
                </MenuItem>
              </Menu>
            </>
          )}
        </PopupState>
      </ListItem>
    );
  }
}

function formatTimeSec(tSec: number): string {
  return tSec.toFixed(1) + "s";
}

function formatDistanceMeters(dMM: number): string {
  return (dMM / 1000).toFixed(3) + "m";
}
