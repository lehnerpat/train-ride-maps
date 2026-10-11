import { createRef } from "react";
import { describe, expect, test, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { VideoPlayer, VideoPlayerHandle } from "./VideoPlayer";

const media = {
  currentTime: 0,
  duration: 123,
  paused: true,
  play: vi.fn(() => Promise.resolve()),
  pause: vi.fn(),
};

vi.mock("@videojs/react/video", () => ({
  VideoPlayer: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  Video: ({ src }: { src?: string }) => <div data-testid="video-src" data-value={src} />,
  NeutralVideoSkin: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock("@videojs/react/media/youtube-video", () => ({
  YouTubeVideo: ({
    mediaRef,
    onTimeUpdate,
    onDurationChange,
    src,
  }: {
    mediaRef: { current: unknown };
    onTimeUpdate: () => void;
    onDurationChange: () => void;
    src: string;
  }) => {
    mediaRef.current = media;
    return (
      <>
        <div data-testid="youtube-src" data-value={src} />
        <button onClick={onDurationChange}>Load video duration</button>
        <button onClick={onTimeUpdate}>Update time</button>
      </>
    );
  },
}));

describe("VideoPlayer", () => {
  test("reports the duration from the player event", () => {
    const onDuration = vi.fn();

    render(
      <VideoPlayer videoUrl="https://www.youtube.com/watch?v=abc" onProgress={() => {}} onDuration={onDuration} />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Load video duration" }));

    expect(onDuration).toHaveBeenCalledWith(123);
  });

  test("reports the played seconds on time updates", () => {
    const onProgress = vi.fn();
    media.currentTime = 7;

    render(
      <VideoPlayer videoUrl="https://www.youtube.com/watch?v=abc" onProgress={onProgress} onDuration={() => {}} />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Update time" }));

    expect(onProgress).toHaveBeenCalledWith({ playedSeconds: 7 });
  });

  test("seeks the video to the requested time", () => {
    const playerRef = createRef<VideoPlayerHandle>();
    render(
      <VideoPlayer
        ref={playerRef}
        videoUrl="https://www.youtube.com/watch?v=abc"
        onProgress={() => {}}
        onDuration={() => {}}
      />,
    );

    playerRef.current?.seekTo(42);

    expect(media.currentTime).toBe(42);
  });

  test("seeks relative to the current time and clamps to the media duration", () => {
    const playerRef = createRef<VideoPlayerHandle>();
    media.currentTime = 5;

    render(
      <VideoPlayer
        ref={playerRef}
        videoUrl="https://www.youtube.com/watch?v=abc"
        onProgress={() => {}}
        onDuration={() => {}}
      />,
    );

    playerRef.current?.seekBy(-10);
    expect(media.currentTime).toBe(0);
    playerRef.current?.seekBy(200);
    expect(media.currentTime).toBe(123);
  });

  test("toggles playback using the YouTube adapter", async () => {
    const playerRef = createRef<VideoPlayerHandle>();
    const play = vi.fn(() => Promise.resolve());
    const pause = vi.fn();
    media.paused = true;
    media.play = play;
    media.pause = pause;

    render(
      <VideoPlayer
        ref={playerRef}
        videoUrl="https://www.youtube.com/watch?v=abc"
        onProgress={() => {}}
        onDuration={() => {}}
      />,
    );

    await playerRef.current?.togglePlayback();
    expect(play).toHaveBeenCalledOnce();
    media.paused = false;
    await playerRef.current?.togglePlayback();
    expect(pause).toHaveBeenCalledOnce();
  });

  test("passes the video URL directly without changing YouTube keyboard settings", () => {
    render(<VideoPlayer videoUrl="https://www.youtube.com/watch?v=abc" onProgress={() => {}} onDuration={() => {}} />);
    expect(screen.getByTestId("youtube-src").getAttribute("data-value")).toBe("https://www.youtube.com/watch?v=abc");
  });
});
