import { FC } from "react";
import ReactPlayer from "react-player";

interface VideoPlayerProps {
  videoUrl: string;
  onProgress: (state: { playedSeconds: number }) => void;
  onDuration: (duration: number) => void;
}
export const VideoPlayer: FC<VideoPlayerProps> = ({ videoUrl, onProgress, onDuration }) => (
  <ReactPlayer
    className="react-player"
    controls
    width="100%"
    height="100%"
    src={videoUrl}
    onTimeUpdate={(ev) => onProgress({ playedSeconds: ev.currentTarget.currentTime })}
    onDurationChange={(ev) => onDuration(ev.currentTarget.duration)}
    config={{ youtube: { start: 1, fs: 0 } }}
  />
);
