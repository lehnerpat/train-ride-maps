import { parseOsmXml } from "./parse-osm-xml";
import * as fs from "fs-extra";

describe("parseOsmXml", () => {
  test("it works", async () => {
    const osmXml = await fs.readFile("/Users/nevik/Downloads/export.osm", "utf-8");
    parseOsmXml(osmXml);
  });
});
