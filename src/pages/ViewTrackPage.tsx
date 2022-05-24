import { FC } from "react";
import { ReturnLink, ReturnLinkContainer } from "../common/components/return-links";
import { IncludedDataMap } from "../included-data";
import { Track } from "../track-models";
import { TrackLocalStorageService } from "../track-models/TrackLocalStorageService";
import { TrackPlayer } from "../track-player";
import { StartPage } from "./StartPage";
import { Alert, Container } from "@mui/material";

export const ViewTrackPage: FC<{ trackUuid: string }> = ({ trackUuid }) => {
  const track = loadTrackFromStorage(trackUuid);

  if (track === null)
    return (
      <>
        <Container maxWidth="md" sx={{ pt: 2 }}>
          <Alert severity="error">Track with ID {trackUuid} not found.</Alert>
        </Container>
        <StartPage />
      </>
    );

  return (
    <>
      <TrackPlayer initialTrack={track} />
      <ReturnLinkContainer>
        <ReturnLink href="/">Return to start page</ReturnLink>
      </ReturnLinkContainer>
    </>
  );
};

function loadTrackFromStorage(trackUuid: string): Track | null {
  const trackFromStorage = TrackLocalStorageService.load(trackUuid);
  if (trackFromStorage !== null) return trackFromStorage;
  return IncludedDataMap.get(trackUuid) || null;
}
