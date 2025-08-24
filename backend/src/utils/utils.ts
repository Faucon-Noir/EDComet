import fs from "fs";
import path from "path";
import os from "os";

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
