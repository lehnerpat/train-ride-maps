import { describe, expect, test } from "vitest";
import { render, screen } from "@testing-library/react";
import { LoadSaveFile } from "./LoadSaveFile";

describe("LoadSaveFile", () => {
  test("shows upload and download actions when a download handler is provided", () => {
    render(<LoadSaveFile onDownloadRequested={() => "{}"} />);

    expect(screen.getByRole("button", { name: "Upload file..." })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Download current file..." })).toBeTruthy();
  });

  test("does not show the download action without a download handler", () => {
    render(<LoadSaveFile />);

    expect(screen.getByRole("button", { name: "Upload file..." })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Download current file..." })).toBeNull();
  });
});
