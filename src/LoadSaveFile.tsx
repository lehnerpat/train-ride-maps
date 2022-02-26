import { FC, useRef } from "react";
import styled from "styled-components";
import { Panel } from "./common-components/Panel";
import { useLocation } from "wouter";
import { Routes } from "./route-models";
import { RouteLocalStorageService } from "./common-components/RouteLocalStorageService";
import { PageRouting } from "./page-routing";

interface LoadSaveFileProps {
  onDownloadRequested?: () => string;
}

export const LoadSaveFile: FC<LoadSaveFileProps> = ({ onDownloadRequested }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [, setLocation] = useLocation();

  const onUploadButtonClicked = () => {
    const inputEl = fileInputRef.current;
    if (inputEl === null) return;

    // reset the input so change event fires even when user selects same file as previously
    inputEl.value = "";
    inputEl.files = null;
    inputEl.click();
  };
  const onFileSelectionChanged = async (ev: React.ChangeEvent<HTMLInputElement>) => {
    const files = ev.target.files;
    if (!!files && files.length > 0) {
      const j = await files[0].text();
      const r = Routes.readFromJson(j);
      RouteLocalStorageService.save(r);
      setLocation(PageRouting.viewRoutePage(r.uuid));
    }
  };

  const onDownloadButtonClicked = () => {
    if (!onDownloadRequested) return;
    const contents = onDownloadRequested();
    if (!contents) return;

    const element = document.createElement("a");
    const file = new Blob([contents], { type: "application/json" });
    const fileDownloadUrl = URL.createObjectURL(file);
    element.href = fileDownloadUrl;
    element.download = "route.json";
    element.style.display = "none";
    document.body.appendChild(element);
    element.click();
    URL.revokeObjectURL(fileDownloadUrl);
    document.body.removeChild(element);
  };

  return (
    <Panel>
      <ButtonBar>
        <Button onClick={onUploadButtonClicked}>Upload file...</Button>
        {!!onDownloadRequested && <Button onClick={onDownloadButtonClicked}>Download current file...</Button>}
      </ButtonBar>
      <HiddenInput type="file" id="upload-file" ref={fileInputRef} onChange={onFileSelectionChanged} />
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

const HiddenInput = styled.input`
  display: none;
`;
