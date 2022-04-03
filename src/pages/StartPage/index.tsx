import { LoadSaveFile } from "../../common/components/LoadSaveFile";
import { IncludedTrackSelector } from "./IncludedTrackSelector";
import { NewFileStarter } from "./NewFileStarter";

export const StartPage = () => (
  <>
    <IncludedTrackSelector />
    <LoadSaveFile />
    <NewFileStarter />
  </>
);
