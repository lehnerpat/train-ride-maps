import { LoadSaveFile } from "../../common/components/LoadSaveFile";
import { IncludedTrackSelector } from "./IncludedTrackSelector";
import { NewFileStarter } from "./NewFileStarter";
import { Container } from "@mui/material";

export const StartPage = () => (
  <Container maxWidth="md">
    <IncludedTrackSelector />
    <LoadSaveFile />
    <NewFileStarter />
  </Container>
);
