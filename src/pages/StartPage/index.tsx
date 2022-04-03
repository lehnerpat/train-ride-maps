import { LoadSaveFile } from "../../common/components/LoadSaveFile";
import { IncludedTrackSelector } from "./IncludedTrackSelector";
import { NewFileStarter } from "./NewFileStarter";
import { StartPage as StartPageV2 } from "../StartPageV2";

export const StartPage = () => (
  <>
    <IncludedTrackSelector />
    <LoadSaveFile />
    <NewFileStarter />
    <hr />
    V2:
    <StartPageV2 />
  </>
);
