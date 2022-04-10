import { FC } from "react";
import { Panel } from "../common-components/Panel";
import { ReturnLink, ReturnLinkContainer } from "../common/components/return-links";
import { IncludedDataMapV2 } from "../included-data";
import { Track } from "../track-models/new";
import { TrackLocalStorageService } from "../track-models/NewTrackLocalStorageService";
import { TrackPlayer } from "../track-player-v2";
import { StartPage } from "./StartPageV2";

export const ViewTrackPage: FC<{ trackUuid: string }> = ({ trackUuid }) => {
  const track = loadTrackFromStorage(trackUuid);

  if (track === null)
    return (
      <>
        <Panel style={{ color: "#FF8888" }}>Track with ID {trackUuid} not found.</Panel>
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
  return IncludedDataMapV2.get(trackUuid) || null;
}
