import { describe, expect, test, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { VideoPlayer } from "./VideoPlayer";

vi.mock("react-player", () => ({
  default: ({
    onDurationChange,
  }: {
    onDurationChange?: (event: { currentTarget: { duration: number } }) => void;
  }) => (
    <button onClick={() => onDurationChange?.({ currentTarget: { duration: 123 } })}>Load video duration</button>
  ),
}));

describe("VideoPlayer", () => {
  test("reports the duration from the player event", () => {
    const onDuration = vi.fn();

    render(<VideoPlayer videoUrl="https://example.com/video.mp4" onProgress={() => {}} onDuration={onDuration} />);
    fireEvent.click(screen.getByRole("button", { name: "Load video duration" }));

    expect(onDuration).toHaveBeenCalledWith(123);
  });
});
