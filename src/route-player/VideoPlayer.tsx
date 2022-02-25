import { FC } from "react";
import ReactPlayer from "react-player/youtube";
import styled from "styled-components";

interface VideoPlayerProps {
  videoUrl: string;
  onProgress: (state: { played: number; playedSeconds: number; loaded: number; loadedSeconds: number }) => void;
}
export const VideoPlayer: FC<VideoPlayerProps> = ({ videoUrl, onProgress }) => (
  <VideoPlayerContainer>
    <ReactPlayer
      className="react-player"
      controls
      progressInterval={100}
      width="800px"
      height="450px"
      url={videoUrl}
      onProgress={onProgress}
      config={{ playerVars: { start: 1 } }}
    />
  </VideoPlayerContainer>
);

const VideoPlayerContainer = styled.div`
  margin-bottom: 20px;
`;
