import { useState } from "react";
import "./App.css";
import { RoutePlayer } from "./RoutePlayer";
import { LoadSaveFile } from "./LoadSaveFile";
import styled from "styled-components";
import { readFromJson, RouteFileModel, serializeToJson } from "./route-files";
import { NewFileStarter } from "./NewFileStarter";

function App() {
  const [route, setRoute] = useState<RouteFileModel>();

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
          <NewFileStarter
            onCreateNewFile={(videoUrl) => {
              setRoute({ videoUrl, waypoints: [] });
            }}
          />
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
