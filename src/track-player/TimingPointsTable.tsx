import { FC, PureComponent } from "react";
import { Box, Card, IconButton, ListItem, Stack, Typography } from "@mui/material";
import { Edit as EditIcon, MoreHoriz as MoreIcon } from "@mui/icons-material";
import { TimingPoint } from "../track-models";
import { HasUuid } from "../common/utils/uuid";
import { FixedSizeList, ListChildComponentProps } from "react-window";

interface TimingPointsListProps {
  timingPoints: ReadonlyArray<TimingPoint & HasUuid>;
  onEditTimingPoint: (uuid: string) => void;
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
    const { timingPoints, onEditTimingPoint } = this.props.data;
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
        <IconButton size="small">
          <MoreIcon />
        </IconButton>
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
