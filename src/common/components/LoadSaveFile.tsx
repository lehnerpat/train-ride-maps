import { FC } from "react";
import styled from "styled-components";
import { Panel } from "./Panel";
import { useLocation } from "wouter";
import { PageRouting } from "../../page-routing";
import { TrackLocalStorageService } from "../../track-models/TrackLocalStorageService";
import { Tracks } from "../../track-models";
import { useFileUpload } from "./useFileUpload";

interface LoadSaveFileProps {
  onDownloadRequested?: () => string;
}

export const LoadSaveFile: FC<LoadSaveFileProps> = ({ onDownloadRequested }) => {
  const [, setLocation] = useLocation();

  const onTrackFileUploaded = async (file: File) => {
    const j = await file.text();
    const r = Tracks.readFromJson(j);
    TrackLocalStorageService.save(r);
    setLocation(PageRouting.viewTrackPage(r.uuid));
  };
  const { showUploadDialog, HiddenFileInput } = useFileUpload("track-upload", onTrackFileUploaded);

  const onDownloadButtonClicked = () => {
    if (!onDownloadRequested) return;
    const contents = onDownloadRequested();
    if (!contents) return;

    const element = document.createElement("a");
    const file = new Blob([contents], { type: "application/json" });
    const fileDownloadUrl = URL.createObjectURL(file);
    element.href = fileDownloadUrl;
    element.download = "track.json";
    element.style.display = "none";
    document.body.appendChild(element);
    element.click();
    URL.revokeObjectURL(fileDownloadUrl);
    document.body.removeChild(element);
  };

  return (
    <Panel>
      <ButtonBar>
        <Button onClick={showUploadDialog}>Upload file...</Button>
        {!!onDownloadRequested && <Button onClick={onDownloadButtonClicked}>Download current file...</Button>}
      </ButtonBar>
      <HiddenFileInput />
    </Panel>
  );
};

const ButtonBar = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
`;

const Button = styled.button`
  flex-grow: 1;
  padding: 1em 3em;
`;
