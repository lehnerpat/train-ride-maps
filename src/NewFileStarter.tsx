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
  const [videoTitle, setVideoTitle] = useState("");
  const [, setLocation] = useLocation();

  const inputsInvalid = !videoTitle || !videoUrl || !videoUrl.startsWith("https://");

  return (
    <Panel>
      <div>Start new:</div>
      <InputGrid>
        <>
          <label htmlFor="new-video-title">Title:</label>
          <input
            type="text"
            id="new-video-title"
            value={videoTitle}
            onChange={(ev) => {
              setVideoTitle(ev.target.value);
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
          const newRoute = Tracks.create(videoTitle, videoUrl);
          TrackLocalStorageService.save(newRoute);
          setLocation(PageRouting.viewTrackPage(newRoute.uuid));
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
