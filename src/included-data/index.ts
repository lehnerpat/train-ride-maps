import { Track as TrackV1 } from "../track-models";
import { Track as TrackV2 } from "../track-models/new";
import v20200110_Nishimaizuru_Fukuchiyama from "./2020-01-10_nishimaizuru-fukuchiyama.json";
import v20210319_Hiroshima_Miyoshi from "./2021-03-19_hiroshima-miyoshi.json";
import v22220225_Daiyuzan_Odawara from "./2022-02-25_daiyuzan-odawara.json";

export const IncludedData: TrackV1[] = [
  v22220225_Daiyuzan_Odawara,
  v20210319_Hiroshima_Miyoshi,
  v20200110_Nishimaizuru_Fukuchiyama,
];

export const IncludedDataMap: Map<string, TrackV1> = new Map(IncludedData.map((r) => [r.uuid, r]));
export const IncludedDataMapV2: Map<string, TrackV2> = new Map(/* IncludedData.map((r) => [r.uuid, r]) */);
