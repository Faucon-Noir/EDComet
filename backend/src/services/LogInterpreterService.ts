import * as fs from "fs";
import * as path from "path";
import dotenv from "dotenv";
import { getLogsPath } from "../utils/utils";
import { EventEnum } from "../../../shared/types/enum";
import { ShipLoadout } from "../../../shared/types/ship.type";
import { ColonisationConstructionDepot } from "../../../shared/types/colonisation.type";
import { FileHeader } from "../../../shared/types/fileHeader.type";

dotenv.config();
const logFile = getLatestLogFile();
const content = fs.readFileSync(logFile, "utf8");
const lines = content.split("\n").filter((line) => line.trim().length > 0);

export function getLatestLogFile(): string | null {
	const logPaths = getLogsPath();

	const files = fs
		.readdirSync(logPaths)
		.filter((f) => /^Journal\..*\.log$/.test(f));
	if (files.length === 0) return null;
	files.sort((a, b) => {
		const dateA = a.split(".")[1];
		const dateB = b.split(".")[1];
		return dateB.localeCompare(dateA); // décroissant
	});
	console.log("📁 File:", files[0]);
	return path.join(logPaths, files[0]);
}

/**
 * A function to get the ShipLoadout
 * @returns A ShipLoadout object or null
 */
export function getLoadout(): ShipLoadout | null {
	if (!logFile) return null;
	for (const line of lines) {
		try {
			const event = JSON.parse(line);
			if (event.event === EventEnum.Loadout) {
				return event as ShipLoadout;
			}
		} catch (err) {
			console.warn("⚠️ Loadout Interpreter", err);
			continue;
		}
	}
	return null;
}

/**
 * A function to get the latest ConstructionDepot where the commander docked
 * @returns An object, either of type ColonisationConstructionDepot or empty
 */
export function getLatestConstructionDepot(): ColonisationConstructionDepot | null {
	if (!logFile) return null;
	for (const line of lines) {
		try {
			const event = JSON.parse(line);
			if (event.event === EventEnum.ColonisationConstructionDepot) {
				console.log(
					"✅Found ColonisationConstructionDepot event:",
					event
				);
				return event as ColonisationConstructionDepot;
			}
		} catch (err) {
			console.warn("⚠️ Latest Construction Interpreter:", err);
			continue;
		}
	}
	return null;
}

export function getFileHeader(): FileHeader | null {
	if (!logFile) return null;
	// if (!fileHeader) {
	// 	console.warn("⚠️ No FileHeader found in logs, defaulting to 'en'");
	// }
	for (const line of lines) {
		try {
			const event = JSON.parse(line);
			if (event.event === EventEnum.FileHeader) {
				return event as FileHeader;
			}
		} catch (err) {
			console.warn("⚠️ File Header Interpreter:", err);
			continue;
		}
	}
	return null;
}
