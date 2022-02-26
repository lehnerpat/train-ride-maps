import { useState } from "react";
import { RoutePlayer } from "./route-player";
import { LoadSaveFile } from "./LoadSaveFile";
import styled from "styled-components";
import { readFromJson, Route, serializeToJson } from "./route-models";
import { NewFileStarter } from "./NewFileStarter";
import { IncludedRouteSelector } from "./IncludedRouteSelector";

function App() {
  const [route, setRoute] = useState<Route>();
  const setDefinedRoute = (newRoute: React.SetStateAction<Route>) => {
    setRoute((prevRoute) => {
      if (typeof prevRoute === "undefined") throw new Error("prevRoute should never be undefined here");
      return typeof newRoute === "function" ? newRoute(prevRoute) : newRoute;
    });
  };

  const onFileLoaded = async (file: File): Promise<void> => {
    const j = await file.text();
    const r = readFromJson(j);
    setRoute(r);
  };

  return (
    <MainCenterer>
      <MainContainer>
        {!!route ? (
          <>
            <RoutePlayer routeState={[route, setDefinedRoute]} />
            <LoadSaveFile
              onFileLoaded={onFileLoaded}
              isDownloadAvailable={!!route}
              onDownloadRequested={() => serializeToJson(route!)}
            />
            <ReturnLinkContainer>
              <ReturnLink
                href="#"
                onClick={() => {
                  setRoute(undefined);
                }}
              >
                Return to start page
              </ReturnLink>
            </ReturnLinkContainer>
          </>
        ) : (
          <>
            <IncludedRouteSelector
              onRouteSelected={(selectedRoute) => {
                setRoute(selectedRoute);
              }}
            />
            <LoadSaveFile
              onFileLoaded={onFileLoaded}
              isDownloadAvailable={!!route}
              onDownloadRequested={() => serializeToJson(route!)}
            />
            <NewFileStarter
              onCreateNewFile={(title, videoUrl) => {
                setRoute({ title, videoUrl, waypoints: [] });
              }}
            />
          </>
        )}
      </MainContainer>
    </MainCenterer>
  );
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
const ReturnLink = styled.a`
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
