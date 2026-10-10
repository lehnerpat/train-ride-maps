import { forwardRef, useImperativeHandle, useRef } from "react";
import ReactPlayer from "react-player";

interface VideoPlayerProps {
  videoUrl: string;
  onProgress: (state: { playedSeconds: number }) => void;
  onDuration: (duration: number) => void;
}

export interface VideoPlayerHandle {
  seekTo: (timeSeconds: number) => void;
}

export const VideoPlayer = forwardRef<VideoPlayerHandle, VideoPlayerProps>(
  ({ videoUrl, onProgress, onDuration }, ref) => {
    const playerRef = useRef<HTMLVideoElement>(null);

    useImperativeHandle(
      ref,
      () => ({
        seekTo: (timeSeconds) => {
          if (playerRef.current) playerRef.current.currentTime = timeSeconds;
        },
      }),
      [],
    );

    return (
      <ReactPlayer
        ref={playerRef}
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
  },
);
