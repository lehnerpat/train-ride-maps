import { FC } from "react";
import { TrackLocalStorageService } from "../track-models/TrackLocalStorageService";
import { TrackEditor } from "../track-player-editor/track-editor";
import { StartPage } from "./StartPage";
import { Alert, Container } from "@mui/material";

export const EditTrackPage: FC<{ trackUuid: string }> = ({ trackUuid }) => {
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

  return <TrackEditor initialTrack={track} />;
};
