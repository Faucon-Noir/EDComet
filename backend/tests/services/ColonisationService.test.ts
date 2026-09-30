/// <reference types="jest" />

import { EventEnum } from "ed-shared";
import {
  getCurrentJournalLines,
  getLatestDepot,
  setLatestDepot,
} from "../../src/services/LogInterpreterService";
import { getLatestConstructionDepot } from "../../src/services/ColonisationService";

jest.mock("../../src/services/LogInterpreterService", () => ({
  getCurrentJournalLines: jest.fn(),
  getLatestDepot: jest.fn(),
  setLatestDepot: jest.fn(),
}));

const mockedGetCurrentJournalLines = getCurrentJournalLines as jest.MockedFunction<
  typeof getCurrentJournalLines
>;
const mockedGetLatestDepot = getLatestDepot as jest.MockedFunction<
  typeof getLatestDepot
>;
const mockedSetLatestDepot = setLatestDepot as jest.MockedFunction<
  typeof setLatestDepot
>;

describe("getLatestConstructionDepot", () => {
  beforeEach(() => {
    mockedGetCurrentJournalLines.mockReset().mockReturnValue([]);
    mockedGetLatestDepot.mockReset().mockReturnValue(null);
    mockedSetLatestDepot.mockReset();
  });

  it("returns the cached depot without rereading the journal", () => {
    const depot = {
      event: EventEnum.ColonisationConstructionDepot,
      MarketID: 5,
    } as any;
    mockedGetLatestDepot.mockReturnValue(depot);

    expect(getLatestConstructionDepot()).toBe(depot);
    expect(mockedGetCurrentJournalLines).not.toHaveBeenCalled();
  });

  it("returns and caches the latest depot event, skipping malformed lines", () => {
    const warn = jest.spyOn(console, "warn").mockImplementation(() => {});
    const firstDepot = {
      event: EventEnum.ColonisationConstructionDepot,
      MarketID: 1,
    };
    const latestDepot = {
      event: EventEnum.ColonisationConstructionDepot,
      MarketID: 2,
    };
    mockedGetCurrentJournalLines.mockReturnValue([
      "not-json",
      JSON.stringify({ event: EventEnum.Loadout }),
      JSON.stringify(firstDepot),
      JSON.stringify(latestDepot),
    ]);

    expect(getLatestConstructionDepot()).toEqual(latestDepot);
    expect(mockedSetLatestDepot).toHaveBeenCalledWith(latestDepot);
    expect(warn).toHaveBeenCalledTimes(1);
  });

  it("returns null when no depot exists or journal reading fails", () => {
    const warn = jest.spyOn(console, "warn").mockImplementation(() => {});
    mockedGetCurrentJournalLines.mockReturnValue([
      JSON.stringify({ event: EventEnum.Loadout }),
    ]);
    expect(getLatestConstructionDepot()).toBeNull();

    mockedGetCurrentJournalLines.mockImplementation(() => {
      throw new Error("journal unavailable");
    });
    expect(getLatestConstructionDepot()).toBeNull();
    expect(warn).toHaveBeenCalledTimes(1);
  });
});