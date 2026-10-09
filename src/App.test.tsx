import { beforeEach, describe, expect, test } from "vitest";
import { render, screen } from "@testing-library/react";
import App from "./App";
import { IncludedData } from "./included-data";

describe("App routing", () => {
  beforeEach(() => {
    window.history.replaceState({}, "", "/");
  });

  test("opens a route from the URL hash", () => {
    window.location.hash = "#/osm-import";

    render(<App />);

    expect(screen.getByRole("heading", { name: "OSM Import" })).toBeTruthy();
  });

  test("renders track links with hash-based URLs", () => {
    render(<App />);

    const trackLink = screen.getByRole("link", { name: IncludedData[0].title });
    expect(trackLink.getAttribute("href")).toBe(`#/track/${IncludedData[0].uuid}`);
  });
});
