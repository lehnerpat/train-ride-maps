import { useState } from "react";
import "./App.css";
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
        <LoadSaveFile
          onFileLoaded={onFileLoaded}
          isDownloadAvailable={!!route}
          onDownloadRequested={() => serializeToJson(route!)}
        />
        {!!route ? (
          <RoutePlayer routeState={[route, setDefinedRoute]} />
        ) : (
          <>
            <NewFileStarter
              onCreateNewFile={(title, videoUrl) => {
                setRoute({ title, videoUrl, waypoints: [] });
              }}
            />
            <IncludedRouteSelector
              onRouteSelected={(selectedRoute) => {
                setRoute(selectedRoute);
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

export default App;
