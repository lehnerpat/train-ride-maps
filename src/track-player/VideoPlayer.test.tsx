import { createRef } from "react";
import { describe, expect, test, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { VideoPlayer, VideoPlayerHandle } from "./VideoPlayer";

vi.mock("react-player", async () => {
  const React = await import("react");
  return {
    default: React.forwardRef<
      HTMLVideoElement,
      { onDurationChange?: (event: { currentTarget: { duration: number } }) => void }
    >(({ onDurationChange }, ref) => (
      <>
        <video ref={ref} />
        <button onClick={() => onDurationChange?.({ currentTarget: { duration: 123 } })}>Load video duration</button>
      </>
    )),
  };
});

describe("VideoPlayer", () => {
  test("reports the duration from the player event", () => {
    const onDuration = vi.fn();

    render(<VideoPlayer videoUrl="https://example.com/video.mp4" onProgress={() => {}} onDuration={onDuration} />);
    fireEvent.click(screen.getByRole("button", { name: "Load video duration" }));

    expect(onDuration).toHaveBeenCalledWith(123);
  });

  test("seeks the video to the requested time", () => {
    const playerRef = createRef<VideoPlayerHandle>();
    const { container } = render(
      <VideoPlayer
        ref={playerRef}
        videoUrl="https://example.com/video.mp4"
        onProgress={() => {}}
        onDuration={() => {}}
      />,
    );

    playerRef.current?.seekTo(42);

    expect(container.querySelector("video")?.currentTime).toBe(42);
  });
});
