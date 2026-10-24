import { FC } from "react";
import { IncludedDataMap } from "../included-data";
import { Track } from "../track-models";
import { TrackLocalStorageService } from "../track-models/TrackLocalStorageService";
import { isTrackPlayerEditorMode, TrackEditor } from "../track-player-editor/track-editor";
import { StartPage } from "./StartPage";
import { Alert, Container } from "@mui/material";

export const ViewTrackPage: FC<{ trackUuid: string; mode?: string }> = ({ trackUuid, mode = "view" }) => {
  const track = loadTrackFromStorage(trackUuid);

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

  if (track === null) {
    return (
      <>
        <Container maxWidth="md" sx={{ pt: 2 }}>
          <Alert severity="error">Track with ID {trackUuid} not found.</Alert>
        </Container>
        <StartPage />
      </>
    );
  }

  return <TrackEditor initialTrack={track} mode={mode} />;
};

function loadTrackFromStorage(trackUuid: string): Track | null {
  const trackFromStorage = TrackLocalStorageService.load(trackUuid);
  if (trackFromStorage !== null) return trackFromStorage;
  return IncludedDataMap.get(trackUuid) || null;
}
