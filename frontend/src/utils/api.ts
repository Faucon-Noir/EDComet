import {
  ConstructionApi,
  HelloApi,
  JournalApiAxiosParamCreator,
  ShipApi,
  StatsApi,
} from "../api";
import { BASE_PATH } from "../api/base";
import { Configuration } from "../api/configuration";

const configuration = new Configuration();
export const constructionApi = new ConstructionApi(configuration);
export const helloApi = new HelloApi(configuration);
export const shipApi = new ShipApi(configuration);
export const statsApi = new StatsApi(configuration);

export async function getJournalStreamUrl(): Promise<string> {
  const { url } = await JournalApiAxiosParamCreator(configuration).stream();
  return `${BASE_PATH}${url}`;
}
