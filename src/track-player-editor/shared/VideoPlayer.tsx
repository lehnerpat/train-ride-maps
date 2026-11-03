import { forwardRef, useCallback, useImperativeHandle, useRef, useState } from "react";

import { Video, VideoPlayer as VideoJsPlayer, NeutralVideoSkin } from "@videojs/react/video";
import { YouTubeVideo } from "@videojs/react/media/youtube-video";
import type { YouTubeAdapter } from "@videojs/youtube-video";
import "@videojs/react/video/neutral-skin.css";

export interface VideoPlayerHandle {
  seekTo: (timeSeconds: number) => void;
  seekBy: (offsetSeconds: number) => void;
  togglePlayback: () => Promise<void>;
}

export const useVideoPlayer = ({
  videoUrl,
  onProgress,
}: {
  videoUrl: string;
  onProgress: (state: { playedSeconds: number }) => void;
}) => {
  const videoPlayerRef = useRef<VideoPlayerHandle>(null);
  const [videoDuration, setVideoDuration] = useState<number>();

  const seekTo = useCallback(
    (timeSeconds: number) => {
      videoPlayerRef.current?.seekTo(timeSeconds);
    },
    [videoPlayerRef],
  );
  const seekBy = useCallback(
    (offsetSeconds: number) => {
      videoPlayerRef.current?.seekBy(offsetSeconds);
    },
    [videoPlayerRef],
  );
  const togglePlayback = useCallback(() => {
    return videoPlayerRef.current?.togglePlayback();
  }, [videoPlayerRef]);

  const videoPlayer = useCallback(
    () => (
      <VideoPlayer
        ref={videoPlayerRef}
        videoUrl={videoUrl}
        onProgress={onProgress}
        onDuration={(duration) => {
          if (Number.isFinite(duration) && duration >= 0) {
            setVideoDuration(duration);
          }
        }}
      />
    ),
    [videoUrl, onProgress, setVideoDuration],
  );

  return { duration: videoDuration, Player: videoPlayer, seekTo, seekBy, togglePlayback };
};

interface VideoPlayerProps {
  videoUrl: string;
  onProgress?: (state: { playedSeconds: number }) => void;
  onDuration?: (duration: number) => void;
}

export const VideoPlayer = forwardRef<VideoPlayerHandle, VideoPlayerProps>(
  ({ videoUrl, onProgress, onDuration }, ref) => {
    const playerRef = useRef<YouTubeAdapter & HTMLVideoElement>(null);

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
        {videoUrl.startsWith("https://www.youtube.com") ? (
          <YouTubeVideo
            controls
            src={videoUrl}
            mediaRef={playerRef}
            onTimeUpdate={() => {
              if (playerRef.current) {
                onProgress?.({ playedSeconds: playerRef.current.currentTime });
              }
            }}
            onDurationChange={() => {
              if (playerRef.current) {
                onDuration?.(playerRef.current.duration);
              }
            }}
          />
        ) : (
          <NeutralVideoSkin>
            <Video
              playsInline
              mediaRef={playerRef}
              src={videoUrl}
              onTimeUpdate={() => {
                if (playerRef.current) {
                  onProgress?.({ playedSeconds: playerRef.current.currentTime });
                }
              }}
              onDurationChange={() => {
                if (playerRef.current) {
                  onDuration?.(playerRef.current.duration);
                }
              }}
            />
          </NeutralVideoSkin>
        )}
      </VideoJsPlayer>
    );
  },
);
