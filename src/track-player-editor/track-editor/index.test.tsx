import { fireEvent, render, screen } from "@testing-library/react";
import { Router } from "wouter";
import { memoryLocation } from "wouter/memory-location";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { Track } from "../../track-models";
import { TrackEditor } from "./index";

const { videoPlayerHandle, mapInstance } = vi.hoisted(() => ({
  videoPlayerHandle: {
    seekTo: vi.fn(),
    seekBy: vi.fn(),
    togglePlayback: vi.fn(() => Promise.resolve()),
  },
  mapInstance: {
    options: { keyboardPanDelta: 80 },
    panBy: vi.fn(),
  },
}));

vi.mock("./VideoPlayer", async () => {
  const React = await import("react");
  const VideoPlayer = React.forwardRef<
    typeof videoPlayerHandle,
    {
      videoUrl: string;
      onProgress?: (state: { playedSeconds: number }) => void;
      onDuration?: (duration: number) => void;
    }
  >((_, ref) => {
    React.useImperativeHandle(ref, () => videoPlayerHandle, []);
    const instanceId = React.useId();
    return React.createElement("div", {
      "data-testid": "video-player",
      "data-instance": instanceId,
    });
  });

  return {
    VideoPlayer,
    useVideoPlayer: ({
      videoUrl,
      onProgress,
    }: {
      videoUrl: string;
      onProgress: (state: { playedSeconds: number }) => void;
    }) => {
      const videoPlayerRef = React.useRef<typeof videoPlayerHandle | null>(null);
      const Player = React.useCallback(
        () => React.createElement(VideoPlayer, { ref: videoPlayerRef, videoUrl, onProgress }),
        [videoUrl, onProgress],
      );

      return {
        duration: undefined,
        Player,
        seekTo: (timeSeconds: number) => videoPlayerRef.current?.seekTo(timeSeconds),
        seekBy: (offsetSeconds: number) => videoPlayerRef.current?.seekBy(offsetSeconds),
        togglePlayback: () => videoPlayerRef.current?.togglePlayback(),
      };
    },
  };
});

vi.mock("./LiveMap", async () => {
  const React = await import("react");
  return {
    EditingLiveMap: ({ isKeyboardFocusedModeOn }: { isKeyboardFocusedModeOn: boolean }) => {
      React.useEffect(() => {
        return () => {};
      }, []);
      return React.createElement("div", {
        "data-testid": "live-map",
        "data-keyboard-focused": String(isKeyboardFocusedModeOn),
      });
    },
  };
});

vi.mock("./VideoInfoArea", async () => {
  const React = await import("react");
  return {
    VideoInfoArea: () => React.createElement("input", { "aria-label": "Video title" }),
  };
});
vi.mock("./TimingPointsList", () => ({ TimingPointsList: () => null }));
vi.mock("./straight-rails-overlay", () => ({
  StraightRailsOverlay: () => null,
}));

const track: Track = {
  uuid: "track-id",
  title: "Test track",
  videoUrl: "https://www.youtube.com/watch?v=test",
  path: [],
  timingPoints: [],
};

function renderTrackEditor(path = "/track/track-id/edit") {
  const { hook } = memoryLocation({ path });
  return render(
    <Router hook={hook}>
      <TrackEditor initialTrack={track} />
    </Router>,
  );
}

describe("TrackEditor keyboard-focused mode", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("W/S control the video", async () => {
    renderTrackEditor();
    const videoPlayerInstance = screen.getByTestId("video-player").getAttribute("data-instance");
    fireEvent.click(screen.getByRole("button", { name: "Enable keyboard shortcuts" }));

    expect(screen.getByTestId("video-player").getAttribute("data-instance")).toBe(videoPlayerInstance);

    fireEvent.keyDown(document, { key: "s" });
    fireEvent.keyDown(document, { key: "d" });
    expect(videoPlayerHandle.seekBy).toHaveBeenNthCalledWith(1, -10);
    expect(videoPlayerHandle.seekBy).toHaveBeenNthCalledWith(2, 10);
  });

  test("leaves typing and modified key combinations alone", () => {
    renderTrackEditor();
    fireEvent.click(screen.getByRole("button", { name: "Enable keyboard shortcuts" }));

    fireEvent.keyDown(screen.getByRole("textbox", { name: "Video title" }), {
      key: "j",
    });
    fireEvent.keyDown(document, { key: "l", shiftKey: true });
    fireEvent.keyDown(document, { key: "w", ctrlKey: true });

    expect(videoPlayerHandle.seekBy).not.toHaveBeenCalled();
    expect(mapInstance.panBy).not.toHaveBeenCalled();
  });

  test("Space toggles playback without keyboard-focused mode, in either mode", () => {
    const { unmount } = renderTrackEditor();
    fireEvent.keyDown(document, { key: " " });
    expect(videoPlayerHandle.togglePlayback).toHaveBeenCalledOnce();
    unmount();

    renderTrackEditor("/track/track-id/view");
    fireEvent.keyDown(document, { key: " " });
    expect(videoPlayerHandle.togglePlayback).toHaveBeenCalledTimes(2);
  });

  test("Space leaves typing, buttons and modified combinations alone", () => {
    renderTrackEditor();

    fireEvent.keyDown(screen.getByRole("textbox", { name: "Video title" }), {
      key: " ",
    });
    fireEvent.keyDown(screen.getByRole("button", { name: "Enable keyboard shortcuts" }), { key: " " });
    fireEvent.keyDown(document, { key: " ", ctrlKey: true });

    expect(videoPlayerHandle.togglePlayback).not.toHaveBeenCalled();
  });

  test("Escape removes focus from the focused element", () => {
    renderTrackEditor();
    const input = screen.getByRole("textbox", { name: "Video title" });
    input.focus();
    expect(document.activeElement).toBe(input);

    fireEvent.keyDown(input, { key: "Escape" });
    expect(document.activeElement).toBe(document.body);
  });
});
