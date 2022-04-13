import { Track as TrackV2 } from "../track-models/new";
import v20200110_Nishimaizuru_Fukuchiyama_v2 from "./2020-01-10_nishimaizuru-fukuchiyama_v2.json";
import v20200515_Okayama_Takamatsu from "./2020-05-15_okayama-takamatsu.json";
import v20210319_Hiroshima_Miyoshi_v2 from "./2021-03-19_hiroshima-miyoshi_v2.json";
import v22220225_Daiyuzan_Odawara_v2 from "./2022-02-25_daiyuzan-odawara_v2.json";

export const IncludedDataV2: TrackV2[] = [
  v22220225_Daiyuzan_Odawara_v2,
  v20210319_Hiroshima_Miyoshi_v2,
  v20200515_Okayama_Takamatsu,
  v20200110_Nishimaizuru_Fukuchiyama_v2,
];
export const IncludedDataMapV2: Map<string, TrackV2> = new Map(IncludedDataV2.map((r) => [r.uuid, r]));
