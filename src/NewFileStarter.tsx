import { FC, useState } from "react";
import styled from "styled-components";
import { Panel } from "./common-components/Panel";
import { useLocation } from "wouter";
import { Routes } from "./route-models";
import { RouteLocalStorageService } from "./common-components/RouteLocalStorageService";
import { PageRouting } from "./page-routing";

interface NewFileStarterProps {}
export const NewFileStarter: FC<NewFileStarterProps> = () => {
  const [videoUrl, setVideoUrl] = useState("");
  const [videoTitle, setVideoTitle] = useState("");
  const [, setLocation] = useLocation();

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
      <button
        onClick={() => {
          const newRoute = Routes.create(videoTitle, videoUrl);
          RouteLocalStorageService.save(newRoute);
          setLocation(PageRouting.viewRoutePage(newRoute.uuid));
        }}
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
