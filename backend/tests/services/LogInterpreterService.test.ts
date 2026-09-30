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

    const mod =
      require("../../src/services/LogInterpreterService") as TestModule;
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

  it("stores and returns cached journal state", () => {
    const { mod } = loadService();
    const loadout = { event: EventEnum.Loadout, Ship: "Python" } as any;
    const depot = {
      event: EventEnum.ColonisationConstructionDepot,
      MarketID: 42,
    } as any;
    const header = { event: EventEnum.FileHeader, gameversion: "4.0" } as any;
    const commander = { Name: "CMDR Test" } as any;
    const market = { event: EventEnum.Market, Items: [] } as any;
    const stats = { event: EventEnum.Stats } as any;
    const missions = {
      event: EventEnum.Missions,
      Active: [],
      Failed: [],
      Complete: [],
    } as any;

    mod.setLatestLoadout(loadout);
    mod.setLatestDepot(depot);
    mod.setLatestFileHeader(header);
    mod.setLatestCommander(commander);
    mod.setLatestMarket(market);
    mod.setLatestStats(stats);
    mod.setLatestMissions(missions);

    expect(mod.getLatestLoadout()).toBe(loadout);
    expect(mod.getLatestDepot()).toBe(depot);
    expect(mod.getFileHeader()).toBe(header);
    expect(mod.getLatestCommander()).toBe(commander);
    expect(mod.getLatestMarketState()).toBe(market);
    expect(mod.getLatestStatsState()).toBe(stats);
    expect(mod.getLatestMissionsState()).toBe(missions);
  });

  it("returns latest file header and commander", () => {
    const { mod } = loadService({
      journalContent: [
        JSON.stringify({
          event: EventEnum.FileHeader,
          gameversion: "4.0",
          language: "French/FR",
        }),
        JSON.stringify({
          event: EventEnum.Commander,
          commander: { Name: "CMDR Test" },
        }),
      ].join("\n"),
    });

    expect(mod.getFileHeader()).toEqual(
      expect.objectContaining({ gameversion: "4.0", language: "French/FR" }),
    );
    expect(mod.getLatestCommander()).toEqual(
      expect.objectContaining({ Name: "CMDR Test" }),
    );
  });

  it("returns null for absent or malformed file header and commander events", () => {
    const { mod } = loadService({ journalContent: "invalid-json" });

    expect(mod.getFileHeader()).toBeNull();
    expect(mod.getLatestCommander()).toBeNull();
  });

  it("emits batched journal update from watcher line event", () => {
    const { mod, watcher } = loadService();
    const callback = jest.fn();
    mod.onJournalUpdate(callback);

    watcher.emit(
      "line",
      JSON.stringify({
        event: EventEnum.Loadout,
        Ship: "Asp",
        CargoCapacity: 64,
      }),
    );
    jest.advanceTimersByTime(550);

    expect(callback).toHaveBeenCalledTimes(1);
    const [events, changes] = callback.mock.calls[0] as [
      EventEnum[],
      Record<EventEnum, string>,
    ];
    expect(events).toContain(EventEnum.Loadout);
    expect(changes[EventEnum.Loadout]).toContain("Ship: Asp");
  });

  it("caches watcher events and includes depot and header summaries", () => {
    const { mod, watcher } = loadService();
    const callback = jest.fn();
    mod.onJournalUpdate(callback);

    watcher.emit(
      "line",
      JSON.stringify({
        event: EventEnum.ColonisationConstructionDepot,
        ConstructionProgress: 0.25,
        ResourcesRequired: [{ Name: "Steel" }],
      }),
    );
    watcher.emit(
      "line",
      JSON.stringify({
        event: EventEnum.FileHeader,
        gameversion: "4.1",
        language: "English/UK",
      }),
    );
    watcher.emit(
      "line",
      JSON.stringify({
        event: EventEnum.Commander,
        commander: { Name: "CMDR Test" },
      }),
    );
    watcher.emit(
      "line",
      JSON.stringify({
        event: EventEnum.Market,
        Items: [],
      }),
    );
    watcher.emit(
      "line",
      JSON.stringify({
        event: EventEnum.Stats,
        Bank_Account: { Current_Wealth: 12345 },
      }),
    );
    watcher.emit("line", JSON.stringify({ event: EventEnum.MarketBuy }));
    watcher.emit(
      "line",
      JSON.stringify({
        event: EventEnum.Missions,
        Active: [{ MissionID: 1 }],
        Failed: [],
        Complete: [],
      }),
    );
    watcher.emit("line", "null");
    watcher.emit("line", "[]");
    watcher.emit("line", "{}");
    watcher.emit("line", JSON.stringify({ event: EventEnum.Commander }));
    watcher.emit("line", JSON.stringify({ event: EventEnum.Market }));
    jest.advanceTimersByTime(550);

    const [events, changes] = callback.mock.calls[0] as [
      EventEnum[],
      Record<EventEnum, string>,
    ];
    expect(events).toEqual(
      expect.arrayContaining([
        EventEnum.ColonisationConstructionDepot,
        EventEnum.FileHeader,
        EventEnum.Commander,
        EventEnum.Market,
        EventEnum.Stats,
        EventEnum.MarketBuy,
        EventEnum.Missions,
      ]),
    );
    expect(changes[EventEnum.ColonisationConstructionDepot]).toBe(
      "Progress: 25.0% (1 resources)",
    );
    expect(changes[EventEnum.FileHeader]).toBe(
      "Version: 4.1 - Language: English/UK",
    );
    expect(changes[EventEnum.Commander]).toBe("Unknown change");
    expect(changes[EventEnum.Market]).toBe("Unknown change");
    expect(changes[EventEnum.Stats]).toBe("Wealth: 12345");
    expect(changes[EventEnum.MarketBuy]).toBe("Unknown change");
    expect(changes[EventEnum.Missions]).toBe(
      "Active: 1 - Failed: 0 - Complete: 0",
    );
    expect(mod.getLatestDepot()).toEqual(
      expect.objectContaining({ ConstructionProgress: 0.25 }),
    );
    expect(mod.getFileHeader()).toEqual(
      expect.objectContaining({ gameversion: "4.1" }),
    );
    expect(mod.getLatestCommander()).toEqual(
      expect.objectContaining({ Name: "CMDR Test" }),
    );
    expect(mod.getLatestMarketState()).toEqual(
      expect.objectContaining({ Items: [] }),
    );
    expect(mod.getLatestStatsState()).toEqual(
      expect.objectContaining({
        Bank_Account: { Current_Wealth: 12345 },
      }),
    );
    expect(mod.getLatestMissionsState()).toEqual(
      expect.objectContaining({ Active: [{ MissionID: 1 }] }),
    );
  });

  it("refreshes cached state when the watcher switches journals", () => {
    const { mod, watcher } = loadService({
      journalContent: [
        JSON.stringify({
          event: EventEnum.Loadout,
          Ship: "Python",
          CargoCapacity: 192,
        }),
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

    expect(mod.getLatestLoadout()).toEqual(
      expect.objectContaining({ Ship: "Python" }),
    );
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
    const { mod, watcher } = loadService();
    const market = { event: EventEnum.Market, MarketID: 7, Items: [] } as any;
    mod.setLatestMarket(market);

    expect(mod.getLatestMarketState()).toBe(market);
    watcher.emit("file-change", {
      type: "support-file",
      fileName: "Market.json",
      filePath: "C:/logs/Market.json",
      change: "updated",
    });
    jest.advanceTimersByTime(550);

    expect(mod.getLatestMarketState()).toBeNull();
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
    const batched = callback.mock.calls[0][0] as Array<{
      change: string;
      fileName: string;
    }>;
    expect(batched).toHaveLength(1);
    expect(batched[0]).toEqual(
      expect.objectContaining({ fileName: "Market.json", change: "updated" }),
    );
  });
});
