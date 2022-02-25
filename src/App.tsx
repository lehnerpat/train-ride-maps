import { useState } from "react";
import "./App.css";
import { RoutePlayer } from "./RoutePlayer";
import { LoadSaveFile } from "./LoadSaveFile";
import styled from "styled-components";
import { readFromJson, Route, serializeToJson } from "./route-models";
import { NewFileStarter } from "./NewFileStarter";
import { IncludedRouteSelector } from "./IncludedRouteSelector";

function App() {
  const [route, setRoute] = useState<Route>();

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
          <RoutePlayer routeState={[route, setRoute]} />
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
