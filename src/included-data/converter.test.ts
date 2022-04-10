import { IncludedData } from ".";
import { distanceInMM } from "../geo/distance";
import { TimingPoint, Track as TrackV2 } from "../track-models/new";
import fs from "fs-extra";

describe("track converter", () => {
  for (const { uuid, title, videoUrl, trackPoints } of IncludedData) {
    test(uuid, () => {
      const path = trackPoints.map((tp) => tp.p);
      let totalDistance = 0;

      const timingPoints: TimingPoint[] = [{ t: trackPoints[0].t, d: 0 }];
      for (let i = 1; i < trackPoints.length; i++) {
        totalDistance += distanceInMM(trackPoints[i].p, trackPoints[i - 1].p);
        const timingPoint = { t: trackPoints[i].t, d: totalDistance };
        timingPoints.push(timingPoint);
      }
      const trackV2: TrackV2 = {
        uuid,
        title,
        videoUrl,
        path,
        timingPoints,
      };
      console.log(uuid, totalDistance);
      fs.writeFileSync(`${uuid}.json`, JSON.stringify(trackV2));
    });
  }
});
