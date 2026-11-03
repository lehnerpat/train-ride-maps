import { FC, useCallback, useEffect, useRef } from "react";
import { AppBar, Box, Button, IconButton, Toolbar, Typography } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import DownloadIcon from "@mui/icons-material/Download";
import FullscreenIcon from "@mui/icons-material/Fullscreen";
import EditIcon from "@mui/icons-material/Edit";
import { Track, Tracks } from "../track-models";
import { Link } from "wouter";
import { useFileDownload } from "../common/hooks/useFileDownload";
import styled from "@emotion/styled";
import { VideoPlayer } from "./track-editor/VideoPlayer";
import { ViewingLiveMap } from "./track-editor/LiveMap";
import { PageRouting } from "../page-routing";
import { usePlayerState } from "./usePlayerState";
import { isFunction } from "../common/utils/type-helpers";

interface TrackPlayerProps {
  track: Track;
}

export const TrackPlayer: FC<TrackPlayerProps> = ({ track }) => {
  const downloadTrackAsFile = useFileDownload(`track_${track.uuid}.json`, () => Tracks.serializeToJson(track));
  const { onPlayerProgress, currentCenter } = usePlayerState(track);

  const { fullscreenParentElementRef, enterFullscreen } = useFullscreen();
  const keyHandler = useCallback(
    (ev: KeyboardEvent) => {
      if (ev.key === "f") enterFullscreen();
    },
    [enterFullscreen],
  );
  useKeyPressHandler(keyHandler);

  return (
    <div>
      <TopBar
        trackId={track.uuid}
        trackTitle={track.title}
        onDownloadFileClicked={downloadTrackAsFile}
        onEnterFullscreenClicked={enterFullscreen}
      />

      <VideoAndMapContainer ref={fullscreenParentElementRef}>
        <VideoContainer>
          <VideoPlayer videoUrl={track.videoUrl} onProgress={onPlayerProgress} />
          <ViewingMapContainer>
            <ViewingLiveMap path={track.path} currentCenter={currentCenter} />
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
        <IconButton color="inherit" onClick={onDownloadFileClicked} title="Download track as file">
          <DownloadIcon />
        </IconButton>
        <IconButton color="inherit" title="Enter fullscreen" onClick={onEnterFullscreenClicked}>
          <FullscreenIcon />
        </IconButton>
        <Button
          size="small"
          variant="outlined"
          color="inherit"
          sx={{ ml: 2 }}
          component={Link}
          href={PageRouting.editTrackPage(trackId)}
        >
          <EditIcon fontSize="small" />
          <Box sx={{ ml: 0.5, display: { xs: "none", md: "initial" } }}>Edit</Box>
        </Button>
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

const useFullscreen = () => {
  const fullscreenParentElementRef = useRef<HTMLElement>(null);

  const enterFullscreen = useCallback(async () => {
    const el = fullscreenParentElementRef.current;
    if (!el) return;
    if (!!document.fullscreenElement || !!(document as any).webkitFullscreenElement) {
      console.debug("already in fullscreen. doing nothing.");
      return;
    }
    try {
      if (el.requestFullscreen) {
        await el.requestFullscreen({ navigationUI: "hide" });
      } else if (isFunction((el as any).webkitRequestFullscreen)) {
        await (el as any).webkitRequestFullscreen();
      }
    } catch (e) {
      console.error("Could not enter fullscreen:", e);
    }
  }, [fullscreenParentElementRef]);
  return { fullscreenParentElementRef, enterFullscreen };
};

function useKeyPressHandler(keyHandler: (ev: KeyboardEvent) => void) {
  useEffect(() => {
    document.body.addEventListener("keydown", keyHandler);

    return () => {
      document.body.removeEventListener("keydown", keyHandler);
    };
  });
}
