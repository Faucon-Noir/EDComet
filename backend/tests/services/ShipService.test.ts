/// <reference types="jest" />

import { EventEnum } from "ed-shared";
import {
  getCurrentJournalLines,
  getLatestLoadout,
  setLatestLoadout,
} from "../../src/services/LogInterpreterService";
import { getLoadout } from "../../src/services/ShipService";

jest.mock("../../src/services/LogInterpreterService", () => ({
  getCurrentJournalLines: jest.fn(),
  getLatestLoadout: jest.fn(),
  setLatestLoadout: jest.fn(),
}));

const mockedGetCurrentJournalLines = getCurrentJournalLines as jest.MockedFunction<
  typeof getCurrentJournalLines
>;
const mockedGetLatestLoadout = getLatestLoadout as jest.MockedFunction<
  typeof getLatestLoadout
>;
const mockedSetLatestLoadout = setLatestLoadout as jest.MockedFunction<
  typeof setLatestLoadout
>;

describe("getLoadout", () => {
  beforeEach(() => {
    mockedGetCurrentJournalLines.mockReset().mockReturnValue([]);
    mockedGetLatestLoadout.mockReset().mockReturnValue(null);
    mockedSetLatestLoadout.mockReset();
  });

  it("returns the cached loadout without rereading the journal", () => {
    const loadout = { event: EventEnum.Loadout, Ship: "CobraMkIII" } as any;
    mockedGetLatestLoadout.mockReturnValue(loadout);

    expect(getLoadout()).toBe(loadout);
    expect(mockedGetCurrentJournalLines).not.toHaveBeenCalled();
  });

  it("returns and caches the latest loadout, skipping malformed lines", () => {
    const warn = jest.spyOn(console, "warn").mockImplementation(() => {});
    const loadout = {
      event: EventEnum.Loadout,
      Ship: "Type9",
      CargoCapacity: 700,
    };
    mockedGetCurrentJournalLines.mockReturnValue([
      "not-json",
      JSON.stringify({ event: EventEnum.MarketBuy }),
      JSON.stringify(loadout),
    ]);

    expect(getLoadout()).toEqual(loadout);
    expect(mockedSetLatestLoadout).toHaveBeenCalledWith(loadout);
    expect(warn).toHaveBeenCalledTimes(1);
  });

  it("returns null when no loadout event exists", () => {
    mockedGetCurrentJournalLines.mockReturnValue([
      JSON.stringify({ event: EventEnum.MarketBuy }),
    ]);

    expect(getLoadout()).toBeNull();
    expect(mockedSetLatestLoadout).not.toHaveBeenCalled();
  });
});