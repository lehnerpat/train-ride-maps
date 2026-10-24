import { render } from "@testing-library/react";
import { Router } from "wouter";
import { memoryLocation } from "wouter/memory-location";
import { beforeAll, describe, expect, test, vi } from "vitest";
import { IncludedData } from "../included-data";
import { ViewTrackPage } from "./ViewTrackPage";

// Snapshot of the "view" mode page, to verify that a separate player component
// renders the same output as the current track-editor based implementation.
describe("ViewTrackPage in view mode", () => {
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

  test("renders the page as before", async () => {
    const track = IncludedData[0];
    const { hook } = memoryLocation({ path: `/track/${track.uuid}` });

    const { container } = render(
      <Router hook={hook}>
        <ViewTrackPage trackUuid={track.uuid} mode="view" />
      </Router>,
    );

    await expect(container).toMatchFileSnapshot("./test/track-view.output.html");
  });
});
