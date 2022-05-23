import { FC, useState } from "react";
import { useLocation } from "wouter";
import { PageRouting } from "../../page-routing";
import { TrackLocalStorageService } from "../../track-models/TrackLocalStorageService";
import { Tracks } from "../../track-models";
import { TopLevelCard } from "../../common/components/TopLevelCard";
import { Box, Button, Stack, TextField, Typography } from "@mui/material";

interface NewFileStarterProps {}
export const NewFileStarter: FC<NewFileStarterProps> = () => {
  const [videoUrl, setVideoUrl] = useState("");
  const [trackTitle, setTrackTitle] = useState("");
  const [, setLocation] = useLocation();

  const inputsInvalid = !trackTitle || !videoUrl || !videoUrl.startsWith("https://");

  return (
    <TopLevelCard>
      <Stack spacing={2} sx={{ p: 2 }}>
        <Typography variant="h5">Create new track</Typography>
        <TextField
          required
          id="new-track-title"
          label="Title"
          InputLabelProps={{ shrink: true }}
          value={trackTitle}
          onChange={(ev) => {
            setTrackTitle(ev.target.value);
          }}
        />
        <TextField
          required
          id="new-track-video-url"
          label="Video URL"
          InputLabelProps={{ shrink: true }}
          placeholder="https://www.youtube.com/watch?v=..."
          value={videoUrl}
          onChange={(ev) => {
            setVideoUrl(ev.target.value);
          }}
        />
        <Box justifyContent="flex-end" display="flex">
          <Button
            variant="contained"
            disabled={inputsInvalid}
            onClick={() => {
              if (inputsInvalid) return;
              const newTrack = Tracks.createEmpty(trackTitle, videoUrl);
              TrackLocalStorageService.save(newTrack);
              setLocation(PageRouting.viewTrackPage(newTrack.uuid));
            }}
          >
            Create
          </Button>
        </Box>
      </Stack>
    </TopLevelCard>
  );
};
