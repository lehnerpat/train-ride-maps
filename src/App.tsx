import { FC } from "react";
import { TrackPlayer } from "./track-player";
import { LoadSaveFile } from "./LoadSaveFile";
import styled from "styled-components";
import { Track } from "./track-models";
import { NewFileStarter } from "./NewFileStarter";
import { IncludedTrackSelector } from "./IncludedTrackSelector";
import { Route, Switch, Link } from "wouter";
import { TrackLocalStorageService } from "./common-components/TrackLocalStorageService";
import { IncludedDataMap } from "./included-data";
import { Panel } from "./common-components/Panel";
import { OlTest } from "./OlTest";
import { gitCommitSha } from "./build-info";

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
          <Route path="/track/:id">{(params) => <ViewTrackPage trackUuid={params.id} />}</Route>
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

const StartPage = () => (
  <>
    <IncludedTrackSelector />
    <LoadSaveFile />
    <NewFileStarter />
  </>
);

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

const ReturnLinkContainer = styled.div`
  font-size: 60%;
  text-align: center;
  margin: 20px 0;
`;
const ReturnLink = styled(Link)`
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
