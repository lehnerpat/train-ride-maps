import { afterAll, beforeAll, describe, expect, test, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { LiveMap } from "./LiveMap";
import { DefaultViewOptions } from "./ViewOptions";
import { Track } from "../track-models";

const path = [
  { lat: 52.5, lng: 13.4 },
  { lat: 52.51, lng: 13.41 },
  { lat: 52.52, lng: 13.42 },
];

const TestMap = () => {
  const trackState = useState<Track>({
    title: "test",
    videoUrl: "https://www.youtube.com/watch?v=test",
    path: path.map((p, i) => ({ ...p, uuid: `p${i}` })),
    timingPoints: [],
  } as unknown as Track);
  return (
    <div style={{ width: 400, height: 400 }}>
      <LiveMap
        trackState={trackState}
        path={path}
        timingPointLocations={[]}
        onMapMoved={() => {}}
        initialCenter={path[0]}
        currentCenter={path[0]}
        playedSeconds={0}
        isEditingModeOn={true}
        viewOptions={DefaultViewOptions.mapViewOptions}
      />
    </div>
  );
};

describe("LiveMap", () => {
  beforeAll(() => {
    vi.stubGlobal(
      "ResizeObserver",
      class {
        observe() {}
        unobserve() {}
        disconnect() {}
      },
    );
  });
  afterAll(() => {
    vi.unstubAllGlobals();
  });

  test("renders the map with zoom controls and toggles path editing", () => {
    const { container } = render(<TestMap />);

    expect(container.querySelector(".leaflet-container")).not.toBeNull();

    const editButton = screen.getByTitle("Edit track geometry");
    fireEvent.click(editButton);
    fireEvent.click(editButton);
  });
});
