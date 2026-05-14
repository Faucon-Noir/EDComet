import * as fs from "fs";
import * as path from "path";
import { getLogsPath } from "../utils/utils";
import { LogFileWatcher, type WatchedFileChange } from "../utils/watcher";
import { EventEnum, ShipLoadout, ColonisationConstructionDepot, FileHeader, getErrorMessage } from "ed-shared";

let latestLoadout: ShipLoadout | null = null;
let latestDepot: ColonisationConstructionDepot | null = null;
let latestFileHeader: FileHeader | null = null;

// SSE batching: accumulate changes over 1 second
export type EventChangeMap = Record<EventEnum, string>;

export interface JournalFileChangeEvent {
	fileName: string;
	filePath: string;
	change: "created" | "updated";
	type: "journal-switched" | "support-file";
}

const pendingEvents = new Set<EventEnum>();
const pendingChanges = new Map<EventEnum, string>();
let updateCallbacks: ((events: EventEnum[], changes: EventChangeMap) => void)[] = [];
const pendingFileChanges = new Map<string, JournalFileChangeEvent>();
let fileChangeCallbacks: ((changes: JournalFileChangeEvent[]) => void)[] = [];
let batchInterval: NodeJS.Timeout | null = null;

function startBatchInterval(): void {
	if (batchInterval) return;
	
	batchInterval = setInterval(() => {
		if (pendingEvents.size > 0) {
			const events = Array.from(pendingEvents);
			const changes: EventChangeMap = {} as EventChangeMap;
			pendingChanges.forEach((change, eventType) => {
				changes[eventType] = change;
			});
			pendingEvents.clear();
			pendingChanges.clear();
			updateCallbacks.forEach(callback => callback(events, changes));
		}

		if (pendingFileChanges.size > 0) {
			const changes = Array.from(pendingFileChanges.values());
			pendingFileChanges.clear();
			fileChangeCallbacks.forEach((callback) => callback(changes));
		}
	}, 500);
}

function readJournalLines(logFile: string): string[] {
	const content = fs.readFileSync(logFile, "utf8");
	return content
		.split("\n")
		.filter((line): boolean => line.trim().length > 0);
}

function cacheRelevantEvent(event: unknown): void {
	if (typeof event !== "object" || event == null || !("event" in event)) {
		return;
	}

	if (event.event === EventEnum.Loadout) {
		latestLoadout = event as ShipLoadout;
		recordEventChange(EventEnum.Loadout);
	}
	if (event.event === EventEnum.ColonisationConstructionDepot) {
		latestDepot = event as ColonisationConstructionDepot;
		recordEventChange(EventEnum.ColonisationConstructionDepot);
	}
	if (event.event === EventEnum.FileHeader) {
		latestFileHeader = event as FileHeader;
		recordEventChange(EventEnum.FileHeader);
	}
}

function refreshStateFromJournal(logFile: string): void {
	latestLoadout = null;
	latestDepot = null;
	latestFileHeader = null;

	for (const line of readJournalLines(logFile)) {
		try {
			cacheRelevantEvent(JSON.parse(line));
		} catch (err: unknown) {
			console.warn("🚧 Journal refresh parse error", getErrorMessage(err));
		}
	}
}

function recordFileChange(change: WatchedFileChange): void {
	pendingFileChanges.set(`${change.type}:${change.fileName}`, {
		fileName: change.fileName,
		filePath: change.filePath,
		change: change.change,
		type: change.type,
	});
	startBatchInterval();
}

function generateLoadoutSummary(loadout: ShipLoadout): string {
	return `Ship: ${loadout.Ship} (${loadout.CargoCapacity} cargo)`;
}

function generateDepotSummary(depot: ColonisationConstructionDepot): string {
	const progressPercent = (depot.ConstructionProgress * 100).toFixed(1);
	const resourcesCount = depot.ResourcesRequired?.length ?? 0;
	return `Progress: ${progressPercent}% (${resourcesCount} resources)`;
}

function generateFileHeaderSummary(fileHeader: FileHeader): string {
	return `Version: ${fileHeader.gameversion} - Language: ${fileHeader.language}`;
}

function recordEventChange(eventType: EventEnum): void {
	let summary = "Unknown change";
	
	if (eventType === EventEnum.Loadout && latestLoadout) {
		summary = generateLoadoutSummary(latestLoadout);
	} else if (eventType === EventEnum.ColonisationConstructionDepot && latestDepot) {
		summary = generateDepotSummary(latestDepot);
	} else if (eventType === EventEnum.FileHeader && latestFileHeader) {
		summary = generateFileHeaderSummary(latestFileHeader);
	}
	
	pendingEvents.add(eventType);
	pendingChanges.set(eventType, summary);
	startBatchInterval();
}

const watcher = new LogFileWatcher();
watcher.on("line", (line: string) => {
	try {
		cacheRelevantEvent(JSON.parse(line));
	} catch (err: any) {
		console.log("🚧 Watch error", err.message);
	}
});
watcher.on("file-change", (change: WatchedFileChange) => {
	if (change.type === "journal-switched") {
		refreshStateFromJournal(change.filePath);
	}

	recordFileChange(change);
});

/**
 * A function to get the LatestLogFile path
 * @returns A string containing the path of the LatestLogFile
 * @throws Error when logs path is unavailable or no journal log file is found
 */
export function  getLatestLogFile(): string {
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
	console.log("✅ Latest log file found:", logPaths);
	return path.join(logPaths, files[0]);
	
}

function getCurrentJournalLines(): string[] {
	const currentLogFile = getLatestLogFile();
	if (!currentLogFile) {
		return [];
	}

	return readJournalLines(currentLogFile);
}

/**
 * A function to get the ShipLoadout
 * @returns A ShipLoadout object or null
 */
export function getLoadout(): ShipLoadout | null {
	if (latestLoadout != null) {
		return latestLoadout;
	}
	let lastLoadout: ShipLoadout | null = null;
	for (const line of getCurrentJournalLines()) {
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
	if (latestDepot != null) {
		return latestDepot;
	}
	let lastDepot: ColonisationConstructionDepot | null = null;
	try {
		for (const line of getCurrentJournalLines()) {
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
	if (latestFileHeader != null) {
		return latestFileHeader;
	}
	let lastFileHeader: FileHeader | null = null;
	try {
		for (const line of getCurrentJournalLines()) {
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
		console.debug(
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

/**
 * Subscribe to journal updates (batched, fires once per second)
 * @param callback Function to call with accumulated event types and their changes
 */
export function onJournalUpdate(callback: (events: EventEnum[], changes: EventChangeMap) => void): void {
	updateCallbacks.push(callback);
}

export function onJournalFileChange(callback: (changes: JournalFileChangeEvent[]) => void): void {
	fileChangeCallbacks.push(callback);
}
