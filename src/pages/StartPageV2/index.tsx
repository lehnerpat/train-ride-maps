import { LoadSaveFile } from "../../common/components/LoadSaveFileV2";
import { IncludedTrackSelector } from "./IncludedTrackSelector";
import { NewFileStarter } from "./NewFileStarter";

export const StartPage = () => (
  <>
    <IncludedTrackSelector />
    <LoadSaveFile />
    <NewFileStarter />
  </>
);
