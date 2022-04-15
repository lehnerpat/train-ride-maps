import { Track } from "../track-models";
import v20200110_Nishimaizuru_Fukuchiyama from "./2020-01-10_nishimaizuru-fukuchiyama.json";
import v20200515_Okayama_Takamatsu from "./2020-05-15_okayama-takamatsu.json";
import v20210319_Hiroshima_Miyoshi from "./2021-03-19_hiroshima-miyoshi.json";
import v22220225_Daiyuzan_Odawara from "./2022-02-25_daiyuzan-odawara.json";

export const IncludedData: Track[] = [
  v22220225_Daiyuzan_Odawara,
  v20210319_Hiroshima_Miyoshi,
  v20200515_Okayama_Takamatsu,
  v20200110_Nishimaizuru_Fukuchiyama,
];
export const IncludedDataMap: Map<string, Track> = new Map(IncludedData.map((r) => [r.uuid, r]));
