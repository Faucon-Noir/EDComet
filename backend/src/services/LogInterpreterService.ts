import * as fs from "fs";
import * as path from "path";
import dotenv from "dotenv";
import { getLogsPath } from "../utils/utils";
import { LogFileWatcher } from "../utils/watcher";
import { EventEnum, ShipLoadout, ColonisationConstructionDepot, FileHeader, getErrorMessage } from "ed-shared";

dotenv.config();
const logFile: string = getLatestLogFile();
const content: string = fs.readFileSync(logFile, "utf8");
const lines: string[] = content
	.split("\n")
	.filter((line): boolean => line.trim().length > 0);

let latestLoadout: ShipLoadout | null = null;
let latestDepot: ColonisationConstructionDepot | null = null;
let latestFileHeader: FileHeader | null = null;

const watcher = new LogFileWatcher();
watcher.on("line", (line: string) => {
	try {
		const event = JSON.parse(line);
		if (event.event === EventEnum.Loadout) {
			latestLoadout = event as ShipLoadout;
		}
		if (event.event === EventEnum.ColonisationConstructionDepot) {
			latestDepot = event as ColonisationConstructionDepot;
		}
		if (event.event === EventEnum.FileHeader) {
			latestFileHeader = event as FileHeader;
		}
	} catch (err: any) {
		console.log("🚧 Watch error", err.message);
	}
});

/**
 * A function to get the LatestLogFile path
 * @returns A string containing the path of the LatestLogFile
 * @throws Error when logs path is unavailable or no journal log file is found
 */
export function getLatestLogFile(): string {
	const logPaths = getLogsPath();
	if (!logPaths) {
		throw new Error("Logs path is unavailable.");
	}
	const files = fs
		.readdirSync(logPaths)
		.filter((f): boolean => /^Journal\..*\.log$/.test(f));
	if (files.length === 0) {
		throw new Error("No journal log file found in logs path.");
	}
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
	if (latestLoadout != null) {
		return latestLoadout;
	}
	let lastLoadout: ShipLoadout | null = null;
	for (const line of lines) {
		try {
			const event = JSON.parse(line);
			if (event.event === EventEnum.Loadout) {
				lastLoadout = event as ShipLoadout;
			}
		} catch (err: unknown) {
			console.warn("🚧 Loadout Interpreter", getErrorMessage(err));
		}
	}
	if (!lastLoadout) {
		return null;
	}
	console.log(
		"✅ Found Loadout event:",
		lastLoadout.Ship,
		lastLoadout.CargoCapacity
	);
	return lastLoadout;
}

/**
 * A function to get the latest ConstructionDepot where the commander docked
 * @returns An object, either of type ColonisationConstructionDepot or null
 */
export function getLatestConstructionDepot(): ColonisationConstructionDepot | null {
	if (!logFile) return null;
	if (latestDepot != null) {
		return latestDepot;
	}
	let lastDepot: ColonisationConstructionDepot | null = null;
	try {
		for (const line of lines) {
			try {
				const event = JSON.parse(line);
				if (event.event === EventEnum.ColonisationConstructionDepot) {
					lastDepot = event as ColonisationConstructionDepot;
				}
			} catch (err: unknown) {
				console.warn("🚧 Latest Construction foreach:", getErrorMessage(err));
				continue;
			}
		}
		if (!lastDepot) {
			return null;
		}
		console.log(
			"✅ Found ColonisationConstructionDepot event:",
			lastDepot.MarketID,
			lastDepot.ConstructionProgress * 100,
			lastDepot.timestamp
		);
	} catch (error: unknown) {
		console.warn("🚧 Latest Construction Interpreter:", getErrorMessage(error));
		return null;
	}

	return lastDepot;
}

/**
 * A function to get the latest FileHeader and its payload
 * @returns An object, either of type FileHeader or null
 */
export function getFileHeader(): FileHeader | null {
	if (!logFile) return null;
	if (latestFileHeader != null) {
		return latestFileHeader;
	}
	let lastFileHeader: FileHeader | null = null;
	try {
		for (const line of lines) {
			try {
				const event = JSON.parse(line);
				if (event.event === EventEnum.FileHeader) {
					lastFileHeader = event as FileHeader;
				}
			} catch (err: unknown) {
				console.warn("🚧 File Header foreach:", getErrorMessage(err));
				continue;
			}
		}
		if (!lastFileHeader) {
			return null;
		}
		console.log(
			"✅ Found FileHeader event:",
			lastFileHeader.gameversion,
			lastFileHeader.language,
			lastFileHeader.timestamp
		);
	} catch (error: unknown) {
		console.warn("🚧 File Header Interpreter:", getErrorMessage(error));
		return null;
	}

	return lastFileHeader;
}
