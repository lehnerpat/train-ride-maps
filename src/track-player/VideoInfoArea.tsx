import { FC, useState } from "react";
import { LatLngLiteral } from "leaflet";
import { Box, Button, Card, IconButton, Stack, TextField, Typography } from "@mui/material";
import { Edit as EditIcon } from "@mui/icons-material";
import { useFileUpload } from "../common/hooks/useFileUpload";
import { parseOsmXml } from "../osm-input/parse-osm-xml";
import { augmentUuid, HasUuid } from "../common/utils/uuid";
import { isUndefined } from "../common/utils/type-helpers";
import { isTrackTitleValid, isVideoUrlValid } from "../track-models/track-info-validation";
import { formatDistanceMeters, formatVideoDuration } from "./track-info-formatting";

interface VideoInfoAreaProps {
  trackTitle: string;
  videoUrl: string;
  videoDuration?: number;
  pathLengthMM: number;
  onTrackInfoChanged: (trackTitle: string, videoUrl: string) => void;
  onPathUploaded: (path: ReadonlyArray<LatLngLiteral & HasUuid>) => void;
  onReversePathClicked: () => void;
}
export const VideoInfoArea: FC<VideoInfoAreaProps> = ({
  trackTitle,
  videoUrl,
  videoDuration,
  pathLengthMM,
  onTrackInfoChanged,
  onPathUploaded,
  onReversePathClicked,
}) => {
  const [isEditingInfo, setIsEditingInfo] = useState(false);
  const [draftTitle, setDraftTitle] = useState(trackTitle);
  const [draftVideoUrl, setDraftVideoUrl] = useState(videoUrl);

  const isTitleValid = isTrackTitleValid(draftTitle);
  const isUrlValid = isVideoUrlValid(draftVideoUrl);

  const startEditing = () => {
    setDraftTitle(trackTitle);
    setDraftVideoUrl(videoUrl);
    setIsEditingInfo(true);
  };
  const save = () => {
    if (!isTitleValid || !isUrlValid) return;
    onTrackInfoChanged(draftTitle.trim(), draftVideoUrl);
    setIsEditingInfo(false);
  };

  return (
    // TODO: show UUID in editing mode
    <Card raised sx={{ p: 2 }}>
      <Stack direction="row" spacing={1}>
        <Box sx={{ flexGrow: 1 }}>
          <Stack spacing={1}>
            <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
              <Typography variant="h6">Video Info:</Typography>
              {!isEditingInfo && (
                <IconButton size="small" color="inherit" title="Edit track info" onClick={startEditing}>
                  <EditIcon fontSize="small" />
                </IconButton>
              )}
            </Stack>
            {isEditingInfo ? (
              <>
                <TextField
                  required
                  size="small"
                  label="Title"
                  slotProps={{ inputLabel: { shrink: true } }}
                  value={draftTitle}
                  error={!isTitleValid}
                  helperText={isTitleValid ? undefined : "Title must not be empty"}
                  onChange={(ev) => setDraftTitle(ev.target.value)}
                />
                <TextField
                  required
                  size="small"
                  label="Video URL"
                  slotProps={{ inputLabel: { shrink: true } }}
                  placeholder="https://www.youtube.com/watch?v=..."
                  value={draftVideoUrl}
                  error={!isUrlValid}
                  helperText={isUrlValid ? undefined : "Video URL must start with https://"}
                  onChange={(ev) => setDraftVideoUrl(ev.target.value)}
                />
                <Stack direction="row" spacing={1} sx={{ justifyContent: "flex-end" }}>
                  <Button size="small" color="inherit" onClick={() => setIsEditingInfo(false)}>
                    Cancel
                  </Button>
                  <Button size="small" variant="contained" disabled={!isTitleValid || !isUrlValid} onClick={save}>
                    Save
                  </Button>
                </Stack>
              </>
            ) : (
              <>
                <Box>
                  <Typography variant="body1">Title: {trackTitle}</Typography>
                </Box>
                <Box>
                  <Typography variant="body1">Video: {videoUrl}</Typography>
                </Box>
              </>
            )}
            <Stack direction="row" spacing={2}>
              <Typography variant="body1">
                Duration: {isUndefined(videoDuration) ? "--" : formatVideoDuration(videoDuration)}
              </Typography>
              <Typography variant="body1">Total path length: {formatDistanceMeters(pathLengthMM)}</Typography>
            </Stack>
          </Stack>
        </Box>
        <Stack spacing={1} sx={{ width: 170 }}>
          <ImportOsmXmlButton onPathUploaded={onPathUploaded} />
          <Button variant="outlined" color="inherit" size="small" onClick={onReversePathClicked}>
            Reverse Path
          </Button>
        </Stack>
      </Stack>
    </Card>
  );
};

const ImportOsmXmlButton: FC<{ onPathUploaded: (path: ReadonlyArray<LatLngLiteral & HasUuid>) => void }> = ({
  onPathUploaded,
}) => {
  const onOsmFileUploaded = async (file: File) => {
    const osmXml = await file.text();
    // TODO error handling
    const nodes = parseOsmXml(osmXml);
    console.log("parsed ", nodes.length, "nodes");
    const path = nodes.map((n) => n.coord);
    onPathUploaded(path.map(augmentUuid));
  };
  const { HiddenFileInput, showUploadDialog } = useFileUpload("osm-import", onOsmFileUploaded);

  return (
    <>
      <Button variant="outlined" color="inherit" size="small" onClick={showUploadDialog}>
        Import OSM XML
      </Button>
      <HiddenFileInput />
    </>
  );
};
