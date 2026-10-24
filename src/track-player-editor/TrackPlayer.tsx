import { FC, useEffect, useState } from "react";
import { AppBar, Box, Button, IconButton, Toolbar, Typography } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import DownloadIcon from "@mui/icons-material/Download";
import FullscreenIcon from "@mui/icons-material/Fullscreen";
import EditIcon from "@mui/icons-material/Edit";
import { LatLngLiteral, Track, Tracks } from "../track-models";
import { Link } from "wouter";
import { useFileDownload } from "../common/hooks/useFileDownload";
import styled from "@emotion/styled";
import { VideoPlayer } from "./track-editor/VideoPlayer";
import { LiveMap } from "./track-editor/LiveMap";
import {
  computeDistanceFromStartMap,
  computeTimingPointLocations,
  DistanceWithCoord,
  findPrecedingTimingPointIndex,
  interpolateDistance,
  interpolateCoordinates,
} from "./track-editor";
import { useMemoState, usePickedState } from "../common/utils/state-utils";
import { DefaultViewOptions } from "./track-editor/ViewOptions";
import { PageRouting } from "../page-routing";

interface TrackPlayerProps {
  track: Track;
}

export const TrackPlayer: FC<TrackPlayerProps> = ({ track }) => {
  const downloadTrackAsFile = useFileDownload(`track_${track.uuid}.json`, () => Tracks.serializeToJson(track));
  const [playedSeconds, setPlayedSeconds] = useState(0);
  const timingPoints = track.timingPoints;
  const initialCoord = track.path.length > 0 ? track.path[0] : { lat: 0, lng: 0 };
  const [currentCenter, setCurrentCenter] = useState<LatLngLiteral>(initialCoord);

  // TODO: can we remove this?
  const trackState = useState(track);
  const viewOptionsState = useMemoState(DefaultViewOptions);
  const [viewOptions] = viewOptionsState;
  const mapViewOptionsState = usePickedState(viewOptionsState, "mapViewOptions");

  const [distanceFromStartMap, setDistanceFromStartMap] = useState<DistanceWithCoord[]>([]);

  useEffect(() => {
    const dfsMap = computeDistanceFromStartMap(track.path);
    setDistanceFromStartMap(dfsMap);
  }, [track.path]);

  useEffect(() => {
    if (!timingPoints || timingPoints.length === 0 || distanceFromStartMap.length === 0) {
      setCurrentCenter(initialCoord);
      return;
    }

    const precedingIndex = findPrecedingTimingPointIndex(playedSeconds, timingPoints);

    let interpolatedDistance: number;
    if (precedingIndex === -1) {
      interpolatedDistance = timingPoints[0].d;
    } else if (precedingIndex === timingPoints.length - 1) {
      interpolatedDistance = timingPoints[timingPoints.length - 1].d;
    } else {
      interpolatedDistance = interpolateDistance(
        timingPoints[precedingIndex],
        timingPoints[precedingIndex + 1],
        playedSeconds,
      );
    }

    const nextIdx = distanceFromStartMap.findIndex((t) => t[0] > interpolatedDistance);
    let interpolatedCoord: LatLngLiteral;
    if (nextIdx === 0) {
      interpolatedCoord = distanceFromStartMap[0][1];
    } else if (nextIdx === -1) {
      interpolatedCoord = distanceFromStartMap[distanceFromStartMap.length - 1][1];
    } else {
      const next = distanceFromStartMap[nextIdx];
      const prev = distanceFromStartMap[nextIdx - 1];
      interpolatedCoord = interpolateCoordinates(prev, next, interpolatedDistance);
    }

    setCurrentCenter(interpolatedCoord);
  }, [playedSeconds, timingPoints, initialCoord, distanceFromStartMap]);

  return (
    <div>
      <TopBar
        trackId={track.uuid}
        trackTitle={track.title}
        onDownloadFileClicked={downloadTrackAsFile}
        onEnterFullscreenClicked={() => {}}
      />

      <VideoAndMapContainer>
        <VideoContainer>
          <VideoPlayer
            videoUrl={track.videoUrl}
            onProgress={(ev) => {
              setPlayedSeconds(ev.playedSeconds);
            }}
            onDuration={(duration) => {
              // if (Number.isFinite(duration) && duration >= 0) {
              //   setVideoDuration(duration);
              // }
            }}
          />
          <ViewingMapContainer>
            <LiveMap
              trackState={trackState}
              path={track.path}
              timingPointLocations={computeTimingPointLocations(distanceFromStartMap, track.timingPoints)}
              initialCenter={initialCoord}
              currentCenter={currentCenter}
              onMapMoved={(newCenter) => {}}
              playedSeconds={playedSeconds}
              isEditingModeOn={false}
              viewOptions={viewOptions.mapViewOptions}
              isAutopanOnInitially={true}
            />
          </ViewingMapContainer>
        </VideoContainer>
      </VideoAndMapContainer>
    </div>
  );
};

const TopBar: FC<{
  trackId: string;
  trackTitle: string;
  onDownloadFileClicked: () => void;
  onEnterFullscreenClicked: () => void;
}> = ({ trackId, trackTitle, onDownloadFileClicked, onEnterFullscreenClicked }) => {
  return (
    <AppBar position="static" sx={{ mb: 2 }}>
      <Toolbar>
        <Box sx={{ mr: 2 }}>
          <IconButton color="inherit" title="Back to start page" component={Link} href="/">
            <ArrowBackIcon />
          </IconButton>
        </Box>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          {trackTitle}
        </Typography>
        <Button
          size="small"
          variant="outlined"
          color="inherit"
          sx={{ mr: 2 }}
          component={Link}
          href={PageRouting.editTrackPage(trackId)}
        >
          <EditIcon fontSize="small" />
          <Box sx={{ ml: 0.5, display: { xs: "none", md: "initial" } }}>Edit</Box>
        </Button>
        <IconButton color="inherit" onClick={onDownloadFileClicked} title="Download track as file">
          <DownloadIcon />
        </IconButton>
        <IconButton color="inherit" title="Enter fullscreen" onClick={onEnterFullscreenClicked}>
          <FullscreenIcon />
        </IconButton>
      </Toolbar>
    </AppBar>
  );
};

const VideoAndMapContainer = styled(Box)`
  position: relative;
  margin: 0 auto;
  display: flex;
  align-items: center;

  max-height: calc(100vh - 64px - 32px);
  aspect-ratio: 16/9;
`;

const VideoContainer = styled(Box)`
  position: absolute;
  aspect-ratio: 16/9;
  width: 100%;
`;

const ViewingMapContainer = styled(Box)`
  position: absolute;
  top: 0;
  right: 0;
  width: 30%;
  height: 30%;
`;
