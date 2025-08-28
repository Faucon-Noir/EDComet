import { EventEnum } from "./enum";

export interface FileHeader {
	timestamp: Date;
	event: EventEnum.FileHeader;
	part: number;
	language: string;
	Odyssey: boolean;
	gameversion: string;
	build: string;
}
