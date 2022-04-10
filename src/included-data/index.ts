import { Track as TrackV1 } from "../track-models";
import { Track as TrackV2 } from "../track-models/new";
import v20200110_Nishimaizuru_Fukuchiyama from "./2020-01-10_nishimaizuru-fukuchiyama.json";
import v20210319_Hiroshima_Miyoshi from "./2021-03-19_hiroshima-miyoshi.json";
import v22220225_Daiyuzan_Odawara from "./2022-02-25_daiyuzan-odawara.json";
import v20200110_Nishimaizuru_Fukuchiyama_v2 from "./2020-01-10_nishimaizuru-fukuchiyama_v2.json";
import v20210319_Hiroshima_Miyoshi_v2 from "./2021-03-19_hiroshima-miyoshi_v2.json";
import v22220225_Daiyuzan_Odawara_v2 from "./2022-02-25_daiyuzan-odawara_v2.json";

export const IncludedData: TrackV1[] = [
  v22220225_Daiyuzan_Odawara,
  v20210319_Hiroshima_Miyoshi,
  v20200110_Nishimaizuru_Fukuchiyama,
];

export const IncludedDataMap: Map<string, TrackV1> = new Map(IncludedData.map((r) => [r.uuid, r]));

export const IncludedDataV2: TrackV2[] = [
  v22220225_Daiyuzan_Odawara_v2,
  v20210319_Hiroshima_Miyoshi_v2,
  v20200110_Nishimaizuru_Fukuchiyama_v2,
];
export const IncludedDataMapV2: Map<string, TrackV2> = new Map(IncludedDataV2.map((r) => [r.uuid, r]));
