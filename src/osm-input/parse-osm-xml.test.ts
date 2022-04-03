import { parseOsmXml } from "./parse-osm-xml";
import * as fs from "fs-extra";
import path from "path";
import { distanceInMM } from "../geo/distance";

describe("parseOsmXml", () => {
  test("it works", async () => {
    const osmXml = await fs.readFile(path.resolve("public/miyamai_line_miyafuku_line.osm"), "utf-8");
    const nodes = parseOsmXml(osmXml);
    let distance = 0;
    for (let i = 0; i < nodes.length - 1; i++) {
      distance += distanceInMM(nodes[i].coord, nodes[i + 1].coord);
    }
    console.log("overall distance", distance, "mm");
  });
});
