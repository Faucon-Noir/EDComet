/// <reference types="jest" />

import { EventEmitter } from "events";
import { EventEnum } from "ed-shared";

type TestModule = typeof import("../../src/services/LogInterpreterService");

describe("LogInterpreterService", () => {
  beforeEach(() => {
    jest.resetModules();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  function loadService(options?: {
    logsPath?: string | null;
    journalFiles?: string[];
    journalContent?: string;
    marketExists?: boolean;
    marketContent?: string;
  }): { mod: TestModule; watcher: EventEmitter } {
    const opts = {
      logsPath: "C:/logs",
      journalFiles: ["Journal.20260910T120000.log"],
      journalContent: "",
      marketExists: false,
      marketContent: "",
      ...options,
    };

    const watcher = new EventEmitter();

    jest.doMock("../../src/utils/utils", () => ({
      getLogsPath: jest.fn(() => opts.logsPath),
    }));

    jest.doMock("../../src/utils/watcher", () => ({
      LogFileWatcher: jest.fn(() => watcher),
    }));

    jest.doMock("fs", () => {
      const actual = jest.requireActual("fs");
      return {
        ...actual,
        readdirSync: jest.fn(() => opts.journalFiles),
        existsSync: jest.fn((targetPath: string) => {
          if (String(targetPath).endsWith("Market.json")) {
            return opts.marketExists;
          }
          return true;
        }),
        readFileSync: jest.fn((targetPath: string) => {
          if (String(targetPath).endsWith("Market.json")) {
            return opts.marketContent;
          }
          return opts.journalContent;
        }),
      };
    });

    const mod = require("../../src/services/LogInterpreterService") as TestModule;
    return { mod, watcher };
  }

  it("throws when logs path is unavailable", () => {
    const { mod } = loadService({ logsPath: null });
    expect(() => mod.getLatestLogFile()).toThrow("Logs path is unavailable");
  });

  it("returns most recent journal file", () => {
    const { mod } = loadService({
      journalFiles: [
        "Journal.20260908T010101.log",
        "Journal.20260910T010101.log",
        "Journal.20260909T010101.log",
      ],
    });

    expect(mod.getLatestLogFile()).toContain("Journal.20260910T010101.log");
  });

  it("throws when no journal files are found", () => {
    const { mod } = loadService({ journalFiles: [] });
    expect(() => mod.getLatestLogFile()).toThrow("No journal log file found");
  });

  it("returns latest loadout from journal content", () => {
    const { mod } = loadService({
      journalContent: [
        "not-json",
        JSON.stringify({ event: EventEnum.Loadout, Ship: "CobraMkIII", CargoCapacity: 32 }),
        JSON.stringify({ event: EventEnum.Loadout, Ship: "Type9", CargoCapacity: 700 }),
      ].join("\n"),
    });

    expect(mod.getLoadout()).toEqual(
      expect.objectContaining({ Ship: "Type9", CargoCapacity: 700 }),
    );
  });

  it("returns null when the journal contains no loadout", () => {
    const { mod } = loadService({
      journalContent: JSON.stringify({ event: EventEnum.MarketBuy, TotalCost: 50 }),
    });

    expect(mod.getLoadout()).toBeNull();
  });

  it("returns latest construction depot from journal content", () => {
    const { mod } = loadService({
      journalContent: [
        JSON.stringify({ event: EventEnum.ColonisationConstructionDepot, MarketID: 1, ConstructionProgress: 0.1 }),
        JSON.stringify({ event: EventEnum.ColonisationConstructionDepot, MarketID: 2, ConstructionProgress: 0.4 }),
      ].join("\n"),
    });

    expect(mod.getLatestConstructionDepot()).toEqual(
      expect.objectContaining({ MarketID: 2, ConstructionProgress: 0.4 }),
    );
  });

  it("returns null for absent or malformed construction depot events", () => {
    const { mod } = loadService({ journalContent: "invalid-json" });
    expect(mod.getLatestConstructionDepot()).toBeNull();
  });

  it("returns latest file header and commander", () => {
    const { mod } = loadService({
      journalContent: [
        JSON.stringify({ event: EventEnum.FileHeader, gameversion: "4.0", language: "French/FR" }),
        JSON.stringify({ event: EventEnum.Commander, commander: { Name: "CMDR Test" } }),
      ].join("\n"),
    });

    expect(mod.getFileHeader()).toEqual(
      expect.objectContaining({ gameversion: "4.0", language: "French/FR" }),
    );
    expect(mod.getLatestCommander()).toEqual(expect.objectContaining({ Name: "CMDR Test" }));
  });

  it("returns null for absent or malformed file header and commander events", () => {
    const { mod } = loadService({ journalContent: "invalid-json" });

    expect(mod.getFileHeader()).toBeNull();
    expect(mod.getLatestCommander()).toBeNull();
  });

  it("returns latest market when Market.json is valid", () => {
    const { mod } = loadService({
      marketExists: true,
      marketContent: JSON.stringify({
        event: EventEnum.Market,
        MarketID: 7,
        StationName: "Jameson",
        StationType: "Orbis",
        StarSystem: "Shinrarta Dezhra",
        Items: [],
      }),
    });

    expect(mod.getLatestMarket()).toEqual(expect.objectContaining({ MarketID: 7 }));
  });

  it("returns null for invalid market payload", () => {
    const { mod } = loadService({
      marketExists: true,
      marketContent: JSON.stringify({ event: EventEnum.Loadout, Items: [] }),
    });

    expect(mod.getLatestMarket()).toBeNull();
  });

  it("returns null when Market.json is missing or malformed", () => {
    const missingMarket = loadService({ marketExists: false });
    expect(missingMarket.mod.getLatestMarket()).toBeNull();

    const malformedMarket = loadService({
      marketExists: true,
      marketContent: "invalid-json",
    });
    expect(malformedMarket.mod.getLatestMarket()).toBeNull();
  });

  it("returns all market buy events from journal", () => {
    const { mod } = loadService({
      journalContent: [
        JSON.stringify({ event: EventEnum.MarketBuy, TotalCost: 100 }),
        JSON.stringify({ event: EventEnum.Loadout }),
        JSON.stringify({ event: EventEnum.MarketBuy, TotalCost: 20 }),
      ].join("\n"),
    });

    const buys = mod.getMarketBuys();
    expect(buys).toHaveLength(2);
    expect(buys[0]).toEqual(expect.objectContaining({ TotalCost: 100 }));
    expect(buys[1]).toEqual(expect.objectContaining({ TotalCost: 20 }));
  });

  it("skips malformed MarketBuy journal lines", () => {
    const { mod } = loadService({
      journalContent: [
        "invalid-json",
        JSON.stringify({ event: EventEnum.MarketBuy, TotalCost: 20 }),
      ].join("\n"),
    });

    expect(mod.getMarketBuys()).toEqual([
      expect.objectContaining({ TotalCost: 20 }),
    ]);
  });

  it("emits batched journal update from watcher line event", () => {
    const { mod, watcher } = loadService();
    const callback = jest.fn();
    mod.onJournalUpdate(callback);

    watcher.emit("line", JSON.stringify({ event: EventEnum.Loadout, Ship: "Asp", CargoCapacity: 64 }));
    jest.advanceTimersByTime(550);

    expect(callback).toHaveBeenCalledTimes(1);
    const [events, changes] = callback.mock.calls[0] as [EventEnum[], Record<EventEnum, string>];
    expect(events).toContain(EventEnum.Loadout);
    expect(changes[EventEnum.Loadout]).toContain("Ship: Asp");
  });

  it("caches watcher events and includes depot and header summaries", () => {
    const { mod, watcher } = loadService();
    const callback = jest.fn();
    mod.onJournalUpdate(callback);

    watcher.emit("line", JSON.stringify({
      event: EventEnum.ColonisationConstructionDepot,
      ConstructionProgress: 0.25,
      ResourcesRequired: [{ Name: "Steel" }],
    }));
    watcher.emit("line", JSON.stringify({
      event: EventEnum.FileHeader,
      gameversion: "4.1",
      language: "English/UK",
    }));
    watcher.emit("line", JSON.stringify({ event: EventEnum.MarketBuy }));
    jest.advanceTimersByTime(550);

    const [events, changes] = callback.mock.calls[0] as [EventEnum[], Record<EventEnum, string>];
    expect(events).toEqual(expect.arrayContaining([
      EventEnum.ColonisationConstructionDepot,
      EventEnum.FileHeader,
      EventEnum.MarketBuy,
    ]));
    expect(changes[EventEnum.ColonisationConstructionDepot]).toBe("Progress: 25.0% (1 resources)");
    expect(changes[EventEnum.FileHeader]).toBe("Version: 4.1 - Language: English/UK");
    expect(changes[EventEnum.MarketBuy]).toBe("Unknown change");
    expect(mod.getLatestConstructionDepot()).toEqual(expect.objectContaining({ ConstructionProgress: 0.25 }));
    expect(mod.getFileHeader()).toEqual(expect.objectContaining({ gameversion: "4.1" }));
  });

  it("refreshes cached state when the watcher switches journals", () => {
    const { mod, watcher } = loadService({
      journalContent: [
        JSON.stringify({ event: EventEnum.Loadout, Ship: "Python", CargoCapacity: 192 }),
        "invalid-json",
      ].join("\n"),
    });
    const callback = jest.fn();
    mod.onJournalFileChange(callback);

    watcher.emit("file-change", {
      type: "journal-switched",
      fileName: "Journal.20260910.log",
      filePath: "C:/logs/Journal.20260910.log",
      change: "created",
    });
    jest.advanceTimersByTime(550);

    expect(mod.getLoadout()).toEqual(expect.objectContaining({ Ship: "Python" }));
    expect(callback).toHaveBeenCalledWith([
      expect.objectContaining({ type: "journal-switched", change: "created" }),
    ]);
  });

  it("emits batched file changes from watcher file-change event", () => {
    const { mod, watcher } = loadService();
    const callback = jest.fn();
    mod.onJournalFileChange(callback);

    watcher.emit("file-change", {
      type: "support-file",
      fileName: "Market.json",
      filePath: "C:/logs/Market.json",
      change: "updated",
    });
    jest.advanceTimersByTime(550);

    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback.mock.calls[0][0]).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ fileName: "Market.json", change: "updated" }),
      ]),
    );
  });

  it("invalidates cached market after Market.json update", () => {
    const { mod, watcher } = loadService({
      marketExists: true,
      marketContent: JSON.stringify({ event: EventEnum.Market, MarketID: 7, Items: [] }),
    });

    expect(mod.getLatestMarket()).toEqual(expect.objectContaining({ MarketID: 7 }));
    watcher.emit("file-change", {
      type: "support-file",
      fileName: "Market.json",
      filePath: "C:/logs/Market.json",
      change: "updated",
    });
    jest.advanceTimersByTime(550);

    expect(mod.getLatestMarket()).toEqual(expect.objectContaining({ MarketID: 7 }));
  });

  it("ignores malformed watcher line payloads without notifying subscribers", () => {
    const { mod, watcher } = loadService();
    const callback = jest.fn();
    const logSpy = jest.spyOn(console, "log").mockImplementation();
    mod.onJournalUpdate(callback);

    watcher.emit("line", "{bad-json");
    jest.advanceTimersByTime(550);

    expect(callback).not.toHaveBeenCalled();
    expect(logSpy).toHaveBeenCalledWith("🚧 Watch error", expect.any(String));
  });

  it("deduplicates file-change events by type and file name in one batch", () => {
    const { mod, watcher } = loadService();
    const callback = jest.fn();
    mod.onJournalFileChange(callback);

    watcher.emit("file-change", {
      type: "support-file",
      fileName: "Market.json",
      filePath: "C:/logs/Market.json",
      change: "created",
    });
    watcher.emit("file-change", {
      type: "support-file",
      fileName: "Market.json",
      filePath: "C:/logs/Market.json",
      change: "updated",
    });
    jest.advanceTimersByTime(550);

    expect(callback).toHaveBeenCalledTimes(1);
    const batched = callback.mock.calls[0][0] as Array<{ change: string; fileName: string }>;
    expect(batched).toHaveLength(1);
    expect(batched[0]).toEqual(expect.objectContaining({ fileName: "Market.json", change: "updated" }));
  });
});
