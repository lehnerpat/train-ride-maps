import { createRef } from "react";
import { describe, expect, test, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { VideoPlayer, VideoPlayerHandle } from "./VideoPlayer";

const media = { currentTime: 0, duration: 123 };

vi.mock("@videojs/react/video", () => ({
  VideoPlayer: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  NeutralVideoSkin: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock("@videojs/react/media/youtube-video", () => ({
  YouTubeVideo: ({
    mediaRef,
    onTimeUpdate,
    onDurationChange,
  }: {
    mediaRef: { current: unknown };
    onTimeUpdate: () => void;
    onDurationChange: () => void;
  }) => {
    mediaRef.current = media;
    return (
      <>
        <button onClick={onDurationChange}>Load video duration</button>
        <button onClick={onTimeUpdate}>Update time</button>
      </>
    );
  },
}));

describe("VideoPlayer", () => {
  test("reports the duration from the player event", () => {
    const onDuration = vi.fn();

    render(<VideoPlayer videoUrl="https://example.com/video.mp4" onProgress={() => {}} onDuration={onDuration} />);
    fireEvent.click(screen.getByRole("button", { name: "Load video duration" }));

    expect(onDuration).toHaveBeenCalledWith(123);
  });

  test("reports the played seconds on time updates", () => {
    const onProgress = vi.fn();
    media.currentTime = 7;

    render(<VideoPlayer videoUrl="https://example.com/video.mp4" onProgress={onProgress} onDuration={() => {}} />);
    fireEvent.click(screen.getByRole("button", { name: "Update time" }));

    expect(onProgress).toHaveBeenCalledWith({ playedSeconds: 7 });
  });

  test("seeks the video to the requested time", () => {
    const playerRef = createRef<VideoPlayerHandle>();
    render(
      <VideoPlayer
        ref={playerRef}
        videoUrl="https://example.com/video.mp4"
        onProgress={() => {}}
        onDuration={() => {}}
      />,
    );

    playerRef.current?.seekTo(42);

    expect(media.currentTime).toBe(42);
  });
});
