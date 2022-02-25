import { FC, useState } from "react";
import styled from "styled-components";
import { Panel } from "./common-components/Panel";

interface NewFileStarterProps {
  onCreateNewFile: (title: string, videoUrl: string) => void;
}
export const NewFileStarter: FC<NewFileStarterProps> = ({ onCreateNewFile }) => {
  const [videoUrl, setVideoUrl] = useState("");
  const [videoTitle, setVideoTitle] = useState("");

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
          />
        </>
        <>
          <label htmlFor="new-video-url">Video URL:</label>
          <input
            type="text"
            id="new-video-url"
            value={videoUrl}
            onChange={(ev) => {
              setVideoUrl(ev.target.value);
            }}
          />
        </>
      </InputGrid>
      <button onClick={() => onCreateNewFile(videoTitle, videoUrl)}>Create</button>
    </Panel>
  );
};

const InputGrid = styled.div`
  display: grid;
  column-gap: 10px;
  grid-template-columns: auto auto;
`;
