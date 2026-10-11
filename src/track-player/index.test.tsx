import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { Router, useLocation } from "wouter";
import { memoryLocation } from "wouter/memory-location";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { Track } from "../track-models";
import { TrackPlayer } from "./index";

const { videoPlayerHandle, mapInstance } = vi.hoisted(() => ({
  videoPlayerHandle: {
    seekTo: vi.fn(),
    seekBy: vi.fn(),
    togglePlayback: vi.fn(() => Promise.resolve()),
    preservePlaybackOnKeyboardModeChange: vi.fn(),
  },
  mapInstance: {
    options: { keyboardPanDelta: 80 },
    panBy: vi.fn(),
  },
}));

vi.mock("./VideoPlayer", async () => {
  const React = await import("react");
  return {
    VideoPlayer: React.forwardRef<typeof videoPlayerHandle, { isKeyboardFocusedModeOn: boolean }>(
      ({ isKeyboardFocusedModeOn }, ref) => {
        React.useImperativeHandle(ref, () => videoPlayerHandle, []);
        return React.createElement("div", {
          "data-testid": "video-player",
          "data-keyboard-focused": String(isKeyboardFocusedModeOn),
        });
      },
    ),
  };
});

vi.mock("./LiveMap", async () => {
  const React = await import("react");
  return {
    LiveMap: ({
      isKeyboardFocusedModeOn,
      onMapReady,
    }: {
      isKeyboardFocusedModeOn: boolean;
      onMapReady?: (map: typeof mapInstance | null) => void;
    }) => {
      React.useEffect(() => {
        onMapReady?.(mapInstance);
        return () => onMapReady?.(null);
      }, [onMapReady]);
      return React.createElement("div", {
        "data-testid": "live-map",
        "data-keyboard-focused": String(isKeyboardFocusedModeOn),
      });
    },
  };
});

vi.mock("./VideoInfoArea", async () => {
  const React = await import("react");
  return { VideoInfoArea: () => React.createElement("input", { "aria-label": "Video title" }) };
});
vi.mock("./TimingPointsList", () => ({ TimingPointsList: () => null }));
vi.mock("./straight-rails-overlay", () => ({ StraightRailsOverlay: () => null }));

const track: Track = {
  uuid: "track-id",
  title: "Test track",
  videoUrl: "https://www.youtube.com/watch?v=test",
  path: [],
  timingPoints: [],
};

const TrackPlayerForCurrentLocation = () => {
  const [location] = useLocation();
  const mode = location.endsWith("/edit") ? "edit" : "view";
  return <TrackPlayer initialTrack={track} mode={mode} />;
};

function renderTrackPlayer(path = "/track/track-id/edit") {
  const { hook } = memoryLocation({ path });
  return render(
    <Router hook={hook}>
      <TrackPlayerForCurrentLocation />
    </Router>,
  );
}

describe("TrackPlayer keyboard-focused mode", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("J/K/L control the video and W/A/S/D pan by Leaflet's keyboard delta", async () => {
    renderTrackPlayer();
    fireEvent.click(screen.getByRole("button", { name: "Enable keyboard shortcuts" }));

    expect(screen.getByTestId("video-player").getAttribute("data-keyboard-focused")).toBe("true");
    expect(screen.getByTestId("live-map").getAttribute("data-keyboard-focused")).toBe("true");

    fireEvent.keyDown(document, { key: "j" });
    fireEvent.keyDown(document, { key: "k" });
    fireEvent.keyDown(document, { key: "l" });
    expect(videoPlayerHandle.seekBy).toHaveBeenNthCalledWith(1, -10);
    expect(videoPlayerHandle.togglePlayback).toHaveBeenCalledOnce();
    expect(videoPlayerHandle.seekBy).toHaveBeenNthCalledWith(2, 10);

    fireEvent.keyDown(document, { key: "w" });
    fireEvent.keyDown(document, { key: "a" });
    fireEvent.keyDown(document, { key: "s" });
    fireEvent.keyDown(document, { key: "d" });
    expect(mapInstance.panBy.mock.calls).toEqual([[[0, -80]], [[-80, 0]], [[0, 80]], [[80, 0]]]);
  });

  test("leaves typing and modified key combinations alone", () => {
    renderTrackPlayer();
    fireEvent.click(screen.getByRole("button", { name: "Enable keyboard shortcuts" }));

    fireEvent.keyDown(screen.getByRole("textbox", { name: "Video title" }), { key: "j" });
    fireEvent.keyDown(document, { key: "l", shiftKey: true });
    fireEvent.keyDown(document, { key: "w", ctrlKey: true });

    expect(videoPlayerHandle.seekBy).not.toHaveBeenCalled();
    expect(mapInstance.panBy).not.toHaveBeenCalled();
  });

  test("turns keyboard-focused mode off when leaving Editing mode", async () => {
    renderTrackPlayer();
    fireEvent.click(screen.getByRole("button", { name: "Enable keyboard shortcuts" }));
    fireEvent.click(screen.getByRole("button", { name: "Viewing" }));

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Enable keyboard shortcuts" }).hasAttribute("disabled")).toBe(true);
      expect(screen.getByTestId("video-player").getAttribute("data-keyboard-focused")).toBe("false");
    });

    expect(videoPlayerHandle.preservePlaybackOnKeyboardModeChange).toHaveBeenCalledTimes(2);
    fireEvent.keyDown(document, { key: "j" });
    expect(videoPlayerHandle.seekBy).not.toHaveBeenCalled();
  });

  test("keeps the keyboard-mode toggle disabled in Viewing mode", () => {
    renderTrackPlayer("/track/track-id/view");
    expect(screen.getByRole("button", { name: "Enable keyboard shortcuts" }).hasAttribute("disabled")).toBe(true);
  });
});
