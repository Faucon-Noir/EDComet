import * as fs from "fs";
import * as path from "path";
import { getLogsPath } from "../utils/utils";
import { LogFileWatcher, type WatchedFileChange } from "../utils/watcher";
import {
  EventEnum,
  ShipLoadout,
  ColonisationConstructionDepot,
  FileHeader,
  getErrorMessage,
  CommanderType,
  Market,
  Stats,
} from "ed-shared";
import { EventChangeMap, JournalFileChangeEvent } from "../utils/type";

let latestLoadout: ShipLoadout | null = null;
let latestDepot: ColonisationConstructionDepot | null = null;
let latestFileHeader: FileHeader | null = null;
let latestCommander: CommanderType | null = null;
let latestMarket: Market | null = null;
let latestStats: Stats | null = null;

const pendingEvents = new Set<EventEnum>();
const pendingChanges = new Map<EventEnum, string>();
let updateCallbacks: ((
  events: EventEnum[],
  changes: EventChangeMap,
) => void)[] = [];
const pendingFileChanges = new Map<string, JournalFileChangeEvent>();
let fileChangeCallbacks: ((changes: JournalFileChangeEvent[]) => void)[] = [];
let batchInterval: NodeJS.Timeout | null = null;

// #region Log Watching and Interpretation
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
      updateCallbacks.forEach((callback) => callback(events, changes));
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
  return content.split("\n").filter((line): boolean => line.trim().length > 0);
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
  if (event.event === EventEnum.Commander && "commander" in event) {
    latestCommander = event.commander as CommanderType;
    recordEventChange(EventEnum.Commander);
  }
  if (event.event === EventEnum.Market && "Items" in event) {
    latestMarket = event as Market;
    recordEventChange(EventEnum.Market);
  }
  if (event.event === EventEnum.Stats) {
    latestStats = event as Stats;
    recordEventChange(EventEnum.Stats);
  }
  if (event.event === EventEnum.MarketBuy) {
    recordEventChange(EventEnum.MarketBuy);
  }
}

function refreshStateFromJournal(logFile: string): void {
  latestLoadout = null;
  latestDepot = null;
  latestFileHeader = null;
  latestCommander = null;
  latestMarket = null;
  latestStats = null;

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

function generateStatsSummary(stats: Stats): string {
  return `Wealth: ${stats.Bank_Account?.Current_Wealth ?? 0}`;
}

function recordEventChange(eventType: EventEnum): void {
  let summary = "Unknown change";

  if (eventType === EventEnum.Loadout && latestLoadout) {
    summary = generateLoadoutSummary(latestLoadout);
  } else if (
    eventType === EventEnum.ColonisationConstructionDepot &&
    latestDepot
  ) {
    summary = generateDepotSummary(latestDepot);
  } else if (eventType === EventEnum.FileHeader && latestFileHeader) {
    summary = generateFileHeaderSummary(latestFileHeader);
  } else if (eventType === EventEnum.Stats && latestStats) {
    summary = generateStatsSummary(latestStats);
  }

  pendingEvents.add(eventType);
  pendingChanges.set(eventType, summary);
  startBatchInterval();
}

export function setLatestLoadout(loadout: ShipLoadout | null): void {
  latestLoadout = loadout;
}

export function setLatestDepot(depot: ColonisationConstructionDepot | null): void {
  latestDepot = depot;
}

export function setLatestFileHeader(fileHeader: FileHeader | null): void {
  latestFileHeader = fileHeader;
}

export function setLatestCommander(commander: CommanderType | null): void {
  latestCommander = commander;
}

export function setLatestMarket(market: Market | null): void {
  latestMarket = market;
}

export function setLatestStats(stats: Stats | null): void {
  latestStats = stats;
}

export function getLatestLoadout(): ShipLoadout | null {
  return latestLoadout;
}

export function getLatestDepot(): ColonisationConstructionDepot | null {
  return latestDepot;
}

export function getLatestMarketState(): Market | null {
  return latestMarket;
}

export function getLatestStatsState(): Stats | null {
  return latestStats;
}

export function getCurrentJournalLines(): string[] {
  const currentLogFile = getLatestLogFile();
  if (!currentLogFile) {
    return [];
  }

  return readJournalLines(currentLogFile);
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

  // Reset latestMarket if the Market.json support file changes
  if (change.type === "support-file" && change.fileName === "Market.json") {
    setLatestMarket(null);
  }

  recordFileChange(change);
});
// #endregion

// #region Getters functions for latest events and file header
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
  return path.join(logPaths, files[0]);
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
      lastFileHeader.timestamp,
    );
  } catch (error: unknown) {
    console.warn("🚧 File Header Interpreter:", getErrorMessage(error));
    return null;
  }

  return lastFileHeader;
}

export function getLatestCommander(): CommanderType | null {
  if (latestCommander != null) {
    return latestCommander;
  }
  let lastCommander: CommanderType | null = null;
  try {
    for (const line of getCurrentJournalLines()) {
      try {
        const event = JSON.parse(line);
        if (event.event === EventEnum.Commander && event.commander) {
          lastCommander = event.commander as CommanderType;
        }
      } catch (err: unknown) {
        console.warn("🚧 Latest Commander foreach:", getErrorMessage(err));
        continue;
      }
    }
    if (!lastCommander) {
      return null;
    }
    console.debug(
      "✅ Found Commander in FileHeader event:",
      lastCommander,
      lastCommander ? `CMDR ${lastCommander.Name}` : "",
    );
  } catch (error: unknown) {
    console.warn("🚧 Latest Commander Interpreter:", getErrorMessage(error));
    return null;
  }

  return lastCommander;
}

// #endregion

// #region Event and File Change Subscription
/**
 * Subscribe to journal updates (batched, fires once per second)
 * @param callback Function to call with accumulated event types and their changes
 */
export function onJournalUpdate(
  callback: (events: EventEnum[], changes: EventChangeMap) => void,
): void {
  updateCallbacks.push(callback);
}

/**
 * A function to subscribe to journal file changes (new file or update of existing file)
 * @param callback Function to call with an array of file change events, containing file name, path, type of change and type of file
 */
export function onJournalFileChange(
  callback: (changes: JournalFileChangeEvent[]) => void,
): void {
  fileChangeCallbacks.push(callback);
}
// #endregion
