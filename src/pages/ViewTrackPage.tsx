import { FC } from "react";
import { TrackLocalStorageService } from "../track-models/TrackLocalStorageService";
import { isTrackPlayerEditorMode, TrackEditor } from "../track-player-editor/track-editor";
import { StartPage } from "./StartPage";
import { Alert, Container } from "@mui/material";
import { TrackPlayer } from "../track-player-editor/TrackPlayer";

export const ViewTrackPage: FC<{ trackUuid: string; mode?: string }> = ({ trackUuid, mode = "view" }) => {
  const track = TrackLocalStorageService.loadWithFallbackToIncluded(trackUuid);

  if (track === null) {
    return (
      <>
        <Container maxWidth="md" sx={{ pt: 2 }}>
          <Alert severity="error">
            Track with ID <code>{trackUuid}</code> not found.
          </Alert>
        </Container>
        <StartPage />
      </>
    );
  }

  if (mode === "view-new") {
    return <TrackPlayer track={track} />;
  }

  if (!isTrackPlayerEditorMode(mode)) {
    return (
      <>
        <Container maxWidth="md" sx={{ pt: 2 }}>
          <Alert severity="error">Invalid mode: {mode}</Alert>
        </Container>
        <StartPage />
      </>
    );
  }

  return <TrackEditor initialTrack={track} mode={mode} />;
};
