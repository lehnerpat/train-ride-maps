import { describe, expect, test, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { VideoInfoArea } from "./VideoInfoArea";

function renderArea(onTrackInfoChanged = vi.fn()) {
  render(
    <VideoInfoArea
      trackTitle="My track"
      videoUrl="https://example.com/v"
      pathLengthMM={0}
      onTrackInfoChanged={onTrackInfoChanged}
      onPathUploaded={vi.fn()}
      onReversePathClicked={vi.fn()}
    />,
  );
  fireEvent.click(screen.getByTitle("Edit track info"));
  return onTrackInfoChanged;
}

describe("VideoInfoArea track info editing", () => {
  test("saves valid changes", () => {
    const onChanged = renderArea();
    fireEvent.change(screen.getByLabelText(/Title/), { target: { value: " New title " } });
    fireEvent.change(screen.getByLabelText(/Video URL/), { target: { value: "https://example.com/new" } });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(onChanged).toHaveBeenCalledWith("New title", "https://example.com/new");
    expect(screen.queryByRole("button", { name: "Save" })).toBeNull();
  });

  test("disables save for invalid input", () => {
    renderArea();
    fireEvent.change(screen.getByLabelText(/Video URL/), { target: { value: "http://x" } });
    expect((screen.getByRole("button", { name: "Save" }) as HTMLButtonElement).disabled).toBe(true);
    fireEvent.change(screen.getByLabelText(/Video URL/), { target: { value: "https://x" } });
    fireEvent.change(screen.getByLabelText(/Title/), { target: { value: "" } });
    expect((screen.getByRole("button", { name: "Save" }) as HTMLButtonElement).disabled).toBe(true);
  });

  test("cancel discards the draft", () => {
    const onChanged = renderArea();
    fireEvent.change(screen.getByLabelText(/Title/), { target: { value: "Other" } });
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onChanged).not.toHaveBeenCalled();
    expect(screen.getByText("Title: My track")).toBeTruthy();
  });
});
