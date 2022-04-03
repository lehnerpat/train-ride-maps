import { FC } from "react";
import { TrackPlayer } from "./track-player";
import styled from "styled-components";
import { Track } from "./track-models";
import { Route, Switch } from "wouter";
import { TrackLocalStorageService } from "./common-components/TrackLocalStorageService";
import { IncludedDataMap } from "./included-data";
import { Panel } from "./common-components/Panel";
import { OlTest } from "./OlTest";
import { gitCommitSha } from "./build-info";
import { OsmTest } from "./osm-input/OsmTest";
import { ReturnLink, ReturnLinkContainer } from "./common/components/return-links";
import { ViewTrackPage as ViewTrackPageV2 } from "./pages/ViewTrackPageV2";
import { StartPage } from "./pages/StartPage";

function App() {
  return (
    <MainCenterer>
      <MainContainer>
        <Switch>
          <Route path="/">
            <StartPage />
          </Route>
          <Route path="/ol-test">
            <OlTest />
          </Route>
          <Route path="/osm-test">
            <OsmTest />
          </Route>
          <Route path="/track/:id">{(params) => <ViewTrackPage trackUuid={params.id} />}</Route>
          <Route path="/trackv2/:id">{(params) => <ViewTrackPageV2 trackUuid={params.id} />}</Route>
          <Route path="/:rest*">{(params) => <Error404Page path={params.rest} />}</Route>
        </Switch>
        <ReturnLinkContainer>
          <span>
            Built from commit <code>{gitCommitSha}</code>
          </span>{" "}
          |{" "}
          <GithubLink href="https://github.com/lehnerpat/train-ride-maps" target={"_blank"} rel="noopener noreferrer">
            Source code on GitHub
          </GithubLink>
        </ReturnLinkContainer>
      </MainContainer>
    </MainCenterer>
  );
}

const ViewTrackPage: FC<{ trackUuid: string }> = ({ trackUuid }) => {
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

const Error404Page: FC<{ path: string | undefined }> = ({ path }) => (
  <div>
    <h2>
      404, Sorry the page <code>{path}</code> does not exist!
    </h2>
    <p>
      <ReturnLink href="/">Return to the start page.</ReturnLink>
    </p>
  </div>
);

function loadTrackFromStorage(trackUuid: string): Track | null {
  const trackFromStorage = TrackLocalStorageService.load(trackUuid);
  if (trackFromStorage !== null) return trackFromStorage;
  return IncludedDataMap.get(trackUuid) || null;
}

const MainCenterer = styled.div`
  /* display: flex; */
`;
const MainContainer = styled.div`
  margin: 0 auto;
`;

const GithubLink = styled.a`
  &,
  &:visited {
    color: #ddd;
  }

  &:hover,
  &:focus,
  &:active {
    color: white;
  }
`;

export default App;
