import {
    ConstructionApi,
    HelloApi,
    ShipApi,
} from "../api";
import { Configuration } from "../api/configuration";

export const configuration = new Configuration();
export const constructionApi = new ConstructionApi(configuration);
export const helloApi = new HelloApi(configuration);
export const shipApi = new ShipApi(configuration);