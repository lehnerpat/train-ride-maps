import { FC } from "react";
import { TrackLocalStorageService } from "../track-models/TrackLocalStorageService";
import { StartPage } from "./StartPage";
import { Alert, Container } from "@mui/material";
import { TrackPlayer } from "../track-player-editor/TrackPlayer";

export const ViewTrackPage: FC<{ trackUuid: string }> = ({ trackUuid }) => {
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
  return <TrackPlayer track={track} />;
};
