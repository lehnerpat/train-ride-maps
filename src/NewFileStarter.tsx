import { FC, useState } from "react";
import styled from "styled-components";
import { Panel } from "./common-components/Panel";
import { useLocation } from "wouter";
import { Tracks } from "./track-models";
import { TrackLocalStorageService } from "./common-components/TrackLocalStorageService";
import { PageRouting } from "./page-routing";

interface NewFileStarterProps {}
export const NewFileStarter: FC<NewFileStarterProps> = () => {
  const [videoUrl, setVideoUrl] = useState("");
  const [trackTitle, setTrackTitle] = useState("");
  const [, setLocation] = useLocation();

  const inputsInvalid = !trackTitle || !videoUrl || !videoUrl.startsWith("https://");

  return (
    <Panel>
      <div>Start new:</div>
      <InputGrid>
        <>
          <label htmlFor="new-track-title">Title:</label>
          <input
            type="text"
            id="new-track-title"
            value={trackTitle}
            onChange={(ev) => {
              setTrackTitle(ev.target.value);
            }}
            required
          />
        </>
        <>
          <label htmlFor="new-video-url">Video URL:</label>
          <input
            type="text"
            id="new-video-url"
            value={videoUrl}
            placeholder="https://www.youtube.com/watch?v=..."
            onChange={(ev) => {
              setVideoUrl(ev.target.value);
            }}
            required
          />
        </>
      </InputGrid>
      <button
        onClick={() => {
          if (inputsInvalid) return;
          const newTrack = Tracks.create(trackTitle, videoUrl);
          TrackLocalStorageService.save(newTrack);
          setLocation(PageRouting.viewTrackPage(newTrack.uuid));
        }}
        disabled={inputsInvalid}
      >
        Create
      </button>
    </Panel>
  );
};

const InputGrid = styled.div`
  display: grid;
  column-gap: 10px;
  grid-template-columns: auto auto;
`;
