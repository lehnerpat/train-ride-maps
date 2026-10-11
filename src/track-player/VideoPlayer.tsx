import { forwardRef, useImperativeHandle, useRef } from "react";

import { VideoPlayer as VideoJsPlayer } from "@videojs/react/video";
import { YouTubeVideo } from "@videojs/react/media/youtube-video";
import type { YouTubeAdapter } from "@videojs/youtube-video";
import "@videojs/react/video/neutral-skin.css";

interface VideoPlayerProps {
  videoUrl: string;
  onProgress: (state: { playedSeconds: number }) => void;
  onDuration: (duration: number) => void;
}

export interface VideoPlayerHandle {
  seekTo: (timeSeconds: number) => void;
  seekBy: (offsetSeconds: number) => void;
  togglePlayback: () => Promise<void>;
}

export const VideoPlayer = forwardRef<VideoPlayerHandle, VideoPlayerProps>(
  ({ videoUrl, onProgress, onDuration }, ref) => {
    const playerRef = useRef<YouTubeAdapter>(null);

    useImperativeHandle(
      ref,
      () => ({
        seekTo: (timeSeconds) => {
          if (playerRef.current) {
            playerRef.current.currentTime = timeSeconds;
          }
        },
        seekBy: (offsetSeconds) => {
          if (!playerRef.current) return;
          const currentTime = Number.isFinite(playerRef.current.currentTime) ? playerRef.current.currentTime : 0;
          const duration = playerRef.current.duration;
          const targetTime = Math.max(0, currentTime + offsetSeconds);
          playerRef.current.currentTime =
            Number.isFinite(duration) && duration > 0 ? Math.min(targetTime, duration) : targetTime;
        },
        togglePlayback: () => {
          const player = playerRef.current;
          if (!player || !player.paused) {
            player?.pause();
            return Promise.resolve();
          }
          return player.play();
        },
      }),
      [],
    );

    return (
      <VideoJsPlayer>
        <YouTubeVideo
          controls
          src={videoUrl}
          mediaRef={playerRef}
          onTimeUpdate={() => {
            if (playerRef.current) {
              onProgress({ playedSeconds: playerRef.current.currentTime });
            }
          }}
          onDurationChange={() => {
            if (playerRef.current) {
              onDuration(playerRef.current.duration);
            }
          }}
        />
      </VideoJsPlayer>
    );
  },
);
