/// <reference types="jest" />

import fs from "fs";
import os from "os";
import path from "path";
import { getLanguage, getLogsPath } from "../../src/utils/utils";
import { getFileHeader } from "../../src/services/LogInterpreterService";

jest.mock("../../src/services/LogInterpreterService", () => ({
  getFileHeader: jest.fn(),
}));

const mockedGetFileHeader = getFileHeader as jest.MockedFunction<typeof getFileHeader>;

describe("utils", () => {
  afterEach(() => {
    jest.restoreAllMocks();
    mockedGetFileHeader.mockReset();
    delete process.env.ED_JOURNAL_PATH;
  });

  it("returns journal path when it exists", () => {
    const platform = Object.getOwnPropertyDescriptor(process, "platform");
    Object.defineProperty(process, "platform", { value: "win32" });
    jest.spyOn(os, "homedir").mockReturnValue("C:/Users/test");
    jest.spyOn(fs, "existsSync").mockImplementation((inputPath) =>
      String(inputPath).includes(path.join("Saved Games", "Frontier Developments", "Elite Dangerous")),
    );

    const result = getLogsPath();
    expect(result).toContain(path.join("Saved Games", "Frontier Developments", "Elite Dangerous"));

    Object.defineProperty(process, "platform", platform!);
  });

  it("returns the ED_JOURNAL_PATH fixture directory when set, emulating a real journal folder", () => {
    const fixturePath = path.join(__dirname, "..", "fixtures", "journal");
    process.env.ED_JOURNAL_PATH = fixturePath;

    expect(getLogsPath()).toBe(fixturePath);
    expect(fs.existsSync(fixturePath)).toBe(true);

    delete process.env.ED_JOURNAL_PATH;
  });

  it("returns null when no journal path exists", () => {
    jest.spyOn(os, "homedir").mockReturnValue("C:/Users/test");
    jest.spyOn(fs, "existsSync").mockReturnValue(false);

    expect(getLogsPath()).toBeNull();
  });

  it("returns a Linux Steam journal path when available", () => {
    const platform = Object.getOwnPropertyDescriptor(process, "platform");
    Object.defineProperty(process, "platform", { value: "linux" });
    process.env.XDG_DATA_HOME = "/home/test/.local/share";
    jest.spyOn(os, "homedir").mockReturnValue("/home/test");
    jest.spyOn(fs, "existsSync").mockImplementation((inputPath) =>
      String(inputPath).includes("compatdata"),
    );

    expect(getLogsPath()).toContain("compatdata");

    Object.defineProperty(process, "platform", platform!);
    delete process.env.XDG_DATA_HOME;
  });

  it("checks default Linux Steam paths when XDG_DATA_HOME is missing", () => {
    const platform = Object.getOwnPropertyDescriptor(process, "platform");
    Object.defineProperty(process, "platform", { value: "linux" });
    delete process.env.XDG_DATA_HOME;
    jest.spyOn(os, "homedir").mockReturnValue("/home/test");
    jest.spyOn(fs, "existsSync").mockImplementation((inputPath) =>
      String(inputPath).includes(".steam"),
    );

    expect(getLogsPath()).toContain(".steam");

    Object.defineProperty(process, "platform", platform!);
  });

  it("maps English/UK language to en", () => {
    mockedGetFileHeader.mockReturnValue({ language: "English/UK" } as any);
    expect(getLanguage()).toBe("en");
  });

  it("maps French/FR language to fr", () => {
    mockedGetFileHeader.mockReturnValue({ language: "French/FR" } as any);
    expect(getLanguage()).toBe("fr");
  });

  it("falls back to en for unknown language", () => {
    mockedGetFileHeader.mockReturnValue({ language: "German/DE" } as any);
    expect(getLanguage()).toBe("en");
  });

  it("falls back to en when language field is missing", () => {
    mockedGetFileHeader.mockReturnValue({} as any);
    expect(getLanguage()).toBe("en");
  });

  it("falls back to en when no file header is found", () => {
    mockedGetFileHeader.mockReturnValue(null);
    expect(getLanguage()).toBe("en");
  });

  it("falls back to en when reading language throws", () => {
    mockedGetFileHeader.mockImplementation(() => {
      throw new Error("boom");
    });
    expect(getLanguage()).toBe("en");
  });
});
