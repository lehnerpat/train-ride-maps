import fs from "fs-extra";
import { globbySync as globby } from "globby";

process.chdir("node_modules/rlayers");

fs.copySync("src", ".", { recursive: true });
const allMaps = globby("**/*.map");
for (const mapPath of allMaps) {
  const m = fs.readJSONSync(mapPath);
  m["sourceRoot"] = "";
  m["sources"] = m["sources"].map((s) => {
    const parts = s.split("/");
    return parts[parts.length - 1];
  });
  fs.writeJSONSync(mapPath, m);
}
