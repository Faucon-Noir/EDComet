import { EventEnum } from "./enum.js";

export interface CommanderType {
    timestamp: string;
    event: EventEnum.Commander;
    FID: string;
    Name: string;
}