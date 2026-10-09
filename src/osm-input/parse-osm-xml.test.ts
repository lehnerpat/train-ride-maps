import { describe, expect, test } from "vitest";
import { parseOsmXml } from "./parse-osm-xml";
import { readFile } from "node:fs/promises";
import path from "path";
import { distanceInMM } from "../geo/distance";

describe("parseOsmXml", () => {
  test("parses the route nodes and calculates its total distance", async () => {
    const osmXml = await readFile(path.resolve(__dirname, "test-data/miyamai_line_miyafuku_line.osm"), "utf-8");
    const nodes = parseOsmXml(osmXml);
    let distance = 0;
    for (let i = 0; i < nodes.length - 1; i++) {
      distance += distanceInMM(nodes[i].coord, nodes[i + 1].coord);
    }

    expect(nodes).toHaveLength(985);
    expect(Math.round(distance / 1000)).toBe(55340);
  });
});
