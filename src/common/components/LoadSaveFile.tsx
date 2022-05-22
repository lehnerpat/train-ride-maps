import { FC } from "react";
import styled from "@emotion/styled";
import { Panel } from "./Panel";
import { useLocation } from "wouter";
import { PageRouting } from "../../page-routing";
import { TrackLocalStorageService } from "../../track-models/TrackLocalStorageService";
import { Tracks } from "../../track-models";
import { useFileUpload } from "../hooks/useFileUpload";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import Grid from "@mui/material/Grid";
import Box from "@mui/material/Box";

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
    <Box sx={{ padding: "0 1em" }}>
      <Card raised sx={{ padding: "0.5em" }}>
        <Grid container spacing={2}>
          <Grid item xs>
            <Button onClick={showUploadDialog} variant="contained" size="large" fullWidth>
              Upload file...
            </Button>
          </Grid>
          <Grid item xs>
            {!!onDownloadRequested && (
              <Button onClick={onDownloadButtonClicked} variant="contained" size="large" fullWidth>
                Download current file...
              </Button>
            )}
          </Grid>
        </Grid>
        <HiddenFileInput />
      </Card>
    </Box>
  );
};
