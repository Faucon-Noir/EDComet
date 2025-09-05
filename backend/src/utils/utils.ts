import fs from "fs";
import path from "path";
import os from "os";
import { getFileHeader } from "../services/LogInterpreterService";

/**
 *
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
		console.warn("⚠️ Dossier Elite Dangerous introuvable:", edPath);
		return null;
	}
}

export function getLanguage(): string {
	try {
		const language = getFileHeader().language;
		console.log(language); 
		switch (language) {
			case "English/UK":
				return "en";
			case "French/FR":
				return "fr";
			default:
				return "en";
		}
	} catch (error) {
		console.warn("⚠️ Error fetching Language:", error.message);
		return "en";
	}
}
