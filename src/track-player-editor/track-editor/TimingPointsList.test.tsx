import { describe, expect, test, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { TimingPointsList } from "./TimingPointsList";

describe("TimingPointsList", () => {
  test("deletes a timing point from its action menu", () => {
    const onDeleteTimingPoint = vi.fn();

    render(
      <TimingPointsList
        timingPoints={[{ uuid: "timing-point-1", t: 12, d: 3456 }]}
        onDeleteTimingPoint={onDeleteTimingPoint}
        onJumpToTime={() => {}}
        onJumpToLocation={() => {}}
        isAutoScrollOn={false}
        timingPointProgressState={{ type: "before-first", first: { t: 12, d: 3456, index: 0 } }}
      />,
    );

    fireEvent.click(screen.getByRole("button"));
    fireEvent.click(screen.getByRole("menuitem", { name: /^Delete/ }));

    expect(onDeleteTimingPoint).toHaveBeenCalledWith("timing-point-1");
  });

  test("jumps to the timing point's time and location from its action menu", () => {
    const onJumpToTime = vi.fn();
    const onJumpToLocation = vi.fn();

    render(
      <TimingPointsList
        timingPoints={[{ uuid: "timing-point-1", t: 12, d: 3456 }]}
        onDeleteTimingPoint={() => {}}
        onJumpToTime={onJumpToTime}
        onJumpToLocation={onJumpToLocation}
        isAutoScrollOn={false}
        timingPointProgressState={{ type: "before-first", first: { t: 12, d: 3456, index: 0 } }}
      />,
    );

    fireEvent.click(screen.getByRole("button"));
    fireEvent.click(screen.getByRole("menuitem", { name: "Jump to time" }));
    fireEvent.click(screen.getByRole("button"));
    fireEvent.click(screen.getByRole("menuitem", { name: "Jump to location" }));

    expect(onJumpToTime).toHaveBeenCalledWith(12);
    expect(onJumpToLocation).toHaveBeenCalledWith(3456);
  });
});
