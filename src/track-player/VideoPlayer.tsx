import { FC } from "react";
import ReactPlayer from "react-player/youtube";

interface VideoPlayerProps {
  videoUrl: string;
  onProgress: (state: { played: number; playedSeconds: number; loaded: number; loadedSeconds: number }) => void;
}
export const VideoPlayer: FC<VideoPlayerProps> = ({ videoUrl, onProgress }) => (
  <>
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
  </>
);
