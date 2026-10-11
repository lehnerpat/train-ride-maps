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
  },
  mapInstance: {
    options: { keyboardPanDelta: 80 },
    panBy: vi.fn(),
  },
}));

vi.mock("./VideoPlayer", async () => {
  const React = await import("react");
  return {
    VideoPlayer: React.forwardRef<
      typeof videoPlayerHandle,
      Record<string, never>
    >((_, ref) => {
      React.useImperativeHandle(ref, () => videoPlayerHandle, []);
      const instanceId = React.useId();
      return React.createElement("div", {
        "data-testid": "video-player",
        "data-instance": instanceId,
      });
    }),
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
  return {
    VideoInfoArea: () =>
      React.createElement("input", { "aria-label": "Video title" }),
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
    const videoPlayerInstance = screen
      .getByTestId("video-player")
      .getAttribute("data-instance");
    fireEvent.click(
      screen.getByRole("button", { name: "Enable keyboard shortcuts" }),
    );

    expect(
      screen.getByTestId("video-player").getAttribute("data-instance"),
    ).toBe(videoPlayerInstance);
    expect(
      screen.getByTestId("live-map").getAttribute("data-keyboard-focused"),
    ).toBe("true");

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
    expect(mapInstance.panBy.mock.calls).toEqual([
      [[0, -80]],
      [[-80, 0]],
      [[0, 80]],
      [[80, 0]],
    ]);
  });

  test("leaves typing and modified key combinations alone", () => {
    renderTrackPlayer();
    fireEvent.click(
      screen.getByRole("button", { name: "Enable keyboard shortcuts" }),
    );

    fireEvent.keyDown(screen.getByRole("textbox", { name: "Video title" }), {
      key: "j",
    });
    fireEvent.keyDown(document, { key: "l", shiftKey: true });
    fireEvent.keyDown(document, { key: "w", ctrlKey: true });

    expect(videoPlayerHandle.seekBy).not.toHaveBeenCalled();
    expect(mapInstance.panBy).not.toHaveBeenCalled();
  });

  test("Space toggles playback without keyboard-focused mode, in either mode", () => {
    const { unmount } = renderTrackPlayer();
    fireEvent.keyDown(document, { key: " " });
    expect(videoPlayerHandle.togglePlayback).toHaveBeenCalledOnce();
    unmount();

    renderTrackPlayer("/track/track-id/view");
    fireEvent.keyDown(document, { key: " " });
    expect(videoPlayerHandle.togglePlayback).toHaveBeenCalledTimes(2);
  });

  test("Space leaves typing, buttons and modified combinations alone", () => {
    renderTrackPlayer();

    fireEvent.keyDown(screen.getByRole("textbox", { name: "Video title" }), {
      key: " ",
    });
    fireEvent.keyDown(
      screen.getByRole("button", { name: "Enable keyboard shortcuts" }),
      { key: " " },
    );
    fireEvent.keyDown(document, { key: " ", ctrlKey: true });

    expect(videoPlayerHandle.togglePlayback).not.toHaveBeenCalled();
  });

  test("Escape removes focus from the focused element", () => {
    renderTrackPlayer();
    const input = screen.getByRole("textbox", { name: "Video title" });
    input.focus();
    expect(document.activeElement).toBe(input);

    fireEvent.keyDown(input, { key: "Escape" });
    expect(document.activeElement).toBe(document.body);
  });
});
