/// <reference types="jest" />

import { EventEmitter } from "events";

jest.mock("../../src/services/LogInterpreterService", () => ({
  getLatestLogFile: jest.fn(),
}));

jest.mock("../../src/utils/utils", () => ({
  getLogsPath: jest.fn(),
}));

jest.mock("fs", () => {
  const actual = jest.requireActual("fs");
  return {
    ...actual,
    statSync: jest.fn(),
    existsSync: jest.fn(),
    createReadStream: jest.fn(),
  };
});

import fs from "fs";
import { getLatestLogFile } from "../../src/services/LogInterpreterService";
import { getLogsPath } from "../../src/utils/utils";
import { LogFileWatcher } from "../../src/utils/watcher";

const mockedStatSync = fs.statSync as unknown as jest.MockedFunction<typeof fs.statSync>;
const mockedExistsSync = fs.existsSync as unknown as jest.MockedFunction<typeof fs.existsSync>;
const mockedCreateReadStream = fs.createReadStream as unknown as jest.MockedFunction<typeof fs.createReadStream>;
const mockedGetLatestLogFile = getLatestLogFile as jest.MockedFunction<typeof getLatestLogFile>;
const mockedGetLogsPath = getLogsPath as jest.MockedFunction<typeof getLogsPath>;

describe("LogFileWatcher", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    mockedStatSync.mockReset();
    mockedExistsSync.mockReset();
    mockedCreateReadStream.mockReset();
    mockedGetLatestLogFile.mockReset();
    mockedGetLogsPath.mockReset();
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  it("does not start when logs path is unavailable", () => {
    mockedGetLogsPath.mockReturnValue(null);
    mockedGetLatestLogFile.mockReturnValue("C:/logs/Journal.2026.log");

    const watcher = new LogFileWatcher();
    const handler = jest.fn();
    watcher.on("file-change", handler);

    jest.advanceTimersByTime(1200);
    expect(handler).not.toHaveBeenCalled();
    watcher.close();
  });

  it("emits journal-switched and line events when journal file changes", () => {
    mockedGetLogsPath.mockReturnValue("C:/logs");
    mockedGetLatestLogFile
      .mockReturnValueOnce("C:/logs/Journal.20260101.log")
      .mockReturnValueOnce("C:/logs/Journal.20260102.log");

    mockedExistsSync.mockReturnValue(false);

    mockedStatSync.mockImplementation((targetPath) => {
      const value = String(targetPath);
      if (value.includes("20260101")) {
        return { size: 10, mtimeMs: 1 } as any;
      }
      if (value.includes("20260102")) {
        return { size: 30, mtimeMs: 2 } as any;
      }
      return { size: 0, mtimeMs: 0 } as any;
    });

    mockedCreateReadStream.mockImplementation(() => {
      const stream = new EventEmitter() as any;
      process.nextTick(() => {
        stream.emit("data", '{"event":"Loadout"}\n');
        stream.emit("end");
      });
      return stream;
    });

    const watcher = new LogFileWatcher();
    const fileChanges: any[] = [];
    const lines: string[] = [];

    watcher.on("file-change", (payload) => fileChanges.push(payload));
    watcher.on("line", (line) => lines.push(line));

    jest.advanceTimersByTime(1000);

    expect(fileChanges.some((change) => change.type === "journal-switched")).toBe(true);
    expect(lines).toContain('{"event":"Loadout"}');
    watcher.close();
  });

  it("emits support-file created and updated events", () => {
    mockedGetLogsPath.mockReturnValue("C:/logs");
    mockedGetLatestLogFile.mockReturnValue("C:/logs/Journal.20260101.log");

    let marketExists = false;
    let marketMtime = 10;

    mockedExistsSync.mockImplementation((targetPath) => {
      const value = String(targetPath);
      if (value.endsWith("Market.json")) {
        return marketExists;
      }
      return true;
    });

    mockedStatSync.mockImplementation((targetPath) => {
      const value = String(targetPath);
      if (value.endsWith("Market.json")) {
        return { size: 100, mtimeMs: marketMtime } as any;
      }
      return { size: 50, mtimeMs: 1 } as any;
    });

    mockedCreateReadStream.mockImplementation(() => new EventEmitter() as any);

    const watcher = new LogFileWatcher();
    const events: any[] = [];
    watcher.on("file-change", (payload) => events.push(payload));

    marketExists = true;
    jest.advanceTimersByTime(1000);

    marketMtime = 20;
    jest.advanceTimersByTime(1000);

    expect(events.some((item) => item.type === "support-file" && item.change === "created")).toBe(true);
    expect(events.some((item) => item.type === "support-file" && item.change === "updated")).toBe(true);
    watcher.close();
  });

  it("ignores empty journal reads and unavailable journal files", () => {
    mockedGetLogsPath.mockReturnValue("C:/logs");
    mockedGetLatestLogFile.mockReturnValue("C:/logs/Journal.20260101.log");
    mockedExistsSync.mockReturnValue(false);
    mockedStatSync.mockReturnValue({ size: 50, mtimeMs: 1 } as any);

    const watcher = new LogFileWatcher();
    const lineHandler = jest.fn();
    watcher.on("line", lineHandler);

    (watcher as any).readNewLines(50, 50);
    mockedGetLatestLogFile.mockReturnValue(null as any);
    (watcher as any).pollJournal();

    expect(mockedCreateReadStream).not.toHaveBeenCalled();
    expect(lineHandler).not.toHaveBeenCalled();
    watcher.close();
  });

  it("handles journal stat and switched-file read errors", () => {
    mockedGetLogsPath.mockReturnValue("C:/logs");
    mockedGetLatestLogFile.mockReturnValue("C:/logs/Journal.20260101.log");
    mockedExistsSync.mockReturnValue(false);
    mockedStatSync.mockReturnValue({ size: 50, mtimeMs: 1 } as any);

    const watcher = new LogFileWatcher();
    const warnSpy = jest.spyOn(console, "warn").mockImplementation();

    mockedStatSync.mockImplementation(() => {
      throw new Error("cannot stat");
    });
    (watcher as any).pollJournal();

    mockedGetLatestLogFile.mockReturnValue("C:/logs/Journal.20260102.log");
    (watcher as any).pollJournal();

    expect(warnSpy).toHaveBeenCalledWith("🚧 Unable to stat journal:", "cannot stat");
    expect(warnSpy).toHaveBeenCalledWith("🚧 Unable to read switched journal:", "cannot stat");
    watcher.close();
  });

  it("does not emit when journal size and support-file timestamp are unchanged", () => {
    mockedGetLogsPath.mockReturnValue("C:/logs");
    mockedGetLatestLogFile.mockReturnValue("C:/logs/Journal.20260101.log");
    mockedExistsSync.mockReturnValue(true);
    mockedStatSync.mockImplementation((targetPath) => {
      if (String(targetPath).endsWith("Market.json")) {
        return { size: 100, mtimeMs: 10 } as any;
      }
      return { size: 50, mtimeMs: 1 } as any;
    });

    const watcher = new LogFileWatcher();
    const handler = jest.fn();
    watcher.on("file-change", handler);

    jest.advanceTimersByTime(1000);

    expect(handler).not.toHaveBeenCalled();
    watcher.close();
  });

  it("handles journal stream read errors", () => {
    mockedGetLogsPath.mockReturnValue("C:/logs");
    mockedGetLatestLogFile
      .mockReturnValueOnce("C:/logs/Journal.20260101.log")
      .mockReturnValue("C:/logs/Journal.20260101.log");
    mockedExistsSync.mockReturnValue(false);
    mockedStatSync
      .mockReturnValueOnce({ size: 10, mtimeMs: 1 } as any)
      .mockReturnValueOnce({ size: 20, mtimeMs: 1 } as any);

    mockedCreateReadStream.mockImplementation(() => {
      const stream = new EventEmitter() as any;
      process.nextTick(() => {
        stream.emit("error", new Error("stream broke"));
      });
      return stream;
    });

    const warnSpy = jest.spyOn(console, "warn").mockImplementation();
    const watcher = new LogFileWatcher();

    jest.advanceTimersByTime(1000);

    expect(warnSpy).toHaveBeenCalledWith("🚧 Journal stream read error:", "stream broke");
    watcher.close();
  });
});
