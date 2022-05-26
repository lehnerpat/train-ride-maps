import { FC, memo, useCallback } from "react";
import {
  Card,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableCellProps,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { Edit as EditIcon, MoreHoriz as MoreIcon } from "@mui/icons-material";
import { TimingPoint } from "../track-models";
import { HasUuid } from "../common/utils/uuid";

interface TimingPointsTableProps {
  timingPoints: ReadonlyArray<TimingPoint & HasUuid>;
  onEditTimingPoint: (index: number) => void;
}

export const TimingPointsTable: FC<TimingPointsTableProps> = ({ timingPoints, onEditTimingPoint }) => (
  <Card raised>
    <Typography variant="h6" p={2}>
      Timing Points:
    </Typography>
    <TableContainer sx={{ maxHeight: "400px" }}>
      <Table stickyHeader size="small">
        <TableHead>
          <TableRow>
            <TpTableCell align="center" sx={{ minWidth: 1 }}>
              #
            </TpTableCell>
            <TpTableCell align="center">t</TpTableCell>
            <TpTableCell align="center">d</TpTableCell>
            <TableCell padding="none" />
            <TableCell padding="none" />
          </TableRow>
        </TableHead>
        <TableBody>
          {timingPoints.map((timingPoint, idx) => (
            <TimingPointTableRow
              key={`${timingPoint.t}_${timingPoint.d}`}
              timingPoint={timingPoint}
              idx={idx}
              onEditTimingPoint={onEditTimingPoint}
            />
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  </Card>
);

const TimingPointTableRow: FC<{
  timingPoint: TimingPoint;
  idx: number;
  onEditTimingPoint: (index: number) => void;
}> = ({ timingPoint, idx, onEditTimingPoint }) => {
  const onEditButtonClick = useCallback(() => onEditTimingPoint(idx), [idx, onEditTimingPoint]);

  return (
    <TableRow>
      <TpTableCell align="right">{idx}</TpTableCell>
      <TimeCell t={timingPoint.t} />
      <DistanceCell d={timingPoint.d} />
      <EditButtonCell onClick={onEditButtonClick} />
      <TableCell padding="none">
        <IconButton size="small">
          <MoreIcon />
        </IconButton>
      </TableCell>
    </TableRow>
  );
};

const TimeCell: FC<{ t: number }> = memo(({ t }) => (
  <TpTableCell align="right">
    <Typography fontFamily="monospace" fontSize="100%">
      {formatTimeSec(t)}
    </Typography>
  </TpTableCell>
));

const DistanceCell: FC<{ d: number }> = memo(({ d }) => (
  <TpTableCell align="right">
    <Typography fontFamily="monospace" fontSize="100%">
      {formatDistanceMeters(d)}
    </Typography>
  </TpTableCell>
));

const EditButtonCell: FC<{ onClick: () => void }> = memo(({ onClick }) => (
  <TableCell padding="none">
    <IconButton size="small" onClick={onClick}>
      <EditIcon />
    </IconButton>
  </TableCell>
));

const TpTableCell: FC<TableCellProps> = ({ sx, ...restProps }) => <TableCell sx={{ px: 1, ...sx }} {...restProps} />;

function formatTimeSec(tSec: number): string {
  return tSec.toFixed(1) + "s";
}

function formatDistanceMeters(dMM: number): string {
  return (dMM / 1000).toFixed(3) + "m";
}
