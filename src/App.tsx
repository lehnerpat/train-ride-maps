import { useState } from "react";
import { RoutePlayer } from "./route-player";
import { LoadSaveFile } from "./LoadSaveFile";
import styled from "styled-components";
import { Route, Routes } from "./route-models";
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
    const r = Routes.readFromJson(j);
    setRoute(r);
  };

  const LoadSaveFileBlock = () => (
    <LoadSaveFile
      onFileLoaded={onFileLoaded}
      isDownloadAvailable={!!route}
      onDownloadRequested={() => Routes.serializeToJson(route!)}
    />
  );

  return (
    <MainCenterer>
      <MainContainer>
        {!!route ? (
          <>
            <RoutePlayer routeState={[route, setDefinedRoute]} />
            <LoadSaveFileBlock />
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
            <LoadSaveFileBlock />
            <NewFileStarter
              onCreateNewFile={(title, videoUrl) => {
                setRoute(Routes.create(title, videoUrl));
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
