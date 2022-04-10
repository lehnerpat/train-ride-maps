import { LatLngLiteral } from "leaflet";
import { closestPointOnPath, closestPointOnSegment, distanceInMFunctions, distanceInMM } from "./distance";

describe("geo distance functions", () => {
  const p1: LatLngLiteral = Object.freeze({ lat: 35.46687, lng: 135.286244 });
  const p2: LatLngLiteral = Object.freeze({ lat: 35.467952, lng: 135.286161 });
  const expected = 120.5;
  const repeatRounds = 100;

  test("all variants", () => {
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

describe("closestPointOnX", () => {
  const n0 = { lat: 35.2564587, lng: 139.1564383 };
  const n1 = { lat: 35.2566783, lng: 139.156592 };
  const n2 = { lat: 35.2568798, lng: 139.1567186 };
  const n3 = { lat: 35.2573469, lng: 139.1570074 };

  const c1 = { lat: 35.256584020886294, lng: 139.15733392721452 };
  const p1 = { lat: 35.25684747559839, lng: 139.15669609123353 };

  const c2 = { lat: 35.256091651659, lng: 139.15678726538317 };
  const p2 = { lat: 35.2564570711282, lng: 139.15643692016604 };

  const c3 = { lat: 35.257259482447424, lng: 139.15670774404137 };
  const p3 = { lat: 35.25717769343186, lng: 139.156900949624 };

  describe("closestPointOnSegment", () => {
    test("example 1", () => {
      const r1 = closestPointOnSegment(c1, n1, n2);
      const pr1 = r1.closestOnSegment;
      expect(pr1.lat).toBeCloseTo(p1.lat, 4);
      expect(pr1.lng).toBeCloseTo(p1.lng, 4);
      expect(r1.distanceFromPMM).toBeCloseTo(64832.59);
    });

    test("example 2", () => {
      const r2 = closestPointOnSegment(c2, n0, n1);
      const pr2 = r2.closestOnSegment;
      expect(pr2.lat).toBeCloseTo(n0.lat, 4);
      expect(pr2.lng).toBeCloseTo(n0.lng, 4);
      expect(r2.distanceFromPMM).toBeCloseTo(51669.795);
    });

    test("example 3", () => {
      const r3 = closestPointOnSegment(c3, n2, n3);
      const pr3 = r3.closestOnSegment;
      expect(pr3.lat).toBeCloseTo(p3.lat, 4);
      expect(pr3.lng).toBeCloseTo(p3.lng, 4);
      expect(r3.distanceFromPMM).toBeCloseTo(20236.333);
    });
  });
  describe("closestPointOnPath", () => {
    const path = [n0, n1, n2, n3];

    test("example 1", () => {
      const r1 = closestPointOnPath(c1, path)!;
      const pr1 = r1.closestOnSegment;
      expect(pr1.lat).toBeCloseTo(p1.lat, 4);
      expect(pr1.lng).toBeCloseTo(p1.lng, 4);
      expect(r1.distanceFromPMM).toBeCloseTo(64832.59);
      expect(r1.index1).toBe(1);
    });

    test("example 2", () => {
      const x = {
        lat: 35.2566783,
        lng: 139.156592,
      };
      const r2 = closestPointOnPath(c2, path)!;
      const pr2 = r2.closestOnSegment;
      expect(pr2.lat).toBeCloseTo(n0.lat, 2);
      expect(pr2.lng).toBeCloseTo(n0.lng, 2);
      expect(r2.distanceFromPMM).toBeCloseTo(51669.795);
      expect(r2.index1).toBe(0);
    });

    test("example 3", () => {
      const r3 = closestPointOnPath(c3, path)!;
      const pr3 = r3.closestOnSegment;
      expect(pr3.lat).toBeCloseTo(p3.lat, 4);
      expect(pr3.lng).toBeCloseTo(p3.lng, 4);
      expect(r3.distanceFromPMM).toBeCloseTo(20236.333);
      expect(r3.index1).toBe(2);
    });
  });
});
