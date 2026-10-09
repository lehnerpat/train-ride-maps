import { fireEvent, render, screen } from "@testing-library/react";
import { TimingPointsList } from "./TimingPointsList";

describe("TimingPointsList", () => {
  test("deletes a timing point from its action menu", () => {
    const onDeleteTimingPoint = vi.fn();

    render(
      <TimingPointsList
        timingPoints={[{ uuid: "timing-point-1", t: 12, d: 3456 }]}
        onDeleteTimingPoint={onDeleteTimingPoint}
        precedingIndex={0}
        isAutoScrollOn={false}
      />,
    );

    fireEvent.click(screen.getByRole("button"));
    fireEvent.click(screen.getByRole("menuitem", { name: /^Delete/ }));

    expect(onDeleteTimingPoint).toHaveBeenCalledWith("timing-point-1");
  });
});
