import { FC } from "react";
import { TrackPlayer } from "./track-player";
import { LoadSaveFile } from "./LoadSaveFile";
import styled from "styled-components";
import { Track } from "./track-models";
import { NewFileStarter } from "./NewFileStarter";
import { IncludedTrackSelector } from "./IncludedTrackSelector";
import { Route as ReactRoute, Switch, Link } from "wouter";
import { TrackLocalStorageService } from "./common-components/TrackLocalStorageService";
import { IncludedDataMap } from "./included-data";
import { Panel } from "./common-components/Panel";

function App() {
  return (
    <MainCenterer>
      <MainContainer>
        <Switch>
          <ReactRoute path="/">
            <StartPage />
          </ReactRoute>
          <ReactRoute path="/route/:id">{(params) => <ViewRoutePage routeUuid={params.id} />}</ReactRoute>
          <ReactRoute path="/:rest*">{(params) => `404, Sorry the page ${params.rest} does not exist!`}</ReactRoute>
        </Switch>
        <ReturnLinkContainer>
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

const ViewRoutePage: FC<{ routeUuid: string }> = ({ routeUuid }) => {
  const route = loadRouteFromStorage(routeUuid);

  if (route === null)
    return (
      <>
        <Panel style={{ color: "#FF8888" }}>Route with ID {routeUuid} not found.</Panel>
        <StartPage />
      </>
    );

  return (
    <>
      <TrackPlayer initialTrack={route} />
      <ReturnLinkContainer>
        <ReturnLink href="/">Return to start page</ReturnLink>
      </ReturnLinkContainer>
    </>
  );
};

function loadRouteFromStorage(routeUuid: string): Track | null {
  const routeFromStorage = TrackLocalStorageService.load(routeUuid);
  if (routeFromStorage !== null) return routeFromStorage;
  return IncludedDataMap.get(routeUuid) || null;
}

const MainCenterer = styled.div`
  display: flex;
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
