import fs from "fs";
import path from "path";
import os from "os";
import { getFileHeader } from "../services/LogInterpreterService";

/**
 * Retrieves the path to the Elite Dangerous Journal files based on the user's home directory.
 * @returns A string containing the path to ED Journal files
 */
export function getLogsPath(): string | null {
	const homeDir = os.homedir();
	const edPath = path.join(
		homeDir,
		"Saved Games",
		"Frontier Developments",
		"Elite Dangerous"
	);

	if (fs.existsSync(edPath)) {
		return edPath;
	} else {
		console.warn("🚧 Dossier Elite Dangerous introuvable:", edPath);
		return null;
	}
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
