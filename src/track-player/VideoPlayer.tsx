import { FC } from "react";
import ReactPlayer from "react-player/youtube";
import styled from "styled-components";

interface VideoPlayerProps {
  videoUrl: string;
  onProgress: (state: { played: number; playedSeconds: number; loaded: number; loadedSeconds: number }) => void;
}
export const VideoPlayer: FC<VideoPlayerProps> = ({ videoUrl, onProgress }) => (
  <VideoPlayerContainer>
    <AspectRatioContainerOuter>
      <AspectRatioContainerInner>
        <ReactPlayer
          className="react-player"
          controls
          progressInterval={100}
          width="100%"
          height="100%"
          url={videoUrl}
          onProgress={onProgress}
          config={{ playerVars: { start: 1 } }}
        />
      </AspectRatioContainerInner>
    </AspectRatioContainerOuter>
  </VideoPlayerContainer>
);

const VideoPlayerContainer = styled.div`
  margin-bottom: 20px;
`;

const AspectRatioContainerOuter = styled.div`
  position: relative;
  &:before {
    display: block;
    content: "";
    width: 100%;
    padding-top: calc((9 / 16) * 100%);
  }
`;
const AspectRatioContainerInner = styled.div`
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
`;
