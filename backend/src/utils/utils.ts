import fs from "fs";
import path from "path";
import os from "os";
import { getFileHeader } from "../services/LogInterpreterService";

const JOURNAL_PATH_SEGMENTS = [
	"pfx",
	"drive_c",
	"users",
	"steamuser",
	"Saved Games",
	"Frontier Developments",
	"Elite Dangerous",
];

function getLinuxSteamPaths(homeDir: string): string[] {
	const steamRoots = [
		process.env.XDG_DATA_HOME ? path.join(process.env.XDG_DATA_HOME, "Steam") : null,
		path.join(homeDir, ".local", "share", "Steam"),
		path.join(homeDir, ".steam", "steam"),
		path.join(homeDir, ".var", "app", "com.valvesoftware.Steam", "data", "Steam"),
	].filter((steamRoot): steamRoot is string => steamRoot != null);

	return steamRoots.map((steamRoot) =>
		path.join(steamRoot, "steamapps", "compatdata", "359320", ...JOURNAL_PATH_SEGMENTS)
	);
}

/**
 * Retrieves the path to the Elite Dangerous Journal files for the current operating system.
 * @returns A string containing the path to ED Journal files
 */
export function getLogsPath(): string | null {
	const homeDir = os.homedir();
	const windowsPath = path.join(
		homeDir,
		"Saved Games",
		"Frontier Developments",
		"Elite Dangerous"
	);
	const candidatePaths = process.platform === "linux"
		? getLinuxSteamPaths(homeDir)
		: [windowsPath];
	const logsPath = candidatePaths.find((candidatePath) => fs.existsSync(candidatePath));

	if (logsPath) {
		return logsPath;
	}

	console.warn("🚧 Dossier Elite Dangerous introuvable:", candidatePaths.join(", "));
	return null;
}

/**
 * Retrieves the user's language preference from the latest log file header and maps it to a standard language code.
 * @returns A string representing the user's language code (e.g., "en" for English, "fr" for French). Defaults to "en" if the language cannot be determined.
 */
export function getLanguage(): string {
	try {
		const language = getFileHeader()?.language;
		console.log(language);
		switch (language) {
			case "English/UK":
				return "en";
			case "French/FR":
				return "fr";
			default:
				return "en";
		}
	} catch (error: Error | any) {
		console.warn("🚧 Error fetching Language:", error.message);
		return "en";
	}
}
