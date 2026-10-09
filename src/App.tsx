import { FC } from "react";
import styled from "@emotion/styled";
import { Route, Router, Switch } from "wouter";
import { useHashLocation } from "wouter/use-hash-location";
import { gitCommitSha } from "./build-info";
import { OsmTest } from "./osm-input/OsmTest";
import { ReturnLink, ReturnLinkContainer } from "./common/components/return-links";
import { ViewTrackPage } from "./pages/ViewTrackPage";
import { StartPage } from "./pages/StartPage";
import { OsmImport } from "./osm-input/OsmImport";

function App() {
  return (
    <MainCenterer>
      <MainContainer>
        <Router hook={useHashLocation}>
          <Switch>
            <Route path="/">
              <StartPage />
            </Route>
            <Route path="/osm-test">
              <OsmTest />
            </Route>
            <Route path="/osm-import">
              <OsmImport />
            </Route>
            <Route path="/track/:id">{(params) => <ViewTrackPage trackUuid={params.id} />}</Route>
            <Route path="/*">{(params) => <Error404Page path={params["*"]} />}</Route>
          </Switch>
        </Router>
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
