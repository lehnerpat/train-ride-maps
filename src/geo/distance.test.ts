import { LatLngLiteral } from "leaflet";
import { distanceInMFunctions } from "./distance";

describe("geo distance functions", () => {
  const p1: LatLngLiteral = Object.freeze({ lat: 35.46687, lng: 135.286244 });
  const p2: LatLngLiteral = Object.freeze({ lat: 35.467952, lng: 135.286161 });
  const expected = 120.5;
  const repeatRounds = 100;

  it("all variants", () => {
    const results = distanceInMFunctions.map((f) => {
      const result = f(p1, p2);
      const delta = result - expected;
      const timeStart = performance.now();
      for (let i = 0; i < repeatRounds; i++) {
        f(p1, p2);
      }
      const timeEnd = performance.now();
      return { name: f.name, result, delta, avgDuration: (timeEnd - timeStart) / repeatRounds };
    });
    console.table(results, ["name", "result", "delta", "avgDuration"]);
    console.log("expected:", expected);
  });
});
