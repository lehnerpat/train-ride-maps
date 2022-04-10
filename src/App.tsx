import { FC } from "react";
import styled from "styled-components";
import { Route, Switch } from "wouter";
import { OlTest } from "./OlTest";
import { gitCommitSha } from "./build-info";
import { OsmTest } from "./osm-input/OsmTest";
import { ReturnLink, ReturnLinkContainer } from "./common/components/return-links";
import { ViewTrackPage as ViewTrackPageV2 } from "./pages/ViewTrackPageV2";
import { StartPage } from "./pages/StartPageV2";

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
