import * as fs from "fs";
import * as path from "path";
import {
	ColonisationConstructionDepot,
	ShipLoadout,
} from "../../../shared/types/log.type";
import { EventEnum } from "../../../shared/types/enum";
import dotenv from "dotenv";
dotenv.config();
const logFile = getLatestLogFile();

export function getLatestLogFile(): string | null {
	const logsDir = process.env.LOGS_DIR;
	if (!logsDir) {
		throw new Error(
			"LOGS_DIR non défini dans les variables d'environnement."
		);
	}
	const files = fs
		.readdirSync(logsDir)
		.filter((f) => /^Journal\..*\.log$/.test(f));
	if (files.length === 0) return null;
	files.sort((a, b) => {
		const dateA = a.split(".")[1];
		const dateB = b.split(".")[1];
		return dateB.localeCompare(dateA); // décroissant
	});
	console.log("File:", path.join(logsDir, files[0]));
	return path.join(logsDir, files[0]);
}

/**
 * A function to get the ShipLoadout
 * @returns A ShipLoadout object or null
 */
export function getLoadout(): ShipLoadout | null {
	if (!logFile) return null;
	const content = fs.readFileSync(logFile, "utf8");
	const lines = content.split("\n").filter((l) => l.trim().length > 0);
	for (const line of lines) {
		try {
			const event = JSON.parse(line);
			if (event.event === EventEnum.Loadout) {
				return event as ShipLoadout;
			}
		} catch {
			continue;
		}
	}
	return null;
}

/**
 * A function to get the latest ConstructionDepot where the commander docked
 * @returns An object, either of type ColonisationConstructionDepot or empty
 */
export function getLatestConstructionDepot():
	| ColonisationConstructionDepot
	| {} {
	if (!logFile) return {};
	const content = fs.readFileSync(logFile, "utf8");
	const lines = content.split("\n").filter((l) => l.trim().length > 0);
	for (const line of lines) {
		try {
			const event = JSON.parse(line);
			if (event.event === EventEnum.ColonisationConstructionDepot) {
				console.log(
					"Found ColonisationConstructionDepot event:",
					event
				);
				return event as ColonisationConstructionDepot;
			}
		} catch {
			continue;
		}
	}
	return {};
}
