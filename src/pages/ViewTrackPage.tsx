import { FC } from "react";
import { Panel } from "../common-components/Panel";
import { ReturnLink, ReturnLinkContainer } from "../common/components/return-links";
import { IncludedDataMap } from "../included-data";
import { Track } from "../track-models";
import { TrackLocalStorageService } from "../track-models/TrackLocalStorageService";
import { TrackPlayer } from "../track-player";
import { StartPage } from "./StartPage";

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
  return IncludedDataMap.get(trackUuid) || null;
}
