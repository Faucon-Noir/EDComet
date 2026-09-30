/// <reference types="jest" />

import * as fs from "fs";
import { EventEnum } from "ed-shared";
import {
  getCurrentJournalLines,
  getLatestMarketState,
  setLatestMarket,
} from "../../src/services/LogInterpreterService";
import { getLogsPath } from "../../src/utils/utils";
import {
  calculateActualPurchaseCost,
  getLatestMarket,
  getMarketBuys,
} from "../../src/services/MarketService";

jest.mock("../../src/services/LogInterpreterService", () => ({
  getCurrentJournalLines: jest.fn(),
  getLatestMarketState: jest.fn(),
  setLatestMarket: jest.fn(),
}));

jest.mock("../../src/utils/utils", () => ({
  getLogsPath: jest.fn(),
}));

jest.mock("fs", () => ({
  ...jest.requireActual("fs"),
  existsSync: jest.fn(),
  readFileSync: jest.fn(),
}));

const mockedGetCurrentJournalLines =
  getCurrentJournalLines as jest.MockedFunction<typeof getCurrentJournalLines>;
const mockedGetLatestMarketState = getLatestMarketState as jest.MockedFunction<
  typeof getLatestMarketState
>;
const mockedSetLatestMarket = setLatestMarket as jest.MockedFunction<
  typeof setLatestMarket
>;
const mockedGetLogsPath = getLogsPath as jest.MockedFunction<
  typeof getLogsPath
>;

describe("MarketService", () => {
  beforeEach(() => {
    mockedGetCurrentJournalLines.mockReset().mockReturnValue([]);
    mockedGetLatestMarketState.mockReset().mockReturnValue(null);
    mockedSetLatestMarket.mockReset();
    mockedGetLogsPath.mockReset().mockReturnValue("C:/logs");
    (fs.existsSync as jest.Mock).mockReset().mockReturnValue(false);
    (fs.readFileSync as jest.Mock).mockReset();
  });

  it("returns the market cached by the log interpreter", () => {
    const market = { event: EventEnum.Market, Items: [] } as any;
    mockedGetLatestMarketState.mockReturnValue(market);

    expect(getLatestMarket()).toBe(market);
    expect(mockedGetLogsPath).not.toHaveBeenCalled();
  });

  it("returns null when logs or Market.json are unavailable", () => {
    mockedGetLogsPath.mockReturnValue(null);
    expect(getLatestMarket()).toBeNull();

    mockedGetLogsPath.mockReturnValue("C:/logs");
    expect(getLatestMarket()).toBeNull();
    expect(fs.existsSync).toHaveBeenCalledWith(
      expect.stringContaining("Market.json"),
    );
  });

  it("reads and caches a valid Market.json payload", () => {
    const market = { event: EventEnum.Market, Items: [], MarketID: 7 };
    (fs.existsSync as jest.Mock).mockReturnValue(true);
    (fs.readFileSync as jest.Mock).mockReturnValue(JSON.stringify(market));

    expect(getLatestMarket()).toEqual(market);
    expect(mockedSetLatestMarket).toHaveBeenCalledWith(market);
  });

  it("rejects market payloads with an unexpected event or invalid items", () => {
    (fs.existsSync as jest.Mock).mockReturnValue(true);
    (fs.readFileSync as jest.Mock)
      .mockReturnValueOnce(
        JSON.stringify({ event: EventEnum.Loadout, Items: [] }),
      )
      .mockReturnValueOnce(
        JSON.stringify({ event: EventEnum.Market, Items: {} }),
      );

    expect(getLatestMarket()).toBeNull();
    expect(getLatestMarket()).toBeNull();
    expect(mockedSetLatestMarket).not.toHaveBeenCalled();
  });

  it("returns null when Market.json cannot be parsed or read", () => {
    const warn = jest.spyOn(console, "warn").mockImplementation(() => {});
    (fs.existsSync as jest.Mock).mockReturnValue(true);
    (fs.readFileSync as jest.Mock)
      .mockReturnValueOnce("not-json")
      .mockImplementationOnce(() => {
        throw new Error("unreadable");
      });

    expect(getLatestMarket()).toBeNull();
    expect(getLatestMarket()).toBeNull();
    expect(warn).toHaveBeenCalledTimes(2);
  });

  it("parses MarketBuy events and skips malformed journal lines", () => {
    const warn = jest.spyOn(console, "warn").mockImplementation(() => {});
    mockedGetCurrentJournalLines.mockReturnValue([
      "not-json",
      JSON.stringify({ event: EventEnum.MarketBuy, TotalCost: 100 }),
      JSON.stringify({ event: EventEnum.Loadout }),
      JSON.stringify({ event: EventEnum.MarketBuy, TotalCost: 30 }),
    ]);

    expect(getMarketBuys()).toEqual([
      expect.objectContaining({ TotalCost: 100 }),
      expect.objectContaining({ TotalCost: 30 }),
    ]);
    expect(warn).toHaveBeenCalledTimes(1);
  });

  it("sums purchase costs from the journal", () => {
    mockedGetCurrentJournalLines.mockReturnValue([
      JSON.stringify({ event: EventEnum.MarketBuy, TotalCost: 125 }),
      JSON.stringify({ event: EventEnum.MarketBuy, TotalCost: 75 }),
    ]);

    expect(calculateActualPurchaseCost()).toBe(200);
  });
});
